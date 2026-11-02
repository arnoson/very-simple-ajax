import { Config } from './types'

type InternalConfig = Required<
  Omit<Config, 'mount' | 'unmount' | 'scrollBehavior'>
> &
  Pick<Config, 'mount' | 'unmount' | 'scrollBehavior'>

export const config: InternalConfig = {
  head: 'merge',
  merge: 'replace',
  executeScripts: true,
  transitions: false,
  loadingDelay: 500,
  progressHideDelay: 500,
  prefix: 'data-ajax-',
  regions: [],
  prefetch: false,
  prefetchTtl: 30000,
}
