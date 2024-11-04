import { load } from './load'
// @ts-ignore (missing types)
import { Idiomorph } from 'idiomorph/dist/idiomorph.esm.js'

export const cache: Record<string, Document> = {}

export const render = async (url: string, useCache = false) => {
  const cachedDocument = useCache && cache[url]
  const newDocument = cachedDocument
    ? (cachedDocument.cloneNode(true) as Document)
    : await load(url)

  if (!newDocument) return

  const [container, newContainer] = findContainers(document, newDocument)
  Idiomorph.morph(container, newContainer, {
    callbacks: {
      beforeNodeRemoved: (node: Element) => {
        if (node instanceof HTMLElement && node.dataset.simpleKeep === 'true')
          return false
      },
    },
  })
  Idiomorph.morph(document.head, newDocument.head)
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
