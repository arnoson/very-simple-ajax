import links from '../../src'

const initPage = () => {
  document.querySelectorAll<HTMLElement>('a:not([data-init])').forEach((el) => {
    el.addEventListener('click', (event) => {
      event.preventDefault()
      links.visit(el.getAttribute('href'))
    })
    el.dataset.init = 'true'
  })
}

document.addEventListener('DOMContentLoaded', initPage)
links.on('visit', initPage)
links.start()
