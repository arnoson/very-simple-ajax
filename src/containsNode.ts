/**
 * Check if a list of nodes contains a node that is *equal* to the specified
 * node.
 */
export const containsNode = (nodes: Element[], node: Element) =>
  nodes.find((el) => el.isEqualNode(node))
