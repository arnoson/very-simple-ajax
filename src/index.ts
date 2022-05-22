import { Config, VisitOptions } from './types'
import { copyScript, merge, replaceWith } from './utils'

const parser = new DOMParser()
const cache: Record<string, Document> = {}
let previousUrl: string | undefined

const render = async (url: string, useCache = false) => {
  const newDocument = (useCache && cache[url]) || (await load(url))
  if (!newDocument) return

  const [container, newContainer] = findContainers(document, newDocument)

  document.title = newDocument.title
  merge(document.head, newDocument.head)

  const permanentElements = document.querySelectorAll('[data-permanent]')
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

export default {
  start({ watchHistory = true } = {} as Config) {
    if (watchHistory) {
      window.addEventListener('popstate', async () => {
        await this.visit(window.location.pathname, {
          action: 'none',
          useCache: true,
        })
      })
    }
  },

  async visit(
    url: string,
    { action = 'push', useCache, cacheId }: VisitOptions = {}
  ) {
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
  },
}
