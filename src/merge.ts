import { MergeStrategy, Regions } from './types'
// @ts-ignore (missing types)
import { Idiomorph } from 'idiomorph/dist/idiomorph.esm.js'

export const merge = (
  region: HTMLElement,
  newRegion: HTMLElement,
  strategy: MergeStrategy
): { autoFocusEl: HTMLElement | undefined } => {
  let autoFocusEl: HTMLElement | undefined

  if (strategy === 'replace') {
    region.replaceWith(newRegion)
  } else if (strategy === 'before') {
    region.insertAdjacentElement('beforebegin', newRegion)
  } else if (strategy === 'after') {
    region.insertAdjacentElement('afterend', newRegion)
  } else if (strategy === 'prepend') {
    region.insertAdjacentElement('afterbegin', newRegion)
  } else if (strategy === 'append') {
    region.insertAdjacentElement('beforeend', newRegion)
  } else if (strategy === 'update') {
    region.replaceChildren(...Array.from(newRegion.children))
  } else if (strategy === 'morph') {
    const result = morph(region, newRegion)
    autoFocusEl = result.autoFocusEl
  }

  // Morph already replaced any permanent elements.
  if (strategy !== 'morph') {
    newRegion.querySelectorAll('[data-simple-permanent][id]').forEach((el) => {
      const originalEL = region.querySelector(`#${el.id}`)
      if (originalEL) el.replaceWith(originalEL)
    })
  }

  // Find the first auto focus element, where [data-simple-autofocus] wins over
  // [autofocus]. First test the new region itself ...
  if (newRegion.hasAttribute('data-simple-autofocus') || newRegion.autofocus) {
    autoFocusEl ??= newRegion
  }
  // ... then look into it's children.
  autoFocusEl ??=
    newRegion.querySelector<HTMLElement>('[data-simple-autofocus]') ??
    newRegion.querySelector<HTMLElement>('[autofocus]') ??
    undefined

  return { autoFocusEl }
}

const morph = (container: Element, newContainer: Element) => {
  const manualReplacements: [HTMLElement, HTMLElement][] = []
  let autoFocusEls: HTMLElement[] = []

  // A list of attributes we want to keep unmodified/unremoved during the morph.
  let currentNodeKeepAttributes: string[] = []

  Idiomorph.morph(container, newContainer, {
    callbacks: {
      beforeNodeMorphed(oldNode: Node, newNode: Node) {
        // All following checks use dataset, which is only available on
        // HTMLElements.
        if (!(oldNode instanceof HTMLElement)) return true
        if (!(newNode instanceof HTMLElement)) return true

        currentNodeKeepAttributes =
          oldNode.dataset.simpleKeepAttributes?.split(' ') ?? []

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
      beforeAttributeUpdated: (name: string) => {
        return !currentNodeKeepAttributes.includes(name)
      },
      afterNodeMorphed(_: Node, newNode: Node) {
        if (
          newNode instanceof HTMLElement &&
          (newNode.autofocus || newNode.dataset.simpleAutofocus)
        ) {
          autoFocusEls.push(newNode)
        }
      },
    },
  })

  for (const [oldEl, newEl] of manualReplacements) oldEl.replaceWith(newEl)

  // Find the first auto focus element, where [data-simple-autofocus] wins over
  // [autofocus].
  const autoFocusEl =
    autoFocusEls.find((el) => el.dataset.simpleAutofocus) ??
    autoFocusEls.find((el) => el.autofocus)

  return { autoFocusEl }
}
