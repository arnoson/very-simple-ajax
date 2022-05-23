import { describe, it, expect, vi } from 'vitest'
import links from '../src'
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
    const page =
      '<html style="--simple-progress: 0%;"><head><title>Test</title></head><body>Test</body></html>'

    mockFetch(page)
    await links.visit('test.html')

    expect(document.documentElement.outerHTML).toBe(page)
  })

  it('merges the heads and swaps the body', async () => {
    const pageA = await loadFile('a.html')
    const pageB = await loadFile('b.html')

    document.documentElement.innerHTML = pageA
    mockFetch(pageB)

    await links.visit('b.html')
    expect(document.documentElement).toMatchSnapshot()
  })

  it('handles custom containers', async () => {
    const pageA = await loadFile('container-a.html')
    const pageB = await loadFile('container-b.html')

    document.documentElement.innerHTML = pageA
    mockFetch(pageB)

    await links.visit('container-b.html')
    expect(document.documentElement).toMatchSnapshot()
  })

  it('keeps permanent elements alive', async () => {
    const page = `<html>
      <head><title>Test</title></head>
      <body>
        <img data-simple-permanent id="permanentImg" />
      </body>
    </html>`

    document.documentElement.innerHTML = page
    const permanentImg = document.getElementById('permanentImg')

    mockFetch(page)
    await links.visit('page.html')

    expect(permanentImg).toBe(document.getElementById('permanentImg'))
  })

  it('calls hooks before and after each visit', async () => {
    const handler = vi.fn()

    links.on('before-visit', handler)
    links.on('visit', handler)

    await links.visit('test.html')
    expect(handler).toBeCalledTimes(2)
  })
})
