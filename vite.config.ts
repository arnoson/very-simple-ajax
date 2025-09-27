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

        next()
      })
    }
  },
})

export default defineConfig({
  plugins: [myPlugin()],
})
