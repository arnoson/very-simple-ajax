type EventMap = {
  visit: { url: string }
  'before-visit': { url: string }
  'before-render': { url: string; newDocument: Document }
}

type EventHandler<E extends keyof EventMap> = (
  payload: EventMap[E]
) => void | Promise<void>

const handlers: { [K in keyof EventMap]?: EventHandler<K>[] } = {}

export const on = <E extends keyof EventMap>(
  event: E,
  handler: EventHandler<E>
) => {
  handlers[event] ??= []
  handlers[event].push(handler)
}

export const off = <E extends keyof EventMap>(
  event: E,
  handler: EventHandler<E>
) => {
  handlers[event]?.splice(handlers[event].indexOf(handler), 1)
}

export const emit = async <E extends keyof EventMap>(
  event: E,
  payload: EventMap[E]
) => {
  for (const handler of handlers[event] ?? []) await handler(payload)
}
