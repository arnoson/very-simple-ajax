import { registerComponent, mountComponents } from '@very-simple/components'
import ajax from '../../src'

registerComponent('load-more', ({ el }) => {
  el.addEventListener('click', async (e) => {
    e.preventDefault()
    await ajax.visit(el.getAttribute('href')!)
    const firstNewArticle = Array.from(
      document.querySelectorAll<HTMLElement>(`article[tabindex='-1']`)
    ).at(-1)
    firstNewArticle?.focus()
  })
})

const initPage = () => mountComponents()
document.addEventListener('simple-ajax:visit', initPage)

ajax.start()
initPage()
