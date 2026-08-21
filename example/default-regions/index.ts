import * as ajax from '../../src'

// Exposed for manual/debugging use in the browser console and in tests.
// @ts-ignore
window.ajax = ajax

ajax.start({ regions: ['#main'] })
