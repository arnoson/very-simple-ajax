import { config } from './config'
import { prefetch } from './prefetch'
import { currentState, currentUrl, normalizeUrl, visit } from './visit'
import { MergeStrategy, VisitOptions } from './types'

export const interceptLinks = () => {
  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || isModifiedClick(e)) return

    const target = (e.composedPath ? e.composedPath()[0] : e.target) as
      | Element
      | undefined
    const link = target?.closest?.('a')
    if (!link || !isInterceptable(link)) return

    e.preventDefault()
    visit(link.href, { history: 'push', ...getVisitOptions(link) })
  })
}

const isInterceptable = (link: HTMLAnchorElement) => {
  if (!link.href) return false
  const isExternalTarget = link.target && link.target !== '_self'
  return !(
    link.hasAttribute(`${config.prefix}reload`) ||
    link.hasAttribute('download') ||
    isExternalTarget ||
    !isSameOrigin(link.href)
  )
}

const HOVER_DELAY = 65

const getPrefetchStrategy = (link: Element) => {
  const attr = link.getAttribute(`${config.prefix}prefetch`)
  if (attr === null) return config.prefetch
  if (attr === 'false') return false
  if (attr === 'hover' || attr === 'mousedown') return attr
  return config.prefetch || 'hover'
}

export const interceptPrefetch = () => {
  let hoverTimeout: number | undefined
  let hoverLink: Element | undefined

  const run = (link: HTMLAnchorElement) => {
    if ((navigator as any).connection?.saveData) return
    const url = normalizeUrl(link.href)
    if (url === currentUrl) return
    const regions = getVisitOptions(link).regions ?? config.regions
    prefetch(url, regions)
  }

  const findLink = (e: Event) => {
    const link = (e.target as Element | null)?.closest?.('a')
    if (!link || !getPrefetchStrategy(link) || !isInterceptable(link)) return
    return link
  }

  const clearHover = () => {
    clearTimeout(hoverTimeout)
    hoverLink = undefined
  }

  document.addEventListener('mouseover', (e) => {
    const link = findLink(e)
    if (!link || link === hoverLink || getPrefetchStrategy(link) !== 'hover')
      return
    clearHover()
    hoverLink = link
    hoverTimeout = window.setTimeout(() => run(link), HOVER_DELAY)
  })

  document.addEventListener('mouseout', (e) => {
    const to = (e as MouseEvent).relatedTarget as Node | null
    if (hoverLink && !(to && hoverLink.contains(to))) clearHover()
  })

  document.addEventListener('focusin', (e) => {
    const link = findLink(e)
    if (link && getPrefetchStrategy(link) === 'hover') run(link)
  })

  // Touch has no hover, so it counts as a press for both strategies.
  document.addEventListener(
    'touchstart',
    (e) => {
      const link = findLink(e)
      if (link) run(link)
    },
    { passive: true },
  )

  document.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return
    const link = findLink(e)
    if (link) run(link)
  })
}

export const interceptForms = () => {
  document.addEventListener('submit', (e) => {
    const form = e.target
    if (
      e.defaultPrevented ||
      !(form instanceof HTMLFormElement) ||
      form.hasAttribute(`${config.prefix}reload`)
    )
      return

    const submitter = e.submitter as HTMLElement | null

    // A named `<input name="action">`/`<input name="method">` shadows the
    // form's `action`/`method` properties, turning them into elements.
    const formAction =
      typeof form.action === 'string'
        ? form.action
        : form.getAttribute('action')
    const formMethod =
      typeof form.method === 'string'
        ? form.method
        : form.getAttribute('method')

    const method = (
      submitter?.getAttribute('formmethod') ??
      formMethod ??
      'get'
    ).toLowerCase()

    // The "dialog" method is handled entirely by the browser.
    if (method === 'dialog') return

    const action =
      submitter?.getAttribute('formaction') ?? formAction ?? location.href
    if (!isSameOrigin(action)) return

    const formData = new FormData(form, submitter ?? undefined)
    let url = action
    const request: RequestInit = { method }

    if (method === 'get') {
      const urlObj = new URL(action, location.href)
      urlObj.search = new URLSearchParams(formData as any).toString()
      url = urlObj.toString()
    } else {
      request.body = formData
    }

    e.preventDefault()
    visit(url, { history: 'push', ...getVisitOptions(form), request })
  })
}

export const interceptHistory = () => {
  window.addEventListener('popstate', (event) => {
    // A same-page fragment navigation (e.g. clicking a `#anchor` link) also
    // fires `popstate`, but there's nothing to fetch/merge since the
    // pathname/search haven't changed, so let the browser's native scroll
    // stand instead of re-visiting the page.
    if (normalizeUrl(window.location.href) === normalizeUrl(currentUrl)) return

    // Use the regions from the state of the page we're navigating away from
    // (not `event.state`, which belongs to the page we're going back/forward
    // to) since those are the regions that were used to reach the current
    // page and describe the diff between it and the target page.
    visit(window.location.href, {
      history: 'none',
      isBackForward: true,
      regions: currentState?.regions ?? config.regions,
      state: event.state,
    })
  })
}

const isSameOrigin = (url: string) =>
  new URL(url, location.href).origin === location.origin

const isModifiedClick = (e: MouseEvent) =>
  e.button !== 0 || e.metaKey || e.ctrlKey || e.altKey || e.shiftKey

const getVisitOptions = (
  el: Element,
): Partial<Pick<VisitOptions, 'history' | 'regions' | 'state' | 'merge'>> => {
  const prefix = config.prefix
  const options: Partial<
    Pick<VisitOptions, 'history' | 'regions' | 'state' | 'merge'>
  > = {}

  const historyAttr = el.getAttribute(`${prefix}history`)
  if (historyAttr) options.history = historyAttr as VisitOptions['history']

  const regions = el.getAttribute(`${prefix}regions`)
  if (regions) {
    options.regions = regions
      .split(',')
      .map((region) => region.trim())
      .filter(Boolean)
  }

  const state = el.getAttribute(`${prefix}state`)
  if (state) {
    try {
      options.state = JSON.parse(state)
    } catch {
      console.error(`Invalid ${prefix}state on`, el)
    }
  }

  const merge = el.getAttribute(`${prefix}merge`)
  if (merge) options.merge = merge as MergeStrategy

  return options
}
