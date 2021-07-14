import { renderPage } from './renderPage'

// Make sure browser history navigation will restore pages.
const handlePopstate = () => renderPage(window.location.pathname)

export const watchHistory = (enable = true) =>
  enable
    ? window.addEventListener('popstate', handlePopstate)
    : window.removeEventListener('popstate', handlePopstate)
