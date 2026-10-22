import { expect, test } from '@playwright/test'

const addLink = (attrs: string) =>
  `(() => {
    const a = document.createElement('a')
    a.id = 'l'
    a.href = '/example/about.html'
    a.textContent = 'About'
    ${attrs}
    document.body.prepend(a)
  })()`

const countAbout = (page: import('@playwright/test').Page) => {
  const requests: string[] = []
  page.on('request', (r) => {
    if (r.url().endsWith('/example/about.html')) requests.push(r.url())
  })
  return requests
}

test('hover prefetches and the click reuses the request', async ({ page }) => {
  await page.goto('/example/index.html')
  const requests = countAbout(page)
  await page.evaluate(addLink(`a.setAttribute('data-ajax-prefetch', '')`))

  await page.hover('#l')
  await expect.poll(() => requests.length).toBe(1)

  await page.click('#l')
  await expect(page).toHaveURL('/example/about.html')
  await expect(page.locator('h1')).toHaveText('About')
  expect(requests).toHaveLength(1)
})

test('links without the attribute are not prefetched', async ({ page }) => {
  await page.goto('/example/index.html')
  const requests = countAbout(page)
  await page.evaluate(addLink(''))

  await page.hover('#l')
  await page.waitForTimeout(300)
  expect(requests).toHaveLength(0)
})

test('mousedown strategy prefetches on press, not on hover', async ({
  page,
}) => {
  await page.goto('/example/index.html')
  const requests = countAbout(page)
  await page.evaluate(
    addLink(`a.setAttribute('data-ajax-prefetch', 'mousedown')`),
  )

  await page.hover('#l')
  await page.waitForTimeout(300)
  expect(requests).toHaveLength(0)

  await page.click('#l')
  await expect(page).toHaveURL('/example/about.html')
  expect(requests).toHaveLength(1)
})
