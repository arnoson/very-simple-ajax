import { config } from './config'
import { StartOptions } from './types'
import { interceptLinks, interceptForms, interceptHistory } from './intercept'
import { cache } from './load'
import { normalizeUrl } from './visit'

export const start = (options: StartOptions = {}) => {
  Object.assign(config, options)

  // The initial page was never fetched via ajax, so it's missing from the
  // cache. Seed it now so a back/forward visit to it doesn't refetch it.
  const url = normalizeUrl(window.location.href)
  if (!cache.has(url)) cache.set(url, document.documentElement.outerHTML)

  // `scrollBehavior` takes over scroll handling entirely, so disable the
  // browser's own restoration to avoid it fighting with our own.
  if (config.scrollBehavior) history.scrollRestoration = 'manual'

  interceptLinks()
  interceptForms()
  interceptHistory()

  if (import.meta.env.DEV) {
    document.addEventListener('ajax:before-visit', () => {
      // Vite adds styles during dev dynamically which would be removed when
      // idiomorph morphs the document's heads.
      document.head
        .querySelectorAll('style[data-vite-dev-id]')
        .forEach((el) => el.setAttribute('im-preserve', 'true'))
    })
  }
}
