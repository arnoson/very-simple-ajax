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
  visit: { url: string; prevUrl: string }
  'before-visit': { url: string; prevUrl?: string }
  'before-render': { url: string; prevUrl?: string; newDocument: Document }
}

export type SimpleVisitEvent = CustomEvent<EventMap['visit']>
export type SimpleBeforeVisitEvent = CustomEvent<EventMap['before-visit']>
export type SimpleBeforeRenderEvent = CustomEvent<EventMap['before-render']>

type DomEventMap = {
  [K in keyof EventMap as `simple-ajax:${K & string}`]: CustomEvent<EventMap[K]>
}

declare global {
  interface DocumentEventMap extends DomEventMap {}
}
