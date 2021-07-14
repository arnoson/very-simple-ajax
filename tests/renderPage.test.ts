import { cache } from '../src/cachePage'
import { renderPage } from '../src/renderPage'
import fs from 'fs/promises'
import { resolve } from 'path'

const loadFile = async (name) =>
  (await fs.readFile(resolve(__dirname, `assets/${name}`))).toString()

describe('render page', () => {
  it('merges the heads and swaps the body', async () => {
    document.documentElement.innerHTML = await loadFile('old-page.html')

    const parser = new DOMParser()
    cache['/url'] = parser.parseFromString(
      await loadFile('new-page.html'),
      'text/html'
    )

    await renderPage('/url')
    expect(document.documentElement).toMatchSnapshot()
  })
})
