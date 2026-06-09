import { LoadingOptions } from './types'

const parser = new DOMParser()
let currentLoadController: AbortController | undefined
let progress = 0
let trickleInterval: number | undefined

export const load = async (
  url: string,
  regions: string[],
  options: LoadingOptions,
): Promise<{ document: Document; response: Response } | undefined> => {
  let progressDelayTimeout: number | undefined

  try {
    // We only allow one pending request at a time. When triggering a new request
    // while the last one is still pending we mimic browser behavior and cancel
    // the pending one.
    currentLoadController?.abort()
    currentLoadController = new AbortController()

    setProgress(0)
    // Only show the progress bar if the page loading takes longer.
    progressDelayTimeout = window.setTimeout(() => {
      toggleLoading(true)
      toggleProgress(true)
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
    const document = parser.parseFromString(html, 'text/html')
    return { document, response }
  } catch (e) {
    setProgress(0)
    const isAbortError = e instanceof DOMException && e.name === 'AbortError'
    if (!isAbortError) {
      // There was a network error. We reload the page so the user sees the
      // browser's network error page.
      window.location.reload()
    }
  } finally {
    clearTimeout(progressDelayTimeout)
    stopTrickle()
    setProgress(1)
    toggleLoading(false)
    setTimeout(() => toggleProgress(false), options.progressHideDelay)
  }
}

const trickle = () => {
  const amount = -0.095 * progress + 0.1
  setProgress(progress + Math.random() * amount)
}

const startTrickle = () => (trickleInterval = window.setInterval(trickle, 300))

const stopTrickle = () => clearInterval(trickleInterval)

const setProgress = (value: number) => {
  progress = value
  document.documentElement.style.setProperty(
    '--ajax-progress',
    `${Math.round(value * 10000) / 100}%`,
  )
}

const toggleProgress = (state: boolean) =>
  document.documentElement.toggleAttribute('data-ajax-progress', state)

const toggleLoading = (state: boolean) =>
  document.documentElement.toggleAttribute('data-ajax-loading', state)
