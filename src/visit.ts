import { emit } from './events'
import { load } from './load'
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
  const manualReplacements: [HTMLElement, HTMLElement][] = []
  Idiomorph.morph(container, newContainer, {
    callbacks: {
      beforeNodeMorphed(oldNode: Node, newNode: Node) {
        // Each node could be a Very Simple Component that attached event
        // listeners to itself or its children. In this case we have to replace
        // the nodes manually instead of morphing in order to cleanup the
        // listeners.

        // Components can only be HTMLElements (they need to support dataset).
        if (!(oldNode instanceof HTMLElement)) return true
        if (!(newNode instanceof HTMLElement)) return true
        const oldComponent = oldNode.dataset.simpleComponent
        const newComponent = newNode.dataset.simpleComponent

        // Nothing to clean up, if the old node isn't a component are both nodes
        // are the same component.
        if (!oldComponent || oldComponent === newComponent) return true

        manualReplacements.push([oldNode, newNode])
      },
    },
  })
  Idiomorph.morph(document.head, newDocument.head)

  for (const [oldEl, newEl] of manualReplacements) oldEl.replaceWith(newEl)

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
