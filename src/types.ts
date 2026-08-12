// Augment this interface to type the `state` passed to `visit()` and
// received in event payloads, e.g. `declare module ... { interface AjaxState
// { template?: string } }`.
export interface AjaxState extends Record<string, unknown> {
  // The regions used for the visit, so they can be reused on back/forward
  // visits. Set internally, not part of the public `state` option.
  regions?: string[]
}

export interface VisitOptions extends Omit<Config, 'interceptHistory'> {
  action?: 'push' | 'replace' | 'none'
  isBackForward?: boolean
  autoFocus?: boolean
  request?: RequestInit
  regions?: string[]
  state?: Omit<AjaxState, 'regions'>
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
  from: PageState
  to: PageState
  isBackForward: boolean
  savedPosition?: ScrollPosition
}) => ScrollPosition | false | undefined

type WaitUntil = (promise: Promise<unknown>) => void

export type PageState = {
  url: string
  state?: AjaxState
  document: Document
}

type Payload = {
  from: PageState
  to: PageState
  isBackForward: boolean
  signal: AbortSignal
  waitUntil: WaitUntil
}

export type EventMap = {
  visit: { from: PageState; to: PageState; isBackForward: boolean }
  'before-visit': Omit<Payload, 'to'> & { to: Omit<PageState, 'document'> }
  'before-render': Payload
  render: Payload
}

type DomEventMap = {
  [K in keyof EventMap as `ajax:${K & string}`]: CustomEvent<EventMap[K]>
}

declare global {
  interface DocumentEventMap extends DomEventMap {}
}
