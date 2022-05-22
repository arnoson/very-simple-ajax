export interface VisitOptions {
  action?: 'push' | 'replace' | 'none'
  useCache?: boolean
  cacheId?: string
}

export interface Config {
  watchHistory: boolean
}

export type LinksEvent = 'before-visit' | 'visit'
