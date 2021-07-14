import Router from '../node_modules/very-simple-router/dist/index.es.js'
import { useRouter } from '../dist/index.es.js'

const router = new Router()
useRouter(router)

router.route('[/dev]/route/:type', ({ type }) => {
  document.getElementById('route').innerHTML = `Route ${type}`
})

router.route('[/dev/hello.html]/:name', ({ name }) => {
  document.getElementById('hello').innerHTML = `Hello ${name}!`
})

router.init()

export { router }
