import { Config } from './types'

export const globalConfig: Required<Config> = {
  watchHistory: true,
  morphHeads: true,
  merge: 'replace',
  loadingDelay: 500,
}
