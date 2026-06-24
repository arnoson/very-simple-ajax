export interface VisitOptions extends Omit<Config, 'watchHistory'> {
  action?: 'push' | 'replace' | 'none'
  emitEvents?: boolean
  isBackForward?: boolean
  autoFocus?: boolean
  request?: RequestInit
  regions?: string[]
}

export type StartOptions = Config

export interface LoadingOptions {
  loadingDelay?: number
  progressHideDelay?: number
  request?: RequestInit
}

export type MergeStrategy =
  | 'replace'
  | 'morph'
  | 'before'
  | 'after'
  | 'prepend'
  | 'append'
  | 'update'

export interface Config {
  watchHistory?: boolean
  merge?: MergeStrategy
  morphHeads?: boolean
  viewTransitions?: boolean
  loadingDelay?: number
  progressHideDelay?: number
  prefix?: string
  mount?: (el: Element) => void
  unmount?: (el: Element) => void
}

export type EventMap = {
  visit: { url: string; prevUrl: string }
  'before-visit': { url: string; prevUrl?: string }
  'before-render': {
    url: string
    prevUrl?: string
    newDocument: Document
    waitUntil: (promise: Promise<unknown>) => void
  }
}

export type SimpleVisitEvent = CustomEvent<EventMap['visit']>
export type SimpleBeforeVisitEvent = CustomEvent<EventMap['before-visit']>
export type SimpleBeforeRenderEvent = CustomEvent<EventMap['before-render']>

type DomEventMap = {
  [K in keyof EventMap as `ajax:${K & string}`]: CustomEvent<EventMap[K]>
}

declare global {
  interface DocumentEventMap extends DomEventMap {}
}
