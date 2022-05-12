import { copyAttributes } from './utils/copyAttributes'
import { copyNode } from './utils/copyNode'
import { emit } from './utils/emit'
import { merge } from './utils/merge'
import { replaceWith } from './utils/replaceWith'

export interface VisitOptions {
  action?: 'push' | 'replace' | 'none'
  useCache?: boolean
  cacheId?: string
}

const parser = new DOMParser()

export class Links {
  private cachedDocuments: Record<string, Document> = {}
  private previousUrl: string | undefined

  start(watchHistory = true) {
    if (watchHistory) {
      window.addEventListener('popstate', () => this.handlePopstate())
    }
  }

  async visit(
    url: string,
    { action = 'push', useCache, cacheId }: VisitOptions = {}
  ) {
    emit('before-visit', { url })

    this.cache(cacheId ?? this.previousUrl ?? window.location.pathname)
    await this.render(url, useCache)

    if (action === 'replace') {
      history.replaceState(null, '', url)
    } else if (action === 'push') {
      history.pushState(null, '', url)
    }

    emit('visit', { url })
    this.previousUrl = url
  }

  private async render(url: string, useCache = false) {
    const newDocument =
      (useCache && this.cachedDocuments[url]) || (await this.load(url))

    if (!newDocument) return

    document.title = newDocument.title
    merge(document.head, newDocument.head)
    const [container, newContainer] = this.getContainers(document, newDocument)

    // Copy each node with `copyNode()`, so `<script>` will get executed.
    const fragment = new DocumentFragment()
    for (const child of Array.from(newContainer.childNodes)) {
      fragment.appendChild(copyNode(child))
    }

    const permanentElements = document.querySelectorAll('[data-permanent]')

    container.innerHTML = ''
    container.appendChild(fragment)
    copyAttributes(container, newContainer)

    permanentElements.forEach((el) => {
      const copy = document.getElementById(el.id)
      copy && replaceWith(copy, el)
    })
  }

  private async load(url: string): Promise<Document | undefined> {
    try {
      const response = await fetch(url)
      return parser.parseFromString(await response.text(), 'text/html')
    } catch (e) {
      // There was a network error. We reload the page so the user sees the
      // browser's network error page.
      window.location.reload()
    }
  }

  private cache(url: string) {
    this.cachedDocuments[url] = document.cloneNode(true) as Document
  }

  private getContainers(document: Document, newDocument: Document) {
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

  private handlePopstate = async () => {
    const url = window.location.pathname
    await this.visit(url, { action: 'none', useCache: true })
  }
}
