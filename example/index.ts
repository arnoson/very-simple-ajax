import { mountComponents } from '@very-simple/components'
import './link'
import './counter'
import links from '../src'

const initPage = () => mountComponents()
links.on('visit', initPage)
links.start()
initPage()

// This is only needed for testing.
// @ts-ignore
window.links = links
const root = document.documentElement
const count = parseInt(root.dataset.headScriptCount ?? '0') + 1
root.dataset.headScriptCount = `${count}`
