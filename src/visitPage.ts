import { cachePage } from './cachePage'
import { renderPage } from './renderPage'

/**
 * Load the html page (or use cached version), merge the `<head>` into the
 * current `<head>` and swap the body.
 */
export const visitPage = async (url: string, { action = 'push' } = {}) => {
  document.dispatchEvent(
    new CustomEvent('very-simple-links:before-visit', { detail: { url } })
  )

  cachePage(window.location.pathname)

  await renderPage(url)

  if (action === 'replace') {
    history.replaceState(null, null, url)
  } else if (action === 'push') {
    history.pushState(null, null, url)
  }

  document.dispatchEvent(
    new CustomEvent('very-simple-links:visit', { detail: { url } })
  )
}
