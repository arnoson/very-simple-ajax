import { config } from './config'
import { StartOptions } from './types'
import { visit } from './visit'

export const start = (options: StartOptions = {}) => {
  Object.assign(config, options)

  // `scrollBehavior` takes over scroll handling entirely, so disable the
  // browser's own restoration to avoid it fighting with our own.
  if (config.scrollBehavior) history.scrollRestoration = 'manual'

  if (config.interceptHistory) {
    window.addEventListener('popstate', (event) => {
      visit(window.location.href, {
        action: 'none',
        isBackForward: true,
        regions: event.state?.regions ?? [],
        state: event.state,
      })
    })
  }

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
