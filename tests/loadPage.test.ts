import { loadPage } from '../src/loadPage'
const globalRef = global as any

describe('loadPage', () => {
  it('loads a page and returns it as a document', async () => {
    const documentMarkup = '<html><head></head><body></body></html>'
    const fetchResponse = {
      text: () => Promise.resolve(documentMarkup),
    }

    globalRef.fetch = jest.fn(() => Promise.resolve(fetchResponse))

    const { response, document } = await loadPage('/url')
    expect(document.documentElement.outerHTML).toBe(documentMarkup)
    expect(response).toBe(fetchResponse)
  })

  it(`returns an error if it couldn't fetch`, async () => {
    globalRef.fetch = jest.fn(() => {
      throw new Error()
    })

    const { error } = await loadPage('/url')
    expect(error).toBeInstanceOf(Error)
  })
})
