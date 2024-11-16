export interface VisitOptions {
  action?: 'push' | 'replace' | 'none'
  emitEvents?: boolean
  isBackForward?: boolean
  merge?: MergeStrategy
  morphHeads?: boolean
  autoFocus?: boolean
}

export type MergeStrategy =
  | 'replace'
  | 'morph'
  | 'before'
  | 'after'
  | 'prepend'
  | 'append'
  | 'update'

export type Regions = Map<string, HTMLElement>

export interface Config {
  watchHistory?: boolean
  merge?: MergeStrategy
}

export type EventMap = {
  visit: { url: string }
  'before-visit': { url: string }
  'before-render': { url: string; newDocument: Document }
}
