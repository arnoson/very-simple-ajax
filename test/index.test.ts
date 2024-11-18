import { expect, test } from '@playwright/test'
import { randomBytes } from 'node:crypto'

test('page visit works', async ({ page }) => {
  await page.goto('/example/index.html')
  await expect(page).toHaveTitle(/Very Simple Ajax/)

  await page.locator("a[href='/example/about.html']").click()
  await expect(page).toHaveURL('/example/about.html')
  await expect(page).toHaveTitle(/About/)
  expect(await page.locator('h1').innerText()).toBe('About')

  await page.goBack()
  await expect(page).toHaveURL('/example/index.html')
})

test('permanent elements are kept alive', async ({ page }) => {
  await page.goto('/example/permanent/index.html')

  // I haven't found a way to assert if two DOM nodes are the same. As a
  // workaround a random hash is created at runtime to identify the DOM node.
  const hash = randomBytes(20).toString('hex')

  await page.evaluate((hash) => {
    // @ts-ignore
    document.querySelector<HTMLElement>('#slider')!.$hash = hash
  }, hash)

  await page.locator("a[href='/example/permanent/other.html']").click()

  const newHash = await page.evaluate(
    // @ts-ignore
    () => document.querySelector<HTMLElement>('#slider')!.$hash
  )

  expect(newHash).toBe(hash)
})

test('manual navigation works', async ({ page }) => {
  await page.goto('/example/index.html')
  await page.evaluate(() =>
    // @ts-ignore
    window.ajax.visit('/example/about.html', { action: 'push' })
  )
  await expect(page).toHaveURL('/example/about.html')
})
