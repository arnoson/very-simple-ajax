import * as ajax from '../src'

// Exposed for manual/debugging use in the browser console and in tests.
// @ts-ignore
window.ajax = ajax

ajax.start()

// Re-queried on each event since `#progress` may be replaced by a visit's merge.
document.addEventListener('ajax:progress-start', () => {
  document.getElementById('progress')!.hidden = false
})
document.addEventListener('ajax:progress', ((e: CustomEvent) => {
  document.getElementById('progress')!.style.width =
    `${e.detail.progress * 100}%`
}) as EventListener)
document.addEventListener('ajax:progress-end', () => {
  document.getElementById('progress')!.hidden = true
})
