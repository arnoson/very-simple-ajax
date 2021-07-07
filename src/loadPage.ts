const parser = new DOMParser()

/**
 * Load and parse an html page.
 */
export const loadPage = async (url: string) => {
  // Todo: show progress (https://javascript.info/fetch-progress)
  const html = await (await fetch(url)).text()
  return parser.parseFromString(html, 'text/html')
}
