const parser = new DOMParser()

export type LoadPageResponse = {
  document?: Document
  error?: Error
  response?: Response
}

/**
 * Load and parse an html page.
 * @throws
 */
export const loadPage = async (url: string): Promise<LoadPageResponse> => {
  try {
    // Todo: show progress (https://javascript.info/fetch-progress)
    const response = await fetch(url)
    const document = parser.parseFromString(await response.text(), 'text/html')
    return { document, response }
  } catch (error) {
    return { error }
  }
}
