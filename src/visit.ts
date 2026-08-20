import { config } from './config'
import { load, cache, parseHtml } from './load'
import { merge } from './merge'
import { executeScripts } from './scripts'
import {
  AjaxState,
  EventMap,
  MergeStrategy,
  ScrollPosition,
  VisitOptions,
} from './types'
// @ts-ignore (missing types)
import { Idiomorph } from 'idiomorph/dist/idiomorph.esm.js'

export const normalizeUrl = (url: string): string => {
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

export let currentUrl = window.location.pathname

// Exported so `interceptHistory` can read the state of the page we're
// currently on (i.e. the one we're navigating away from on a back/forward
// visit), since that's what holds the regions used to reach it.
export let currentState = history.state as AjaxState | undefined
let currentVisitController: AbortController | undefined

// Positions are saved per url so `scrollBehavior` can restore them on
// back/forward visits.
export const scrollPositions = new Map<string, ScrollPosition>()

/**
 * Load a new page, merge the regions/bodies and add a new history entry
 * according to the history mode.
 */
export const visit = async (
  url: string,
  {
    history: historyMode = 'none',
    isBackForward = false,
    autoFocus = true,
    request,
    state,
    regions = [],
    morphHeads = config.morphHeads,
    merge: mergeStrategy = config.merge,
    executeScripts: shouldExecuteScripts = config.executeScripts,
    viewTransitions = config.viewTransitions,
    loadingDelay = config.loadingDelay,
    progressHideDelay = config.progressHideDelay,
  }: VisitOptions = {},
) => {
  url = normalizeUrl(url)
  const fromUrl = currentUrl
  const fromState = currentState

  state = { ...state, regions }

  currentVisitController?.abort()
  currentVisitController = new AbortController()
  const { signal } = currentVisitController

  // Mimic browser behavior: navigating to the already-active URL should not
  // create a new history entry.
  if (url === currentUrl) historyMode = 'none'

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
    const html = cache.get(url)
    if (html) newDocument = parseHtml(html)
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

  // Commit currentUrl/currentState only once the visit is confirmed to
  // proceed. currentUrl reflects the final URL after potential
  // redirect/hash handling.
  currentUrl = url
  currentState = state

  if (historyMode === 'replace') history.replaceState(state, '', url)
  else if (historyMode === 'push') history.pushState(state, '', url)

  const from = { url: fromUrl, state: fromState, document }
  const to = { url, state, document: newDocument }

  await emit('before-swap', { from, to, isBackForward, signal })
  if (signal.aborted) return

  if (morphHeads) Idiomorph.morph(document.head, newDocument.head)

  const getMergeStrategy = (oldEl: HTMLElement, newEl: HTMLElement) =>
    newEl.getAttribute(`${config.prefix}merge`) ||
    oldEl.getAttribute(`${config.prefix}merge`) ||
    mergeStrategy

  let autoFocusEl: HTMLElement | undefined

  const hasMatchingRegions = regions?.some(
    (selector) =>
      document.querySelector(selector) && newDocument.querySelector(selector),
  )

  const mergeRegions = async () => {
    const scriptPromises: Promise<unknown>[] = []

    if (hasMatchingRegions) {
      for (const id of regions) {
        const region = document.querySelector<HTMLElement>(id)
        const newRegion = newDocument.querySelector<HTMLElement>(id)
        if (!region || !newRegion) continue
        const strategy = getMergeStrategy(region, newRegion)
        const result = merge(region, newRegion, strategy as MergeStrategy)
        // Use the auto-focusable element from the first region that has one.
        autoFocusEl ??= result.autoFocusEl

        if (shouldExecuteScripts) {
          // Re-query since strategies like 'replace' swap out the element.
          const finalRegion = document.querySelector<HTMLElement>(id)
          if (finalRegion) scriptPromises.push(executeScripts(finalRegion))
        }
      }
    } else {
      const region = document.body
      const newRegion = newDocument.body
      const strategy = getMergeStrategy(region, newRegion)
      const result = merge(region, newRegion, strategy as MergeStrategy)
      autoFocusEl = result.autoFocusEl

      if (shouldExecuteScripts) {
        scriptPromises.push(executeScripts(document.body))
      }
    }

    if (scriptPromises.length) await Promise.all(scriptPromises)
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
      await mergeRegions()
      await emit('after-swap', { from, to, isBackForward, signal })
      applyScrollBehavior()
    }).ready
  } else {
    await mergeRegions()
    await emit('after-swap', { from, to, isBackForward, signal })
    applyScrollBehavior()
  }

  if (signal.aborted) return

  // `preventScroll` avoids fighting with `scrollBehavior`.
  if (autoFocus) autoFocusEl?.focus({ preventScroll: true })
  emit('load', { from, to, isBackForward })
}
