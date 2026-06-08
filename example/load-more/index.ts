import { component, mount, useEl } from '@very-simple/components'
import { useEventListener } from '@very-simple/components/use'
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
document.addEventListener('simple-ajax:visit', initPage)

ajax.start()
initPage()
