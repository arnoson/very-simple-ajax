import { expect, test } from '@playwright/test'

test('head callback can skip morphing the head', async ({ page }) => {
  await page.goto('/example/index.html')

  await page.evaluate(() =>
    // @ts-ignore
    window.ajax.visit('/example/about.html', {
      history: 'push',
      head: () => 'none',
    }),
  )

  await expect(page).toHaveURL('/example/about.html')
  await expect(page.locator('h1')).toHaveText('About')
  await expect(page).toHaveTitle(/Very Simple Ajax/)
})

test('head callback receives from/to state and isBackForward', async ({
  page,
}) => {
  await page.goto('/example/index.html')

  const info = await page.evaluate(async () => {
    let received: any
    // @ts-ignore
    await window.ajax.visit('/example/about.html', {
      history: 'push',
      state: { isPartial: true },
      head: (i: any) => {
        received = {
          fromUrl: i.from.url,
          toUrl: i.to.url,
          isPartial: i.to.state.isPartial,
          isBackForward: i.isBackForward,
        }
        return 'merge'
      },
    })
    return received
  })

  expect(info).toEqual({
    fromUrl: '/example/index.html',
    toUrl: '/example/about.html',
    isPartial: true,
    isBackForward: false,
  })
  await expect(page).toHaveTitle(/About/)
})

test('head callback can decide based on data-ajax-state', async ({ page }) => {
  await page.goto('/example/index.html')

  await page.evaluate(() => {
    // @ts-ignore
    window.ajax.start({
      head: ({ to }: any) => (to.state?.isPartial ? 'none' : 'merge'),
    })
  })

  await page.evaluate(() => {
    const link = document.createElement('a')
    link.id = 'partial-link'
    link.href = '/example/about.html'
    link.dataset.ajaxState = '{"isPartial": true}'
    document.body.append(link)
    link.click()
  })

  await expect(page).toHaveURL('/example/about.html')
  await expect(page.locator('h1')).toHaveText('About')
  await expect(page).toHaveTitle(/Very Simple Ajax/)
})

test('executeScripts callback can skip executing scripts', async ({ page }) => {
  await page.route('**/example/script.html', (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: `<!doctype html><html><head><title>Script</title></head>
        <body><h1>Script</h1><script>window.scriptRan = true</script></body></html>`,
    }),
  )

  await page.goto('/example/index.html')

  await page.evaluate(() =>
    // @ts-ignore
    window.ajax.visit('/example/script.html', {
      history: 'push',
      executeScripts: () => false,
    }),
  )
  await expect(page.locator('h1')).toHaveText('Script')
  expect(await page.evaluate(() => (window as any).scriptRan)).toBeUndefined()

  await page.evaluate(() =>
    // @ts-ignore
    window.ajax.visit('/example/index.html', { history: 'push' }),
  )
  await page.evaluate(() =>
    // @ts-ignore
    window.ajax.visit('/example/script.html', {
      history: 'push',
      executeScripts: () => true,
    }),
  )
  await expect(page.locator('h1')).toHaveText('Script')
  await expect
    .poll(() => page.evaluate(() => (window as any).scriptRan))
    .toBe(true)
})

test('viewTransitions callback decides whether a transition is used', async ({
  page,
}) => {
  await page.goto('/example/index.html')

  await page.evaluate(() => {
    ;(window as any).transitions = 0
    // Stub so the test doesn't depend on browser support.
    document.startViewTransition = ((cb: () => Promise<void>) => {
      ;(window as any).transitions++
      return { updateCallbackDone: Promise.resolve(cb()) }
    }) as any
  })

  await page.evaluate(() =>
    // @ts-ignore
    window.ajax.visit('/example/about.html', {
      history: 'push',
      viewTransitions: () => false,
    }),
  )
  await expect(page.locator('h1')).toHaveText('About')
  expect(await page.evaluate(() => (window as any).transitions)).toBe(0)

  await page.evaluate(() =>
    // @ts-ignore
    window.ajax.visit('/example/index.html', {
      history: 'push',
      viewTransitions: () => true,
    }),
  )
  await expect(page.locator('#heading')).toHaveText('Home')
  expect(await page.evaluate(() => (window as any).transitions)).toBe(1)
})
