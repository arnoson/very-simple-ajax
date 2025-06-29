import { globalConfig } from './config'
import { Config } from './types'
import { visit } from './visit'

export const start = ({
  watchHistory = true,
  merge = 'replace',
  morphHeads = true,
}: Config = {}) => {
  globalConfig.merge = merge
  globalConfig.watchHistory = watchHistory
  globalConfig.morphHeads = morphHeads

  if (watchHistory) {
    window.addEventListener('popstate', () => {
      visit(window.location.pathname + window.location.search, {
        action: 'none',
        isBackForward: true,
      })
    })
  }
}
