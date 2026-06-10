import { Config } from './types'

export const config: Required<Config> = {
  watchHistory: true,
  morphHeads: true,
  merge: 'replace',
  viewTransitions: false,
  loadingDelay: 500,
  progressHideDelay: 500,
}
