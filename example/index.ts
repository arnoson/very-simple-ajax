import { mountComponents } from '@very-simple/components'
import './link'
import './counter'
import ajax from '../src'

const initPage = () => mountComponents()
document.addEventListener('simple-ajax:visit', initPage)

ajax.start()
initPage()

// This is only needed for testing.
// @ts-ignore
window.ajax = ajax
const root = document.documentElement
const count = parseInt(root.dataset.headScriptCount ?? '0') + 1
root.dataset.headScriptCount = `${count}`
