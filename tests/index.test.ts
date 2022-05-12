import { describe, it, expect, vi } from 'vitest'
import * as links from '../src'
import fs from 'fs/promises'
import { resolve } from 'path'

const globalRef = global as any

const mockFetch = (content: string) => {
  const fetchResponse = {
    text: () => Promise.resolve(content),
  }
  globalRef.fetch = vi.fn(() => Promise.resolve(fetchResponse))
}

const loadFile = async (file: string) =>
  (await fs.readFile(resolve(__dirname, file))).toString()

describe('links', () => {
  it('visits a new page', async () => {
    const documentMarkup =
      '<html><head><title>Test</title></head><body>Test</body></html>'

    mockFetch(documentMarkup)
    await links.visit('test.html')

    expect(document.documentElement.outerHTML).toBe(documentMarkup)
  })

  it('merges the heads and swaps the body', async () => {
    const oldPage = await loadFile('old-page.html')
    const newPage = await loadFile('new-page.html')

    document.documentElement.innerHTML = oldPage
    mockFetch(newPage)

    await links.visit('new-page.html')
    expect(document.documentElement).toMatchSnapshot()
  })
})
