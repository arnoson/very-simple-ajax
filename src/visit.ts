import { emit } from './events'
import { load } from './load'
import { merge } from './merge'
import { VisitOptions } from './types'
// @ts-ignore (missing types)
import { Idiomorph } from 'idiomorph/dist/idiomorph.esm.js'

export const cache = new Map<string, Document>()

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
    merge: mergeStrategy = 'replace',
  }: VisitOptions = {}
) => {
  if (emitEvents) await emit('before-visit', { url })

  let newDocument: Document | undefined
  if (isBackForward) {
    // If this is a back/forward navigation we simulate the browser behavior and
    // try to receive the document from cache ...
    const cachedDocument = cache.get(url)
    newDocument = cachedDocument
      ? (cachedDocument.cloneNode(true) as Document)
      : await load(url)
  } else {
    // ... otherwise we cache the document for future back/forward navigation
    // and load the document.
    const cacheId = window.location.pathname + window.location.search
    cache.set(cacheId, document.cloneNode(true) as Document)
    newDocument = await load(url)
  }

  // Theoretically, this should never happen, since `load()` will trigger a full
  // page reload if something went wrong.
  if (!newDocument) return

  if (emitEvents) await emit('before-render', { url, newDocument })

  const [container, newContainer] = findContainers(document, newDocument)
  Idiomorph.morph(document.head, newDocument.head)
  merge(container, newContainer, mergeStrategy)

  if (action === 'replace') history.replaceState(null, '', url)
  else if (action === 'push') history.pushState(null, '', url)

  if (emitEvents) await emit('visit', { url })
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
