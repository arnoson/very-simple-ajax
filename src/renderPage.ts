import { cache } from './cachePage'
import { loadPage } from './loadPage'
import { merge } from './utils/merge'
import { copyNode } from './utils/copyNode'

export const renderPage = async (url: string) => {
  let dom = cache[url]
  if (!dom) {
    const { document, error } = await loadPage(url)
    if (error) {
      // There was a network error. We reload the page so the user sees the
      // browser's network error page.
      window.location.reload()
      return
    }
    // Document could still be an error page, if the url doesn't exist, but
    // thats actually a good thing as the user will see the servers error page.
    dom = document
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
