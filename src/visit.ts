import { globalConfig } from './config'
import { load } from './load'
import { merge } from './merge'
import { EventMap, VisitOptions } from './types'
// @ts-ignore (missing types)
import { Idiomorph } from 'idiomorph/dist/idiomorph.esm.js'

export const cache = new Map<string, Document>()

const emit = async <E extends keyof EventMap>(
  type: E,
  payload: EventMap[E]
) => {
  const event = new CustomEvent(`very-simple-ajax:${type}`, { detail: payload })
  document.dispatchEvent(event)
}

/**
 * Load a new page, merge the containers/bodies and add a new history entry
 * according to the action.
 */
export const visit = async (
  url: string,
  {
    action = 'push',
    emitEvents = true,
    isBackForward = false,
    merge: mergeStrategy = globalConfig.merge,
  }: VisitOptions = {}
) => {
  // We only allow one pending visit request at a time. When triggering a new
  // request while the last one is still pending we mimic browser behavior and
  // cancel the pending one.
  // currentVisitController?.abort()
  // currentVisitController = new AbortController()

  if (emitEvents) emit('before-visit', { url })

  let newDocument: Document | undefined
  if (isBackForward) {
    // If this is a back/forward navigation we simulate the browser behavior and
    // try to receive the document from cache ...
    newDocument = cache.get(url)?.cloneNode(true) as Document | undefined
  } else {
    // ... otherwise we cache the document for future back/forward navigation
    // and load the document.
    const cacheId = window.location.pathname + window.location.search
    cache.set(cacheId, document.cloneNode(true) as Document)
  }

  newDocument ??= await load(url)

  // Only an aborted fetch would return an empty document, all other errors
  // in `load()` trigger a reload.
  if (!newDocument) return

  if (emitEvents) emit('before-render', { url, newDocument })

  const [container, newContainer] = findContainers(document, newDocument)
  Idiomorph.morph(document.head, newDocument.head)
  merge(container, newContainer, mergeStrategy)

  if (action === 'replace') history.replaceState(null, '', url)
  else if (action === 'push') history.pushState(null, '', url)

  if (emitEvents) emit('visit', { url })
}

/**
 * Check if custom containers exists on both documents and return them. Fall
 * back to the documents' bodies otherwise.
 */
const findContainers = (document: Document, newDocument: Document) => {
  const selector = newDocument.head.querySelector<HTMLMetaElement>(
    "meta[name='simple-container']"
  )?.content

  const container = selector && document.querySelector(selector)
  const newContainer = selector && newDocument.querySelector(selector)

  return container && newContainer
    ? [container, newContainer]
    : [document.body, newDocument.body]
}
