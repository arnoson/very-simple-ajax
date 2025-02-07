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
  morphHeads?: boolean
}

export type EventMap = {
  visit: { url: string }
  'before-visit': { url: string }
  'before-render': { url: string; newDocument: Document }
}

type DomEventMap = {
  [K in keyof EventMap as `simple-ajax:${K & string}`]: CustomEvent<EventMap[K]>
}

declare global {
  interface DocumentEventMap extends DomEventMap {}
}
