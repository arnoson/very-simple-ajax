import { config } from './config'
import { load } from './load'
import { merge } from './merge'
import {
  AjaxState,
  EventMap,
  MergeStrategy,
  ScrollPosition,
  VisitOptions,
} from './types'
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

const emit = <E extends keyof EventMap>(
  type: E,
  payload: Omit<EventMap[E], 'waitUntil'>,
) => {
  const waiting: Promise<unknown>[] = []

  const waitUntil = (promise: Promise<unknown>) =>
    waiting.push(Promise.resolve(promise))

  payload = { ...payload, waitUntil }
  const event = new CustomEvent(`ajax:${type}`, { detail: payload })
  document.dispatchEvent(event)

  if (waiting.length) return Promise.allSettled(waiting)
}

let currentUrl = window.location.pathname
let currentState = history.state as AjaxState | undefined
let prevUrl: string | undefined
let currentVisitController: AbortController | undefined

// Positions are saved per url so `scrollBehavior` can restore them on
// back/forward visits.
export const scrollPositions = new Map<string, ScrollPosition>()

/**
 * Load a new page, merge the regions/bodies and add a new history entry
 * according to the action.
 */
export const visit = async (
  url: string,
  {
    action = 'none',
    isBackForward = false,
    autoFocus = true,
    request,
    state,
    regions = [],
    morphHeads = config.morphHeads,
    merge: mergeStrategy = config.merge,
    viewTransitions = config.viewTransitions,
    loadingDelay = config.loadingDelay,
    progressHideDelay = config.progressHideDelay,
  }: VisitOptions = {},
) => {
  url = normalizeUrl(url)
  const fromUrl = currentUrl
  const fromState = currentState

  currentVisitController?.abort()
  currentVisitController = new AbortController()
  const { signal } = currentVisitController

  // Mimic browser behavior: navigating to the already-active URL should not
  // create a new history entry.
  if (url === currentUrl) action = 'none'

  await emit('before-visit', {
    from: { url: fromUrl, state: fromState, document },
    to: { url, state },
    signal,
    isBackForward,
  })
  if (signal.aborted) return

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

  // Commit prevUrl/currentUrl only once the visit is confirmed to proceed.
  // CurrentUrl reflects the final URL after potential redirect/hash handling.
  prevUrl = fromUrl
  currentUrl = url
  currentState = state

  const data = { ...state, regions }
  if (action === 'replace') history.replaceState(data, '', url)
  else if (action === 'push') history.pushState(data, '', url)

  let from = { url: fromUrl, state: fromState, document }
  const to = { url, state, document: newDocument }

  await emit('before-render', { from, to, isBackForward, signal })
  if (signal.aborted) return

  // Cache the previous document for future back/forward navigation. We do this
  // after the before-render event is dispatched so we can prepare the previous
  // document for caching (e.g. changing the DOM) while already having access
  // to the new document. Also replaces `from.document` since `document`
  // itself is about to be mutated by the merge.
  from = { ...from, document: document.cloneNode(true) as Document }
  cache.set(prevUrl!, from.document)

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

  if (fromUrl) scrollPositions.set(fromUrl, { top: window.scrollY })

  // Applying the scroll change here, inside the merge/transition step, makes
  // it part of the view transition's before/after snapshots instead of a
  // separate, visible jump.
  const applyScrollBehavior = () => {
    if (!config.scrollBehavior) return
    const savedPosition = isBackForward ? scrollPositions.get(url) : undefined
    const position = config.scrollBehavior({
      from,
      to,
      isBackForward,
      savedPosition,
    })
    if (position) window.scrollTo(position)
  }

  if (config.render) {
    await config.render(newDocument)
  } else if (viewTransitions && document.startViewTransition) {
    await document.startViewTransition(async () => {
      mergeRegions()
      await emit('render', { from, to, isBackForward, signal })
      applyScrollBehavior()
    }).ready
  } else {
    mergeRegions()
    await emit('render', { from, to, isBackForward, signal })
    applyScrollBehavior()
  }

  if (signal.aborted) return

  // `preventScroll` avoids fighting with `scrollBehavior`.
  if (autoFocus) autoFocusEl?.focus({ preventScroll: true })
  emit('visit', { from, to, isBackForward })
}
