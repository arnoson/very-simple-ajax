import { cachePage } from './cachePage'
import { renderPage } from './renderPage'
import { emit } from './utils/emit'

/**
 * Load the html page (or use cached version), merge the `<head>` into the
 * current `<head>` and swap the body.
 */
export const visitPage = async (
  url: string,
  { action = 'push', cacheId = null } = {}
) => {
  emit('before-visit', { url })

  cachePage(cacheId ?? window.location.pathname)

  await renderPage(url)
  emit('load', { url })

  if (action === 'replace') {
    history.replaceState(null, null, url)
  } else if (action === 'push') {
    history.pushState(null, null, url)
  }

  emit('visit', { url })
}
