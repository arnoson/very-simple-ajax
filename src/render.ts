import { load } from './load'
import { copyScript, merge, replaceWith } from './utils'

export const cache: Record<string, Document> = {}

export const render = async (url: string, useCache = false) => {
  const newDocument = (useCache && cache[url]) || (await load(url))
  if (!newDocument) return

  const [container, newContainer] = findContainers(document, newDocument)

  document.title = newDocument.title
  merge(document.head, newDocument.head)

  const permanentElements = document.querySelectorAll(
    '[id][data-simple-permanent]'
  )
  replaceWith(container, newContainer)

  permanentElements.forEach((el) => {
    const copy = document.getElementById(el.id)
    copy && replaceWith(copy, el)
  })

  // Force the browser to execute scripts.
  container
    .querySelectorAll('script')
    .forEach((el) => replaceWith(el, copyScript(el)))
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

  if (newContainer && !container)
    console.warn(
      `Container '${selector}' doesn't exist, swapping body instead.`
    )

  return container && newContainer
    ? [container, newContainer]
    : [document.body, newDocument.body]
}
