export interface VisitOptions {
  action?: 'push' | 'replace' | 'none'
  emitEvents?: boolean
  isBackForward?: boolean
}

export interface Config {
  watchHistory?: boolean
}
