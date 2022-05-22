import { LinksEvent } from './types'

const handlers: Record<string, Function[]> = {}

export const on = (event: LinksEvent, handler: Function) => {
  handlers[event] ??= []
  handlers[event].push(handler)
}

export const off = (event: LinksEvent, handler: Function) => {
  handlers[event]?.splice(handlers[event].indexOf(handler), 1)
}

export const emit = async (event: LinksEvent, payload: { url: string }) => {
  for (const handler of handlers[event] ?? []) {
    await handler(payload)
  }
}
