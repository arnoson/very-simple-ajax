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

let currentUrl = window.location.pathname
let prevUrl: string | undefined

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
    morphHeads = globalConfig.morphHeads,
    merge: mergeStrategy = globalConfig.merge,
    autoFocus = true,
  }: VisitOptions = {}
) => {
  prevUrl = currentUrl
  currentUrl = url

  if (emitEvents) emit('before-visit', { url, prevUrl })

  let newDocument: Document | undefined
  // If this is a back/forward navigation we simulate the browser behavior and
  // try to receive the document from cache.
  if (isBackForward) {
    newDocument = cache.get(url)?.cloneNode(true) as Document | undefined
  }

  // Load the new document if we don't use it from cache.
  const regions = findRegions(document)
  newDocument ??= await load(url, Array.from(regions.keys()))

  // Only an aborted fetch would return an empty document, all other errors
  // in `load()` trigger a reload.
  if (!newDocument) return

  if (emitEvents) emit('before-render', { url, prevUrl, newDocument })

  // Cache the previous document for future back/forward navigation. We do this
  // after the before-render event is dispatched so we can prepare the previous
  // document for caching (e.g. changing the DOM) while already having access
  // to the new document.
  if (!isBackForward) {
    const cacheId = window.location.pathname + window.location.search
    cache.set(cacheId, document.cloneNode(true) as Document)
  }

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

  if (emitEvents) emit('visit', { url, prevUrl })
}

const findRegions = (doc: Document) => {
  let regions: Regions = new Map()

  doc.querySelectorAll<HTMLElement>('[data-simple-ajax]').forEach((el) => {
    if (!el.id) console.warn(`Ajax region is missing an id:`, el)
    else regions.set(el.id, el)
  })

  return regions
}
