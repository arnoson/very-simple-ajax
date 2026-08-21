import { expect, test } from '@playwright/test'

test('page visit works', async ({ page }) => {
  await page.goto('/example/index.html')
  await expect(page).toHaveTitle(/Very Simple Ajax/)

  await page.locator('#about-link').click()
  await expect(page).toHaveURL('/example/about.html')
  await expect(page).toHaveTitle(/About/)
  expect(await page.locator('h1').innerText()).toBe('About')

  await page.goBack()
  await expect(page).toHaveURL('/example/index.html')
})

test('before-swap can delay dom swap', async ({ page }) => {
  await page.goto('/example/index.html')

  await page.evaluate(() => {
    let resumeRender: (() => void) | undefined

    // @ts-ignore
    window.resumeRender = () => resumeRender?.()

    document.addEventListener('ajax:before-swap', (event) => {
      const customEvent = event as CustomEvent<{
        waitUntil: (promise: Promise<unknown>) => void
      }>

      customEvent.detail.waitUntil(
        new Promise<void>((resolve) => {
          resumeRender = resolve
        }),
      )
    })
  })

  await page.locator('#about-link').click()

  // The URL updates immediately (like native browser navigation), even
  // though the dom swap is still delayed by `waitUntil`.
  await expect(page).toHaveURL('/example/about.html')
  await expect(page.locator('#heading')).toHaveText('Home')

  await page.evaluate(
    // @ts-ignore
    () => window.resumeRender(),
  )

  await expect(page).toHaveURL('/example/about.html')
  await expect(page.locator('h1')).toHaveText('About')
})

test('permanent elements are kept alive', async ({ page }) => {
  await page.goto('/example/permanent/index.html')

  // I haven't found a way to assert if two DOM nodes are the same. As a
  // workaround a random hash is created at runtime to identify the DOM node.
  const hash = crypto.getRandomValues(new Uint8Array(20)).join('')

  await page.evaluate((hash) => {
    // @ts-ignore
    document.querySelector<HTMLElement>('#interval')!.$hash = hash
  }, hash)

  await page.locator("a[href='/example/permanent/other.html']").click()

  const newHash = await page.evaluate(
    // @ts-ignore
    () => document.querySelector<HTMLElement>('#interval')!.$hash,
  )

  expect(newHash).toBe(hash)
})

test('manual navigation works', async ({ page }) => {
  await page.goto('/example/index.html')
  await page.evaluate(() =>
    // @ts-ignore
    window.ajax.visit('/example/about.html', { history: 'push' }),
  )
  await expect(page).toHaveURL('/example/about.html')
})

test('events receive from/to page state', async ({ page }) => {
  await page.goto('/example/index.html')

  const events: Record<string, unknown> = {}
  await page.exposeFunction('record', (type: string, detail: unknown) => {
    events[type] = detail
  })

  await page.evaluate(() => {
    const record = (type: string) => (event: Event) => {
      const detail = (event as CustomEvent).detail
      // @ts-ignore
      window.record(type, {
        fromUrl: detail.from.url,
        toUrl: detail.to.url,
        fromIsDocument: detail.from.document instanceof Document,
        toIsDocument: detail.to.document instanceof Document,
        isBackForward: detail.isBackForward,
      })
    }
    document.addEventListener('ajax:before-visit', record('before-visit'))
    document.addEventListener('ajax:before-swap', record('before-swap'))
    document.addEventListener('ajax:after-swap', record('after-swap'))
    document.addEventListener('ajax:load', record('load'))
  })

  await page.locator('#about-link').click()
  await expect(page).toHaveURL('/example/about.html')
  await expect.poll(() => Object.keys(events).length).toBe(4)

  expect(events['before-visit']).toEqual({
    fromUrl: '/example/index.html',
    toUrl: '/example/about.html',
    fromIsDocument: true,
    // `to.document` isn't loaded yet when `before-visit` fires.
    toIsDocument: false,
    isBackForward: false,
  })
  expect(events['before-swap']).toEqual({
    fromUrl: '/example/index.html',
    toUrl: '/example/about.html',
    fromIsDocument: true,
    toIsDocument: true,
    isBackForward: false,
  })
  expect(events['after-swap']).toEqual({
    fromUrl: '/example/index.html',
    toUrl: '/example/about.html',
    fromIsDocument: true,
    toIsDocument: true,
    isBackForward: false,
  })
  expect(events['load']).toEqual({
    fromUrl: '/example/index.html',
    toUrl: '/example/about.html',
    fromIsDocument: true,
    toIsDocument: true,
    isBackForward: false,
  })
})

test('plain links are intercepted by default', async ({ page }) => {
  await page.goto('/example/index.html')

  const [request] = await Promise.all([
    page.waitForRequest('/example/about.html'),
    page.locator('#plain-link').click(),
  ])

  expect(request.headers()['x-very-simple-ajax']).toBe('true')
  await expect(page).toHaveURL('/example/about.html')
})

test('links with the reload attribute are not intercepted', async ({
  page,
}) => {
  await page.goto('/example/index.html')

  const [request] = await Promise.all([
    page.waitForRequest('/example/about.html'),
    page.locator('#reload-link').click(),
  ])

  expect(request.headers()['x-very-simple-ajax']).toBeUndefined()
  await expect(page).toHaveURL('/example/about.html')
})

