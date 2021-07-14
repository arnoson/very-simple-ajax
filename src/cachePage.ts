export const cache: Record<string, Document> = {}

export const cachePage = (url: string) =>
  (cache[url] = document.cloneNode(true) as Document)
