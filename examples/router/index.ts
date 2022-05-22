import router from '@very-simple/router'
import { useRouter } from '../../src/useRouter'
import links from '../../src'

const initPage = () =>
  document.querySelectorAll('a').forEach((el) =>
    el.addEventListener('click', async (event) => {
      event.preventDefault()
      router.push(el.getAttribute('href'))
    })
  )

document.addEventListener('very-simple-links:visit', initPage)
document.addEventListener('DOMContentLoaded', initPage)

useRouter(links, router)
router.start()
links.start({ watchHistory: false })
