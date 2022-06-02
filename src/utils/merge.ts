import { copyScript } from './copyScript'
import { replaceWith } from './replaceWith'

const containsEqualNode = (nodes: Element[], node: Element) =>
  nodes.find((el) => el.isEqualNode(node))

/**
 * Add all new children from source to target.
 */
export const merge = (target: HTMLElement, source: HTMLElement) => {
  const targetNodes = Array.from(target.children)
  const sourceNodes = Array.from(source.children)

  const metaNodesByName = new Map(
    Array.from(target.getElementsByTagName('meta')).map((el) => [el.name, el])
  )

  const fragment = new DocumentFragment()
  for (const node of sourceNodes) {
    if (node.tagName !== 'TITLE' && !containsEqualNode(targetNodes, node)) {
      const isMeta = node instanceof HTMLMetaElement
      const isScript = node instanceof HTMLScriptElement

      if (isMeta) {
        const targetNode = metaNodesByName.get(node.name)
        if (targetNode) {
          // There should exist only one `<meta>` element with a certain name.
          replaceWith(targetNode, node)
        } else {
          fragment.append(node)
        }
      } else {
        // Force the browser to execute any new scripts.
        fragment.append(isScript ? copyScript(node) : node)
      }
    }
  }
  target.append(fragment)
}
