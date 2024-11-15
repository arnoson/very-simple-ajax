import { globalConfig } from './config'
import { Config } from './types'
import { visit } from './visit'

export const start = ({
  watchHistory = true,
  merge = 'replace',
}: Config = {}) => {
  globalConfig.merge = merge
  globalConfig.watchHistory = watchHistory

  if (watchHistory) {
    window.addEventListener('popstate', async () => {
      await visit(window.location.pathname + window.location.search, {
        action: 'none',
        isBackForward: true,
      })
    })
  }
}
