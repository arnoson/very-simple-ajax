import { copyNode } from './utils/copyNode'
import { emit } from './utils/emit'
import { merge } from './utils/merge'

export interface VisitOptions {
  action?: 'push' | 'replace' | 'none'
  useCache?: boolean
  cacheId?: string
}

export type LoadPageResponse = {
  document?: Document
  error?: Error
  response?: Response
}

const parser = new DOMParser()

export class Links {
  private cache: Record<string, Document> = {}
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

    this.cachePage(cacheId ?? this.previousUrl ?? window.location.pathname)
    await this.renderPage(url, useCache)

    if (action === 'replace') {
      history.replaceState(null, '', url)
    } else if (action === 'push') {
      history.pushState(null, '', url)
    }

    emit('visit', { url })
    this.previousUrl = url
  }

  private handlePopstate = async () => {
    const url = window.location.pathname
    console.log('visit', url)
    await this.visit(url, { action: 'none', useCache: true })
  }

  private cachePage(url: string) {
    this.cache[url] = document.cloneNode(true) as Document
  }

  private async renderPage(url: string, useCache = false) {
    let dom = this.cache[url]
    if (!useCache || !dom) {
      const { document, error } = await this.loadPage(url)
      if (error) {
        // There was a network error. We reload the page so the user sees the
        // browser's network error page.
        window.location.reload()
        return
      }
      // Document could still be an error page, if the url doesn't exist, but
      // thats actually a good thing as the user will see the servers error page.
      dom = document!
    }

    document.title = dom.title
    merge(document.head, dom.head)

    // Copy each node with `copyNode()`, so `<script>` will get executed.
    const fragment = new DocumentFragment()
    for (const child of Array.from(dom.body.childNodes)) {
      fragment.appendChild(copyNode(child))
    }

    // Clone the body to preserve any attributes.
    document.body = dom.body.cloneNode() as HTMLBodyElement
    document.body.appendChild(fragment)
  }

  async loadPage(url: string): Promise<LoadPageResponse> {
    try {
      const response = await fetch(url)
      const document = parser.parseFromString(
        await response.text(),
        'text/html'
      )
      return { document, response }
    } catch (error) {
      return { error: error as Error }
    }
  }
}
