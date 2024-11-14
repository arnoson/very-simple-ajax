const parser = new DOMParser()
let progress = 0

export const load = async (url: string): Promise<Document | undefined> => {
  try {
    setProgress(0)
    // Only show the progress bar if the page takes more than 500ms to load.
    const progressDelayTimeout = window.setTimeout(
      () => toggleLoading(true),
      500
    )

    const response = await fetch(url, { headers: { 'X-Very-Simple': '1' } })
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

    clearTimeout(progressDelayTimeout)
    setProgress(1)
    toggleLoading(false)

    return parser.parseFromString(html, 'text/html')
  } catch (e) {
    // There was a network error. We reload the page so the user sees the
    // browser's network error page.
    window.location.reload()
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
