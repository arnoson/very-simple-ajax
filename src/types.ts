export interface VisitOptions extends Omit<Config, 'interceptHistory'> {
  action?: 'push' | 'replace' | 'none'
  isBackForward?: boolean
  autoFocus?: boolean
  request?: RequestInit
  regions?: string[]
  state?: Record<string, unknown>
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
  interceptHistory?: boolean
  merge?: MergeStrategy
  morphHeads?: boolean
  viewTransitions?: boolean
  render?: (newDocument: Document) => Promise<void> | void
  scrollBehavior?: ScrollBehavior
  loadingDelay?: number
  progressHideDelay?: number
  prefix?: string
  mount?: (el: Element) => void
  unmount?: (el: Element) => void
}

export type ScrollPosition = { top: number }

export type ScrollBehavior = (info: {
  url: string
  prevUrl?: string
  isBackForward: boolean
  savedPosition?: ScrollPosition
}) => ScrollPosition | false | undefined

type WaitUntil = (promise: Promise<unknown>) => void

type Payload = {
  url: string
  prevUrl?: string
  isBackForward: boolean
  newDocument: Document
  signal: AbortSignal
  state?: Record<string, unknown>
  waitUntil: WaitUntil
}

export type EventMap = {
  visit: { url: string; prevUrl: string; isBackForward: boolean }
  'before-visit': Omit<Payload, 'newDocument'>
  'before-render': Payload
  render: Payload
}

type DomEventMap = {
  [K in keyof EventMap as `ajax:${K & string}`]: CustomEvent<EventMap[K]>
}

declare global {
  interface DocumentEventMap extends DomEventMap {}
}
