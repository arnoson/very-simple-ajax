import { defineConfig, Plugin } from 'vite'

const myPlugin = (): Plugin => ({
  name: 'configure-server',
  configureServer(server) {
    // return a post hook that is called after internal middlewares are
    // installed
    return () => {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/example/redirect.html') {
          res.statusCode = 302
          res.setHeader('Location', '/example/about.html')
          res.end()
          return
        }

        if (req.url === '/example/delay.html') {
          setTimeout(next, 3000)
          return
        }

        // Vite's static/html middlewares only handle GET, but we still want
        // to serve the page for POST form submissions in tests.
        if (req.method === 'POST' && req.url?.startsWith('/example/form/')) {
          req.method = 'GET'
        }

        next()
      })
    }
  },
})

export default defineConfig({
  plugins: [myPlugin()],
})
