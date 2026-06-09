import { globalConfig } from './config'
import { load } from './load'
import { merge } from './merge'
import { EventMap, MergeStrategy, VisitOptions } from './types'
// @ts-ignore (missing types)
import { Idiomorph } from 'idiomorph/dist/idiomorph.esm.js'

export const cache = new Map<string, Document>()

const emit = async <E extends keyof EventMap>(
  type: E,
  payload: EventMap[E],
) => {
  const event = new CustomEvent(`ajax:${type}`, { detail: payload })
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
    loadingDelay = globalConfig.loadingDelay,
    progressHideDelay = globalConfig.progressHideDelay,
    autoFocus = true,
    request,
    regions = [],
  }: VisitOptions = {},
) => {
  if (emitEvents) emit('before-visit', { url, prevUrl })

  let newDocument: Document | undefined

  // If this is a back/forward navigation we simulate the browser behavior and
  // try to receive the document from cache.
  if (isBackForward) {
    newDocument = cache.get(url)?.cloneNode(true) as Document | undefined
  }

  // Load the new document if we don't use it from cache. There might also be
  // a server-side redirect, so we update the url.
  if (!newDocument) {
    const options = { loadingDelay, progressHideDelay, request }
    const result = await load(url, regions, options)
    if (result) {
      newDocument = result.document
      // Only use the response url if there has been a redirect. Otherwise we
      // might strip away the original url's hash.
      url = result.response.redirected ? result.response.url : url
    }
  }

  // Only an aborted fetch would return an empty document, all other errors
  // in `load()` trigger a reload.
  if (!newDocument) return

  // Update currentUrl to the final URL (after potential redirect and
  // hash handling).
  prevUrl = currentUrl
  currentUrl = url

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
    newEl.getAttribute('#ajax-merge') ||
    oldEl.getAttribute('#ajax-merge') ||
    mergeStrategy

  let autoFocusEl: HTMLElement | undefined

  const hasMatchingRegions = regions?.some(
    (selector) =>
      document.querySelector(selector) && newDocument.querySelector(selector),
  )

  if (hasMatchingRegions) {
    for (const id of regions) {
      const region = document.querySelector<HTMLElement>(id)
      const newRegion = newDocument.querySelector<HTMLElement>(id)
      if (!region || !newRegion) continue
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
