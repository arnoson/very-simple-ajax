const parser = new DOMParser()
let progress = 0
let trickleInterval: number | undefined

export const load = async (url: string): Promise<Document | undefined> => {
  try {
    setProgress(0)
    const progressDelayTimeout = window.setTimeout(() => {
      toggleLoading(true)
      startTrickle()
    }, 500)

    const response = await fetch(url)
    const html = parser.parseFromString(await response.text(), 'text/html')

    clearTimeout(progressDelayTimeout)
    stopTrickle()
    setTimeout(() => {
      // Without a small timeout transitions won't work on a permanent progress
      // bar.
      setProgress(1)
      toggleLoading(false)
    })

    return html
  } catch (e) {
    // There was a network error. We reload the page so the user sees the
    // browser's network error page.
    window.location.reload()
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
    '--simple-progress',
    `${value * 100}%`
  )
}

const toggleLoading = (state: boolean) =>
  document.documentElement.toggleAttribute('data-simple-loading', state)
