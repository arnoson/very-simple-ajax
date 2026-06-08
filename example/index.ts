import { component, mount, signal } from '@very-simple/components'
import { useInterval } from '@very-simple/components/use'
import ajax from '../src'
import './counter'
import './link'

component('interval', () => {
  let count = signal(0)
  useInterval(() => count.value++, 1000)
  return { count }
})

ajax.start()
mount()

// This is only needed for testing.
// @ts-ignore
window.ajax = ajax
const root = document.documentElement
const count = parseInt(root.dataset.headScriptCount ?? '0') + 1
root.dataset.headScriptCount = `${count}`