test('links with target="_blank" are not intercepted', async ({ page }) => {
  await page.goto('/example/index.html')

  const [popup] = await Promise.all([
    page.waitForEvent('popup'),
    page.locator('#blank-link').click(),
  ])

  await expect(popup).toHaveURL('/example/about.html')
})

test('get forms are intercepted by default', async ({ page }) => {
  await page.goto('/example/form/index.html')

  const [request] = await Promise.all([
    page.waitForRequest(/\/example\/form\/other\.html/),
    page.locator('#get-form button').click(),
  ])

  expect(request.headers()['x-very-simple-ajax']).toBe('true')
  expect(request.method()).toBe('GET')
  await expect(page).toHaveURL('/example/form/other.html?q=hello')
  await expect(page.locator('h1')).toHaveText('Form Result')
})

test('post forms are intercepted by default', async ({ page }) => {
  await page.goto('/example/form/index.html')

  const [request] = await Promise.all([
    page.waitForRequest('/example/form/other.html'),
    page.locator('#post-form button').click(),
  ])

  expect(request.headers()['x-very-simple-ajax']).toBe('true')
  expect(request.method()).toBe('POST')
  await expect(page).toHaveURL('/example/form/other.html')
  await expect(page.locator('h1')).toHaveText('Form Result')
})

test('forms with the reload attribute are not intercepted', async ({
  page,
}) => {
  await page.goto('/example/form/index.html')

  const [request] = await Promise.all([
    page.waitForRequest(/\/example\/form\/other\.html/),
    page.locator('#reload-form button').click(),
  ])

  expect(request.headers()['x-very-simple-ajax']).toBeUndefined()
  await expect(page).toHaveURL(/\/example\/form\/other\.html\??$/)
})

test('forms with fields named "action"/"method" are still intercepted correctly', async ({
  page,
}) => {
  await page.goto('/example/form/index.html')

  const [request] = await Promise.all([
    page.waitForRequest(/\/example\/form\/other\.html/),
    page.locator('#named-field-form button').click(),
  ])

  expect(request.headers()['x-very-simple-ajax']).toBe('true')
  expect(request.method()).toBe('GET')
  await expect(page).toHaveURL(
    '/example/form/other.html?action=not-a-url&method=not-a-method',
  )
  await expect(page.locator('h1')).toHaveText('Form Result')
})

test('links with the ajax-merge attribute override the default merge strategy', async ({
  page,
}) => {
  await page.goto('/example/index.html')

  // I haven't found a way to assert if two DOM nodes are the same. As a
  // workaround a random hash is created at runtime to identify the DOM node.
  const hash = crypto.getRandomValues(new Uint8Array(20)).join('')
  await page.evaluate((hash) => {
    // @ts-ignore
    document.body.$hash = hash
  }, hash)

  await page.locator('#merge-link').click()
  await expect(page).toHaveURL('/example/about.html')

  // `update` keeps the region element itself and only swaps its children,
  // unlike the default `replace` strategy which swaps the element itself.
  const newHash = await page.evaluate(
    // @ts-ignore
    () => document.body.$hash,
  )
  expect(newHash).toBe(hash)
})

test('links with the ajax-regions attribute only update the given region', async ({
  page,
}) => {
  await page.goto('/example/index.html')

  await page.locator('#region-link').click()
  await expect(page).toHaveURL('/example/about.html')
  await expect(page.locator('#heading')).toHaveText('About')

  // The rest of the page wasn't touched, since only `#heading` was a target
  // region.
  await expect(page.locator('#plain-link')).toBeVisible()
})

test('links with the ajax-state attribute set custom history state', async ({
  page,
}) => {
  await page.goto('/example/index.html')

  await page.locator('#state-link').click()
  await expect(page).toHaveURL('/example/about.html')

  const state = await page.evaluate(() => history.state)
  expect(state.template).toBe('custom')
})

test('links with the ajax-history attribute override the default push action', async ({
  page,
}) => {
  await page.goto('/example/index.html')

  await page.locator('#about-link').click()
  await expect(page).toHaveURL('/example/about.html')

  await page.locator('#replace-link').click()
  await expect(page).toHaveURL('/example/index.html')

  // The replace-link visit replaced the "about" entry instead of pushing a
  // new one, so going back skips straight past it to the original page.
  await page.goBack()
  await expect(page).toHaveURL('/example/index.html')
})

test('the regions option in start() sets default regions for all visits', async ({
  page,
}) => {
  await page.goto('/example/default-regions/index.html')

  // Tag the menu so we can tell if it was swapped even though its content
  // doesn't change between pages.
  const hash = crypto.getRandomValues(new Uint8Array(20)).join('')
  await page.evaluate((hash) => {
    // @ts-ignore
    document.querySelector<HTMLElement>('#menu')!.$hash = hash
  }, hash)

  await page.locator('#other-link').click()
  await expect(page).toHaveURL('/example/default-regions/other.html')
  await expect(page.locator('#heading')).toHaveText('Other')

  const newHash = await page.evaluate(
    // @ts-ignore
    () => document.querySelector<HTMLElement>('#menu')!.$hash,
  )
  expect(newHash).toBe(hash)
})
