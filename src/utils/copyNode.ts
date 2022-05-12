import { copyAttributes } from './copyAttributes'

/**
 * Copy a script tag by creating a new one and copying all attributes and
 * content from the specified script. This is necessary as scripts that that are
 * copied with `script.cloneNode()` are note evaluated.
 */
const copyScript = (script: HTMLScriptElement) => {
  const copy = document.createElement('script')
  copy.innerHTML = script.innerHTML
  copyAttributes(script, copy)
  return copy
}

/**
 * Copy a node and take care of script nodes (see: {@link copyScript})
 */
export const copyNode = (node: Node) =>
  node instanceof HTMLScriptElement ? copyScript(node) : node.cloneNode(true)
