import router, { RouteAction } from '@very-simple/router'
import links from '../src'

type Router = typeof router

export const useRouter = (router: Router) => {
  // As a resource we define the url that has to be fetched. For example: there
  // might be a page that uses a router to show dynamic content based on an url
  // param. Its pattern could look like this: `/my-page/:param`. It doesn't
  // matter if we visit `/my-page/a` or `/my-page/b`, in either case we have to
  // fetch the resource `/my-page`.
  const resources: Record<string, string> = {}
  let currentResource: string

  // We monkey-patch `router.route()` so it accepts a slightly modified pattern.
  // We can now define a route like this: `router.route('[/my-page]/:param')`
  // where `/my-page` is the resource to fetch for the route.
  const route = router.route.bind(router)
  router.route = (pattern: string, action: RouteAction) => {
    let resource = '/'
    pattern = pattern.replace(/(\[.*\])/, (match) => {
      resource = match.slice(1, -1)
      return resource
    })
    resources[pattern] = resource
    route(pattern, action)
  }

  // Check before each route (or any history navigation) if we have to fetch the
  // necessary resource.
  router.on('before-route', async (route) => {
    const previousResource = currentResource
    currentResource = (route.pattern && resources[route.pattern]) ?? route.path

    if (previousResource && previousResource !== currentResource) {
      // Visit the page without causing a history action as the router already
      // does this.
      const action = 'none'

      // We cache the previous page by it's resource, so `/my-page/a`
      // and `/my-page/b` would both use the same cache id `/my-page`.
      const cacheId = previousResource

      // To simulate the browser behavior we only restore the page from cache
      // if the route has been caused by a back/forward navigation.
      const useCache = route.trigger === 'popstate'

      await links.visit(currentResource, { action, useCache, cacheId })
    }
  })
}
