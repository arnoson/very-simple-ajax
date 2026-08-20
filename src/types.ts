// Augment this interface to type the `state` passed to `visit()` and
// received in event payloads, e.g. `declare module ... { interface AjaxState
// { template?: string } }`.
export interface AjaxState extends Record<string, unknown> {
  // The regions used for the visit, so they can be reused on back/forward
  // visits. Set internally, not part of the public `state` option.
  regions?: string[]
}

export interface VisitOptions extends Config {
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
  /** Strategy used to merge the swapped content into the current DOM. */
  merge?: MergeStrategy
  /** Morph the `<head>` instead of leaving it untouched. */
  morphHeads?: boolean
  /** Re-execute `<script>` tags found in the swapped content. */
  executeScripts?: boolean
  /** Wrap navigations in the View Transitions API, if supported. */
  viewTransitions?: boolean
  /** Called instead of the default merge to render the new document. */
  render?: (newDocument: Document) => Promise<void> | void
  /** Custom scroll handling, e.g. restoring position on back/forward visits. */
  scrollBehavior?: ScrollBehavior
  /** Delay (ms) before showing a loading indicator on slow visits. */
  loadingDelay?: number
  /** Delay (ms) before hiding the loading indicator again. */
  progressHideDelay?: number
  /** Prefix used for the `data-ajax-*` attributes. */
  prefix?: string
  /** Called after an element is added to the DOM by a merge. */
  mount?: (el: Element) => void
  /** Called before an element is removed from the DOM by a merge. */
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
  document?: Document
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
  'before-visit': Payload
  'before-render': Payload
  render: Payload
}

type DomEventMap = {
  [K in keyof EventMap as `ajax:${K & string}`]: CustomEvent<EventMap[K]>
}

declare global {
  interface DocumentEventMap extends DomEventMap {}
}
