import ajax from '../src'
import { registerComponent } from '@very-simple/components'

export default registerComponent('link', ({ el }) => {
  el.addEventListener('click', (e) => {
    const url = el.getAttribute('href')
    if (!url) return

    e.preventDefault()
    ajax.visit(url, { action: 'push' })
  })
})
