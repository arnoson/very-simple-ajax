import links from '../src'

const initPage = () =>
  document.querySelectorAll('a').forEach((el) => {
    // @ts-ignore
    if (el.$init) return
    el.addEventListener('click', async (event) => {
      event.preventDefault()
      links.visit(el.getAttribute('href')!)
    })
    // @ts-ignore
    el.$init = true
  })

links.on('visit', initPage)
links.start()
initPage()

// @ts-ignore (only needed for tests)
window.links = links

const root = document.documentElement
const count = parseInt(root.dataset.headScriptCount ?? '0') + 1
root.dataset.headScriptCount = `${count}`
