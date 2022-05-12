import { copyAttributes, copyNode, merge, replaceWith } from './utils'

export interface VisitOptions {
  action?: 'push' | 'replace' | 'none'
  useCache?: boolean
  cacheId?: string
}

export interface Config {
  watchHistory: boolean
  alwaysUseCache: boolean
}

const parser = new DOMParser()
const cache: Record<string, Document> = {}
let previousUrl: string | undefined

export const start = ({ watchHistory = true } = {}) => {
  if (watchHistory) {
    window.addEventListener('popstate', async () => {
      await visit(window.location.pathname, { action: 'none', useCache: true })
    })
  }
}

export const visit = async (
  url: string,
  { action = 'push', useCache, cacheId }: VisitOptions = {}
) => {
  emit('before-visit', { url })

  cacheId = cacheId ?? previousUrl ?? window.location.pathname
  cache[cacheId] = document.cloneNode(true) as Document
  await render(url, useCache)

  if (action === 'replace') {
    history.replaceState(null, '', url)
  } else if (action === 'push') {
    history.pushState(null, '', url)
  }

  emit('visit', { url })
  previousUrl = url
}

const render = async (url: string, useCache = false) => {
  const newDocument = (useCache && cache[url]) || (await load(url))
  if (!newDocument) return

  document.title = newDocument.title
  merge(document.head, newDocument.head)
  const [container, newContainer] = findContainers(document, newDocument)

  // Copy each node with `copyNode()`, so `<script>` will get executed.
  const fragment = new DocumentFragment()
  newContainer.childNodes.forEach((el) => fragment.appendChild(copyNode(el)))

  const permanentElements = document.querySelectorAll('[data-permanent]')

  container.innerHTML = ''
  container.appendChild(fragment)
  copyAttributes(container, newContainer)

  permanentElements.forEach((el) => {
    const copy = document.getElementById(el.id)
    copy && replaceWith(copy, el)
  })
}

const load = async (url: string): Promise<Document | undefined> => {
  try {
    const response = await fetch(url)
    return parser.parseFromString(await response.text(), 'text/html')
  } catch (e) {
    // There was a network error. We reload the page so the user sees the
    // browser's network error page.
    window.location.reload()
  }
}

/**
 * Check if custom containers exists on both documents and return them. Fall
 * back to the documents' bodies otherwise.
 */
const findContainers = (document: Document, newDocument: Document) => {
  const selector = newDocument.head.querySelector<HTMLMetaElement>(
    "meta[name='very-simple-links:container']"
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

const emit = (event: 'before-visit' | 'visit', detail: any) => {
  document.dispatchEvent(
    new CustomEvent(`very-simple-links:${event}`, { detail })
  )
}
