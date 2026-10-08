import { EventMap, LoadingOptions } from './types'

const parser = new DOMParser()
let currentLoadController: AbortController | undefined
let progressDelayTimeout: number | undefined
let progress = 0
let trickleInterval: number | undefined

// Progress events are purely informational, so they're dispatched directly
// rather than through `visit.ts`'s `emit`, which adds `waitUntil`/`signal`
// semantics that don't apply here.
const emit = <E extends keyof EventMap>(type: E, payload: EventMap[E]) =>
  document.dispatchEvent(new CustomEvent(`ajax:${type}`, { detail: payload }))

export const cache = new Map<string, string>()

export const load = async (
  url: string,
  regions: string[],
  options: LoadingOptions,
): Promise<{ document: Document; response: Response } | undefined> => {
  let aborted = false

  try {
    // We only allow one pending request at a time. When triggering a new request
    // while the last one is still pending we mimic browser behavior and cancel
    // the pending one.
    currentLoadController?.abort()
    clearTimeout(progressDelayTimeout)
    currentLoadController = new AbortController()

    setProgress(0)
    // Only show the progress bar if the page loading takes longer.
    progressDelayTimeout = window.setTimeout(() => {
      emit('progress-start', {})
      startTrickle()
    }, options.loadingDelay)

    const response = await fetch(url, {
      ...options.request,
      headers: {
        ...options.request?.headers,
        'X-Very-Simple-Ajax': 'true',
        'X-Very-Simple-Ajax-Regions': regions.join(' '),
      },
      signal: currentLoadController.signal,
    })

    const html = await response.text()
    if (response.ok) cache.set(url, html)
    const document = parseHtml(html)
    return { document, response }
  } catch (e) {
    aborted = e instanceof DOMException && e.name === 'AbortError'
    if (!aborted) {
      setProgress(0)
      // There was a network error. We reload the page so the user sees the
      // browser's network error page.
      window.location.reload()
    }
  } finally {
    // The newer request owns the progress UI and its delay timer now.
    if (!aborted) {
      clearTimeout(progressDelayTimeout)
      stopTrickle()
      setProgress(1)
      setTimeout(() => emit('progress-end', {}), options.progressHideDelay)
    }
  }
}

export const parseHtml = (html: string): Document =>
  parser.parseFromString(html, 'text/html')

const trickle = () => {
  const amount = -0.095 * progress + 0.1
  setProgress(progress + Math.random() * amount)
}

const startTrickle = () => {
  stopTrickle()
  trickleInterval = window.setInterval(trickle, 300)
}

const stopTrickle = () => {
  clearInterval(trickleInterval)
  trickleInterval = undefined
}

const setProgress = (value: number) => {
  progress = value
  emit('progress', { progress: value })
}
