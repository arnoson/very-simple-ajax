import { MergeStrategy, Regions } from './types'
// @ts-ignore (missing types)
import { Idiomorph } from 'idiomorph/dist/idiomorph.esm.js'

export const merge = (
  container: Element,
  newContainer: Element,
  strategy: MergeStrategy
) => {
  if (strategy === 'replace') {
    container.replaceWith(newContainer)
  } else if (strategy === 'before') {
    container.insertAdjacentElement('beforebegin', newContainer)
  } else if (strategy === 'after') {
    container.insertAdjacentElement('afterend', newContainer)
  } else if (strategy === 'prepend') {
    container.insertAdjacentElement('afterbegin', newContainer)
  } else if (strategy === 'append') {
    container.insertAdjacentElement('beforeend', newContainer)
  } else if (strategy === 'update') {
    container.replaceChildren(...Array.from(newContainer.children))
  } else if (strategy === 'morph') {
    morph(container, newContainer)
  }
}

const morph = (container: Element, newContainer: Element) => {
  const manualReplacements: [HTMLElement, HTMLElement][] = []
  Idiomorph.morph(container, newContainer, {
    callbacks: {
      beforeNodeMorphed(oldNode: Node, newNode: Node) {
        // All following checks use dataset, which is only available on
        // HTMLElements.
        if (!(oldNode instanceof HTMLElement)) return true
        if (!(newNode instanceof HTMLElement)) return true

        // Check if the old node is permanent and the new one is matching.
        if (
          oldNode.hasAttribute('data-simple-permanent') &&
          oldNode.id === newNode.id
        )
          return false

        // Each node could be a Very Simple Component that attached event
        // listeners to itself or its children. In this case we have to replace
        // the nodes manually instead of morphing in order to cleanup the
        // listeners.
        const oldComponent = oldNode.dataset.simpleComponent
        const newComponent = newNode.dataset.simpleComponent

        // Nothing to clean up, if the old node isn't a component are both nodes
        // are the same component.
        if (!oldComponent || oldComponent === newComponent) return true

        manualReplacements.push([oldNode, newNode])
      },
    },
  })
  for (const [oldEl, newEl] of manualReplacements) oldEl.replaceWith(newEl)
}
