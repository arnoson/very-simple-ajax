export const replaceWith = (oldChild: Element, newChild: Element) =>
  oldChild?.parentElement?.replaceChild(newChild, oldChild)
