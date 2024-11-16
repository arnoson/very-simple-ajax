import { registerComponent, mountComponents } from '@very-simple/components'
import ajax from '../../src'

registerComponent('load-more', ({ el }) => {
  el.addEventListener('click', async (e) => {
    e.preventDefault()
    ajax.visit(el.getAttribute('href')!)
  })
})

const initPage = () => mountComponents()
document.addEventListener('simple-ajax:visit', initPage)

ajax.start()
initPage()
