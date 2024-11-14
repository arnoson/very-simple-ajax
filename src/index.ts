import { emit, off, on } from './events'
import { Config } from './types'
import { visit } from './visit'

export const start = ({ watchHistory = true }: Config = {}) => {
  if (watchHistory) {
    window.addEventListener('popstate', async () => {
      await visit(window.location.pathname + window.location.search, {
        action: 'none',
        isBackForward: true,
      })
    })
  }
}

export default { on, off, emit, start, visit }
