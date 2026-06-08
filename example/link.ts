import { component, useEl } from '@very-simple/components'
import { useEventListener } from '@very-simple/components/use'
import ajax from '../src'

export default component('link', () => {
  const el = useEl<HTMLLinkElement>()

  useEventListener(el, 'click', (e) => {
    const url = el.value?.getAttribute('href')
    if (!url) return
    e.preventDefault()
    ajax.visit(url, { action: 'push', morphHeads: true })
  })
})
