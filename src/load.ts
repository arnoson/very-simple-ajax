import { LoadingOptions } from './types'

const parser = new DOMParser()
let currentLoadController: AbortController | undefined

export const load = async (
  url: string,
  regionIds: string[],
  options: LoadingOptions
): Promise<{ document: Document; url: string } | undefined> => {
  let progressDelayTimeout: number | undefined

  try {
    // We only allow one pending request at a time. When triggering a new request
    // while the last one is still pending we mimic browser behavior and cancel
    // the pending one.
    currentLoadController?.abort()
    currentLoadController = new AbortController()

    setProgress(0)

    // Only show the progress bar if the page loading takes longer.
    progressDelayTimeout = window.setTimeout(
      () => toggleLoading(true),
      options.loadingDelay
    )

    const response = await fetch(url, {
      headers: {
        'X-Very-Simple-Request': 'true',
        'X-Very-Simple-Regions': regionIds.join(' '),
      },
      signal: currentLoadController.signal,
    })

    const html = await response.text()
    const document = parser.parseFromString(html, 'text/html')
    return { document, url: response.url }
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
    toggleLoading(false)
  }
}

const setProgress = (value: number) =>
  document.documentElement.style.setProperty(
    '--simple-progress',
    `${Math.round(value * 10000) / 100}%`
  )

const toggleLoading = (state: boolean) =>
  document.documentElement.toggleAttribute('data-simple-loading', state)
