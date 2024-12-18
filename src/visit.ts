import { globalConfig } from './config'
import { load } from './load'
import { merge } from './merge'
import { EventMap, MergeStrategy, Regions, VisitOptions } from './types'
// @ts-ignore (missing types)
import { Idiomorph } from 'idiomorph/dist/idiomorph.esm.js'

export const cache = new Map<string, Document>()

const emit = async <E extends keyof EventMap>(
  type: E,
  payload: EventMap[E]
) => {
  const event = new CustomEvent(`simple-ajax:${type}`, { detail: payload })
  document.dispatchEvent(event)
}

/**
 * Load a new page, merge the containers/bodies and add a new history entry
 * according to the action.
 */
export const visit = async (
  url: string,
  {
    action = 'none',
    emitEvents = true,
    isBackForward = false,
    morphHeads = false,
    merge: mergeStrategy = globalConfig.merge,
    autoFocus = true,
  }: VisitOptions = {}
) => {
  // We only allow one pending visit request at a time. When triggering a new
  // request while the last one is still pending we mimic browser behavior and
  // cancel the pending one.
  // currentVisitController?.abort()
  // currentVisitController = new AbortController()

  if (emitEvents) emit('before-visit', { url })

  let newDocument: Document | undefined
  if (isBackForward) {
    // If this is a back/forward navigation we simulate the browser behavior and
    // try to receive the document from cache ...
    newDocument = cache.get(url)?.cloneNode(true) as Document | undefined
  } else {
    // ... otherwise we cache the document for future back/forward navigation
    // and load the document.
    const cacheId = window.location.pathname + window.location.search
    cache.set(cacheId, document.cloneNode(true) as Document)
  }

  const regions = findRegions(document)
  newDocument ??= await load(url, Array.from(regions.keys()))

  // Only an aborted fetch would return an empty document, all other errors
  // in `load()` trigger a reload.
  if (!newDocument) return

  if (emitEvents) emit('before-render', { url, newDocument })

  if (morphHeads) Idiomorph.morph(document.head, newDocument.head)

  const getMergeStrategy = (oldEl: HTMLElement, newEl: HTMLElement) =>
    newEl.dataset.simpleAjax || oldEl.dataset.simpleAjax || mergeStrategy

  let autoFocusEl: HTMLElement | undefined
  const newRegions = findRegions(newDocument)
  const regionKeys = new Set(regions.keys())
  const newRegionKeys = new Set(newRegions.keys())
  const commonRegionKeys = regionKeys.intersection(newRegionKeys)
  const hasCommonRegions = commonRegionKeys.size > 0

  if (hasCommonRegions) {
    for (const id of commonRegionKeys) {
      const region = regions.get(id)!
      const newRegion = newRegions.get(id)!
      const strategy = getMergeStrategy(region, newRegion)
      const result = merge(region, newRegion, strategy as MergeStrategy)
      // Use the auto-focusable element from the first region that has one.
      autoFocusEl ??= result.autoFocusEl
    }
  } else {
    const region = document.body
    const newRegion = newDocument.body
    const strategy = getMergeStrategy(region, newRegion)
    const result = merge(region, newRegion, strategy as MergeStrategy)
    autoFocusEl = result.autoFocusEl
  }

  if (autoFocus) autoFocusEl?.focus()

  if (action === 'replace') history.replaceState(null, '', url)
  else if (action === 'push') history.pushState(null, '', url)

  if (emitEvents) emit('visit', { url })
}

const findRegions = (doc: Document) => {
  let regions: Regions = new Map()

  doc.querySelectorAll<HTMLElement>('[data-simple-ajax]').forEach((el) => {
    if (!el.id) console.warn(`Ajax region is missing an id:`, el)
    else regions.set(el.id, el)
  })

  return regions
}
