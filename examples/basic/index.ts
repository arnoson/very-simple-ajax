import links from '../../src'

const initPage = () =>
  document.querySelectorAll('a').forEach((el) =>
    el.addEventListener('click', async (event) => {
      event.preventDefault()
      links.visit(el.getAttribute('href'))
    })
  )

document.addEventListener('very-simple-links:visit', initPage)
document.addEventListener('DOMContentLoaded', initPage)

links.start()
