import Router from 'very-simple-router'
import { renderPage } from './renderPage'
import { cachePage } from './cachePage'
import { watchHistory } from './watchHistory'

export const useRouter = (router: Router) => {
  // Router is watching the history and is calling `beforeEach()` every time
  // something changes (even if no route is matching) so there is no need for
  // very-simple-links to watch the history.
  watchHistory(false)

  // As a `root` we define the actual resource that has to be fetched. For
  // example: there might be a page that uses router to show dynamic content
  // based on a url param. Its pattern could look like this: `/my-page/:param`.
  // It doesn't matter if we visit `/my-page/a` or `/my-page/b`, in either case
  // we have to fetch the resource `/my-page`, so this is the root.
  const roots = {}
  let currentRoot: string

  // We monkey-patch `router.route()` so it accepts a slightly modified pattern.
  // We can now define a route like this: `router.route('[/my-page]/:param')`
  // where `/my-page` is the resource to fetch for the route.
  const route = router.route.bind(router)
  router.route = (pattern, action) => {
    let root: string
    pattern = pattern.replace(/(\[.*\])/, (match) => {
      root = match.slice(1, -1)
      return root
    })
    roots[pattern] = root ?? '/'
    route(pattern, action)
  }

  // Check before each route (or any history navigation) if we have to fetch the
  // necessary resource.
  router.beforeEach(async (to) => {
    const previousRoot = currentRoot
    currentRoot = roots[to.pattern] ?? to.path

    if (previousRoot && previousRoot !== currentRoot) {
      // Note: we're caching the page under it's root path, not the full path.
      // So `/my-page/a` and `/my-page/b` would both use the same cache
      // `/my-page`.
      cachePage(previousRoot)
      await renderPage(currentRoot)
    }
  })

  document.addEventListener('very-simple-links:visit', (event: CustomEvent) => {
    currentRoot = event.detail.url
  })
}
