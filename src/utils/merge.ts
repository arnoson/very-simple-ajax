import { copyScript } from './copyScript'

const containsNode = (nodes: Element[], node: Element) =>
  nodes.find((el) => el.isEqualNode(node))

/**
 * Add all new children from source to target. Ignore `<title>` as there should
 * only be one `<title>` per document.
 */
export const merge = (target: HTMLElement, source: HTMLElement) => {
  const targetNodes = Array.from(target.children)
  const sourceNodes = Array.from(source.children)

  const fragment = new DocumentFragment()
  for (const node of sourceNodes) {
    if (node.tagName !== 'TITLE' && !containsNode(targetNodes, node)) {
      // Force the browser to execute any new scripts.
      const isScript = node instanceof HTMLScriptElement
      fragment.append(isScript ? copyScript(node) : node)
    }
  }
  target.append(fragment)
}
