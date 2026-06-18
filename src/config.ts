import { Config } from './types'

type InternalConfig = Required<Omit<Config, 'mount' | 'unmount'>> &
  Pick<Config, 'mount' | 'unmount'>

export const config: InternalConfig = {
  watchHistory: true,
  morphHeads: true,
  merge: 'replace',
  viewTransitions: false,
  loadingDelay: 500,
  progressHideDelay: 500,
  prefix: 'data-',
}
