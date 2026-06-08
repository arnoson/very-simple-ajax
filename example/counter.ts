import { component, signal } from '@very-simple/components'

export default component('counter', () => {
  const count = signal(0)
  return { count }
})
