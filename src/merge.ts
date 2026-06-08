import { MergeStrategy } from './types'
// @ts-ignore (missing types)
import { Idiomorph } from 'idiomorph/dist/idiomorph.esm.js'
import { unmount, mount } from '@very-simple/components'

export const merge = (
  region: HTMLElement,
  newRegion: HTMLElement,
  strategy: MergeStrategy,
): { autoFocusEl: HTMLElement | undefined } => {
  let autoFocusEl: HTMLElement | undefined

  if (strategy === 'replace' || strategy === 'update') {
    // Extract permanents before unmounting so their components stay alive.
    const permanents = new Map<string, Element>()
    newRegion.querySelectorAll('[data-simple-permanent][id]').forEach((el) => {
      const original = region.querySelector(`#${el.id}`)
      if (original) {
        permanents.set(el.id, original)
        original.remove()
        console.log('original', original)
      }
    })

    unmount(region)

    if (strategy === 'replace') region.replaceWith(newRegion)
    else region.replaceChildren(...Array.from(newRegion.children))

    // Re-insert permanents into the new content.
    newRegion.querySelectorAll('[data-simple-permanent][id]').forEach((el) => {
      const original = permanents.get(el.id)
      if (original) el.replaceWith(original)
    })

    mount(strategy === 'replace' ? newRegion : region)
  } else if (strategy === 'before') {
    region.insertAdjacentElement('beforebegin', newRegion)
    mount(newRegion)
  } else if (strategy === 'after') {
    region.insertAdjacentElement('afterend', newRegion)
    mount(newRegion)
  } else if (strategy === 'prepend') {
    region.insertAdjacentElement('afterbegin', newRegion)
    mount(newRegion)
  } else if (strategy === 'append') {
    region.insertAdjacentElement('beforeend', newRegion)
    mount(newRegion)
  } else if (strategy === 'morph') {
    const result = morph(region, newRegion)
    autoFocusEl = result.autoFocusEl
  }

  // Morph already replaced any permanent elements; replace/update handled above.

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

        // Each node could be a Very Simple Component. If the component type
        // changes we replace manually to properly unmount the old component.
        const isOldComponent = oldNode.hasAttribute('#component')
        const isNewComponent = newNode.hasAttribute('#component')
        const isSameComponent =
          isOldComponent &&
          isNewComponent &&
          oldNode.getAttribute('#component') ===
            newNode.getAttribute('#component')

        // Nothing to clean up if the old node isn't a component or both nodes
        // are the same component.
        if (!isOldComponent || isSameComponent) return true

        manualReplacements.push([oldNode, newNode])
      },
      beforeAttributeUpdated: (name: string) => {
        return !currentNodeKeepAttributes.includes(name)
      },
      beforeNodeRemoved(node: Node) {
        if (
          node instanceof HTMLElement &&
          !node.hasAttribute('data-simple-permanent')
        ) {
          unmount(node)
        }
        return true
      },
      afterNodeAdded(node: Node) {
        if (node instanceof HTMLElement && node.hasAttribute('#component')) {
          mount(node)
        }
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

  for (const [oldEl, newEl] of manualReplacements) {
    unmount(oldEl)
    oldEl.replaceWith(newEl)
    mount(newEl)
  }

  // Find the first auto focus element, where [data-simple-autofocus] wins over
  // [autofocus].
  const autoFocusEl =
    autoFocusEls.find((el) => el.dataset.simpleAutofocus) ??
    autoFocusEls.find((el) => el.autofocus)

  return { autoFocusEl }
}
