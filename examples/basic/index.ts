import links from '../../src'

const initPage = () =>
  document.querySelectorAll('a').forEach((el) =>
    el.addEventListener('click', async (event) => {
      event.preventDefault()
      links.visit(el.getAttribute('href'))
    })
  )

document.addEventListener('DOMContentLoaded', initPage)
links.on('visit', initPage)
links.start()
