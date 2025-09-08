import { LoadingOptions } from './types'

const parser = new DOMParser()
let currentLoadController: AbortController | undefined

export const load = async (
  url: string,
  regionIds: string[],
  options: LoadingOptions
): Promise<Document | undefined> => {
  let progressDelayTimeout: number | undefined

  try {
    // We only allow one pending request at a time. When triggering a new request
    // while the last one is still pending we mimic browser behavior and cancel
    // the pending one.
    currentLoadController?.abort('cancel')
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
    const reader = response.body?.getReader()
    const contentLengthHeader = response.headers.get('Content-Length')
    const length = parseInt(contentLengthHeader ?? '0')
    let receivedBytes = 0

    const stream = new ReadableStream({
      start(controller) {
        const read = async () => {
          const { done, value } = await reader!.read()

          if (done) {
            if (contentLengthHeader && receivedBytes > length) {
              console.warn(
                `Server sent more data (${receivedBytes} bytes) than specified in Content-Length header (${length} bytes).`
              )
            }
            controller.close()
            return
          }

          receivedBytes += value.length
          if (contentLengthHeader) {
            const progress = Math.min(receivedBytes / length, 1)
            setProgress(progress)
          }
          controller.enqueue(value)

          read()
        }
        read()
      },
    })

    const html = await new Response(stream, {
      headers: { 'Content-Type': 'text/html' },
    }).text()

    return parser.parseFromString(html, 'text/html')
  } catch (e) {
    setProgress(0)
    if (e !== 'cancel') {
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
