import { cachePage, cache } from '../src/cachePage'

test('caches the current document', () => {
  const documentMarkup = window.document.documentElement.outerHTML
  cachePage('/test/url')
  expect(cache['/test/url'].documentElement.outerHTML).toBe(documentMarkup)
})
