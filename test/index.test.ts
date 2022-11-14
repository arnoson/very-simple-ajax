import { expect, test } from '@playwright/test'
import { randomBytes } from 'node:crypto'

// test.beforeEach(async ({ page }) => {
//   const client = await page.context().newCDPSession?.(page)
//   await client?.send('Network.setCacheDisabled', { cacheDisabled: true })
// })

test('page visit works', async ({ page }) => {
  await page.goto('/example/index.html')
  await expect(page).toHaveTitle(/Very Simple Links/)

  await page.locator('#about-link').click()
  await expect(page).toHaveURL('/example/about.html')
  await expect(page).toHaveTitle(/About/)
  expect(await page.locator('#heading').innerText()).toBe('About')

  await page.goBack()
  await expect(page).toHaveURL('/example/index.html')
})

test('permanent elements are kept alive', async ({ page }) => {
  await page.goto('/example/index.html')

  // I haven't found a way to assert if two DOM nodes are the same. As a
  // workaround a random hash is created at runtime to identify the DOM node.
  const hash = randomBytes(20).toString('hex')

  await page.evaluate((hash) => {
    document.querySelector<HTMLElement>('#progress')!.dataset.hash = hash
  }, hash)

  await page.locator('#about-link').click()

  const newHash = await page.evaluate(
    () => document.querySelector<HTMLElement>('#progress')!.dataset.hash
  )

  expect(newHash).toBe(hash)
})

test('head scripts are not re-executed', async ({ page }) => {
  await page.goto('/example/index.html')
  await page.locator('#about-link').click()
  await page.locator('#home-link').click()
  const count = await page.evaluate(
    () => document.documentElement.dataset.headScriptCount
  )
  expect(count).toBe('1')
})

test('body scripts are re-executed', async ({ page }) => {
  await page.goto('/example/index.html')
  await page.locator('#about-link').click()
  await page.locator('#home-link').click()
  const count = await page.evaluate(
    () => document.documentElement.dataset.bodyScriptCount
  )
  expect(count).toBe('3')
})

test('custom containers are swapped', async ({ page }) => {
  await page.goto('/example/container-a.html')
  await page.locator('#container-b-link').click()

  const h1 = page.locator('h1')
  const container = page.locator('#container')

  expect(await h1.innerText()).toBe('Body A')
  expect(await container.innerText()).toBe('Container B')

  await page.locator('#container-a-link').click()

  expect(await h1.innerText()).toBe('Body A')
  expect(await container.innerText()).toBe('Container A')
})

test('meta tags with same name are replaced', async ({ page }) => {
  await page.goto('/example/index.html')
  const templateMeta = page.locator('meta[name="template"]')

  expect(await templateMeta.count()).toBe(1)
  expect(await templateMeta.getAttribute('content')).toBe('home')

  await page.locator('#about-link').click()

  expect(await templateMeta.count()).toBe(1)
  expect(await templateMeta.getAttribute('content')).toBe('about')
})

test('manual navigation works', async ({ page }) => {
  await page.goto('/example/index.html')
  // @ts-ignore
  await page.evaluate(() => window.links.visit('/example/about.html'))
  await expect(page).toHaveURL('/example/about.html')
})
