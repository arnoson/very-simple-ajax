import { globalConfig } from './config'
import { Config } from './types'
import { visit } from './visit'

export const start = ({
  watchHistory = true,
  merge = 'replace',
  morphHeads = true,
  loadingDelay = 500,
}: Config = {}) => {
  globalConfig.merge = merge
  globalConfig.watchHistory = watchHistory
  globalConfig.morphHeads = morphHeads
  globalConfig.loadingDelay = loadingDelay

  if (watchHistory) {
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
