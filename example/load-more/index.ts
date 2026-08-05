import { component, mount, unmount, useEl } from '@very-simple/framework'
import { useEventListener } from '@very-simple/framework/use'
import ajax from '../../src'

component('load-more', () => {
  const el = useEl<HTMLAnchorElement>()

  useEventListener(el, 'click', (e) => {
    e.preventDefault()
    const url = el.value?.getAttribute('href')
    if (!url) return
    ajax.visit(url, { regions: ['#posts', '#load-more'] })
  })
})

const initPage = () => mount()
document.addEventListener('ajax:visit', initPage)

ajax.start({ mount, unmount, prefix: '#' })
initPage()
