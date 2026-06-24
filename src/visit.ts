import { config } from './config'
import { load } from './load'
import { merge } from './merge'
import { EventMap, MergeStrategy, VisitOptions } from './types'
// @ts-ignore (missing types)
import { Idiomorph } from 'idiomorph/dist/idiomorph.esm.js'

export const cache = new Map<string, Document>()

const normalizeUrl = (url: string): string => {
  try {
    const urlObj = new URL(url, window.location.origin)
    return urlObj.pathname + urlObj.search
  } catch {
    return url
  }
}

const emit = async <E extends keyof EventMap>(
  type: E,
  payload: EventMap[E],
) => {
  const event = new CustomEvent(`ajax:${type}`, { detail: payload })
  document.dispatchEvent(event)
}

const emitAsync = async <E extends keyof EventMap>(
  type: E,
  payload: Omit<EventMap[E], 'waitUntil'>,
) => {
  const waiting: Promise<unknown>[] = []

  const waitUntil = (promise: Promise<unknown>) =>
    waiting.push(Promise.resolve(promise))

  payload = { ...payload, waitUntil }
  const event = new CustomEvent(`ajax:${type}`, { detail: payload })
  document.dispatchEvent(event)

  if (!waiting.length) return
  await Promise.allSettled(waiting)
}

let currentUrl = window.location.pathname
let prevUrl: string | undefined

/**
 * Load a new page, merge the regions/bodies and add a new history entry
 * according to the action.
 */
export const visit = async (
  url: string,
  {
    action = 'none',
    emitEvents = true,
    isBackForward = false,
    autoFocus = true,
    request,
    regions = [],
    morphHeads = config.morphHeads,
    merge: mergeStrategy = config.merge,
    viewTransitions = config.viewTransitions,
    loadingDelay = config.loadingDelay,
    progressHideDelay = config.progressHideDelay,
  }: VisitOptions = {},
) => {
  url = normalizeUrl(url)

  // Mimic browser behavior: navigating to the already-active URL should not
  // create a new history entry.
  if (url === currentUrl) action = 'none'

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

  const state = { regions }
  if (action === 'replace') history.replaceState(state, '', url)
  else if (action === 'push') history.pushState(state, '', url)

  // To keep things simple, most events aren't async, but before rendering we
  // might want to finish some animation like collapsing a menu, etc.
  if (emitEvents) {
    await emitAsync('before-render', { url, prevUrl, newDocument })
  }

  // Cache the previous document for future back/forward navigation. We do this
  // after the before-render event is dispatched so we can prepare the previous
  // document for caching (e.g. changing the DOM) while already having access
  // to the new document.
  if (!isBackForward) cache.set(prevUrl!, document.cloneNode(true) as Document)

  if (morphHeads) Idiomorph.morph(document.head, newDocument.head)

  const getMergeStrategy = (oldEl: HTMLElement, newEl: HTMLElement) =>
    newEl.getAttribute(`${config.prefix}ajax-merge`) ||
    oldEl.getAttribute(`${config.prefix}ajax-merge`) ||
    mergeStrategy

  let autoFocusEl: HTMLElement | undefined

  const hasMatchingRegions = regions?.some(
    (selector) =>
      document.querySelector(selector) && newDocument.querySelector(selector),
  )

  const mergeRegions = () => {
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
  }

  if (viewTransitions && document.startViewTransition) {
    await document.startViewTransition(mergeRegions).ready
  } else {
    mergeRegions()
  }

  if (autoFocus) autoFocusEl?.focus()
  if (emitEvents) emit('visit', { url, prevUrl })
}
