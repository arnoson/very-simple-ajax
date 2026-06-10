import { config } from './config'
import { StartOptions } from './types'
import { visit } from './visit'

export const start = (options: StartOptions = {}) => {
  Object.assign(config, options)

  if (config.watchHistory) {
    window.addEventListener('popstate', () => {
      visit(window.location.pathname + window.location.search, {
        action: 'none',
        isBackForward: true,
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
