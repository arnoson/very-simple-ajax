import { renderPage } from './renderPage'
import { emit } from './utils/emit'

// Make sure browser history navigation will restore pages.
const handlePopstate = async () => {
  const url = window.location.pathname
  await renderPage(url)
  emit('load', { url })
}

export const watchHistory = (enable = true) =>
  enable
    ? window.addEventListener('popstate', handlePopstate)
    : window.removeEventListener('popstate', handlePopstate)
