const parser = new DOMParser()
let progress = 0

let currentLoadController: AbortController | undefined

export const load = async (url: string): Promise<Document | undefined> => {
  let progressDelayTimeout: number | undefined

  try {
    setProgress(0)

    // We only allow one pending request at a time. When triggering a new request
    // while the last one is still pending we mimic browser behavior and cancel
    // the pending one.
    currentLoadController?.abort()
    currentLoadController = new AbortController()

    // Only show the progress bar if the page takes more than 500ms to load.
    progressDelayTimeout = window.setTimeout(() => toggleLoading(true), 500)

    const response = await fetch(url, {
      headers: { 'X-Very-Simple': '1' },
      signal: currentLoadController.signal,
    })
    const reader = response.body?.getReader()
    const length = parseInt(response.headers.get('Content-Length') ?? '0')
    let receivedBytes = 0

    const stream = new ReadableStream({
      start(controller) {
        const read = async () => {
          const { done, value } = await reader!.read()

          if (done) {
            controller.close()
            return
          }

          receivedBytes += value.length
          setProgress(receivedBytes / length)
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
    const isAbortError = e instanceof DOMException && e.name === 'AbortError'
    if (isAbortError || currentLoadController?.signal.aborted) {
      // There was a network error. We reload the page so the user sees the
      // browser's network error page.
      window.location.reload()
    }
  } finally {
    clearTimeout(progressDelayTimeout)
    toggleLoading(false)
  }
}

const setProgress = (value: number) => {
  progress = value
  document.documentElement.style.setProperty(
    '--simple-progress',
    `${value * 100}%`
  )
}

const toggleLoading = (state: boolean) =>
  document.documentElement.toggleAttribute('data-simple-loading', state)
