import { Config } from './types'

type InternalConfig = Required<
  Omit<Config, 'mount' | 'unmount' | 'render' | 'scrollBehavior'>
> &
  Pick<Config, 'mount' | 'unmount' | 'render' | 'scrollBehavior'>

export const config: InternalConfig = {
  morphHeads: true,
  merge: 'replace',
  viewTransitions: false,
  loadingDelay: 500,
  progressHideDelay: 500,
  prefix: 'data-',
}
