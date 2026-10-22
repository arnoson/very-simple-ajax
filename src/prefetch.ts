import { config } from './config'

type Prefetched = { html: string; response: Response }

const store = new Map<string, { time: number; promise: Promise<Prefetched | undefined> }>()

const keyOf = (url: string, regions: string[]) => `${url}\n${regions.join(' ')}`

const isFresh = (time: number) => Date.now() - time < config.prefetchTtl

export const prefetch = (url: string, regions: string[]) => {
  for (const [key, entry] of store) if (!isFresh(entry.time)) store.delete(key)

  const key = keyOf(url, regions)
  if (store.has(key)) return

  const promise = fetch(url, {
    headers: {
      'X-Very-Simple-Ajax': 'true',
      'X-Very-Simple-Ajax-Regions': regions.join(' '),
    },
  })
    .then(async (response) => {
      if (!response.ok) return undefined
      return { html: await response.text(), response }
    })
    .catch(() => undefined)
    .then((result) => {
      // Failed prefetches must not block a later retry.
      if (!result) store.delete(key)
      return result
    })

  store.set(key, { time: Date.now(), promise })
}

/** Single-use: the entry is removed so a later visit never shows stale content. */
export const takePrefetched = (url: string, regions: string[]) => {
  const key = keyOf(url, regions)
  const entry = store.get(key)
  store.delete(key)
  return entry && isFresh(entry.time) ? entry.promise : undefined
}
