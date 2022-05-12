/**
 * Copy all attributes from the source element to the target element.
 */
export const copyAttributes = (source: Element, target: Element) => {
  for (let i = 0; i < source.attributes.length; i++) {
    target.setAttribute(source.attributes[i].name, source.attributes[i].value)
  }
}
