import { copyNode } from './copyNode'
import { containsNode } from './containsNode'

/**
 * Add all new children vom source to target. Ignore `<title>` as there should
 * only be one `<title>` per document.
 * @param target
 * @param source
 */
export const merge = (target: HTMLElement, source: HTMLElement) => {
  const targetNodes = Array.from(target.children)
  const sourceNodes = Array.from(source.children)

  const fragment = new DocumentFragment()
  for (const node of sourceNodes) {
    if (node.tagName !== 'TITLE' && !containsNode(targetNodes, node)) {
      fragment.append(copyNode(node))
    }
  }
  target.append(fragment)
}
