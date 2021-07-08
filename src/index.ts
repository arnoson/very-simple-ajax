import { copyNode } from './copyNode'
import { merge } from './merge'
import { loadPage } from './loadPage'

export const cache: Record<string, Document> = {}
let currentUrl

/**
 * Load the html page (or use cached version), merge the `<head>` into the
 * current `<head>` and swap the body.
 */
export const visitPage = async (url: string, { action = 'push' } = {}) => {
  cache[currentUrl] = document.cloneNode(true) as Document
  const dom = cache[url] ?? (await loadPage(url))

  document.dispatchEvent(new Event('very-simple-links:visit'))

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

  currentUrl = url
  if (action === 'replace') {
    history.replaceState(null, null, url)
  } else if (action === 'push') {
    history.pushState(null, null, url)
  }
}
