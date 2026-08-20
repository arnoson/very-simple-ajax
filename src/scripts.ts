import { config } from './config'

/**
 * Replace `<script>` elements inside `container` with freshly created ones,
 * since scripts inserted via `innerHTML`/morph/`replaceWith` don't execute.
 * Already executed scripts are marked so they aren't re-run, e.g. when morph
 * keeps an existing node across visits.
 */
export const executeScripts = (container: Element): Promise<unknown> => {
  const marker = `${config.prefix}script-executed`
  const waiting: Promise<unknown>[] = []

  for (const script of container.querySelectorAll('script')) {
    if (script.hasAttribute(marker)) continue

    const type = script.getAttribute('type')
    if (type && type !== 'module' && type !== 'text/javascript') continue

    const newScript = document.createElement('script')
    newScript.textContent = script.textContent
    for (const attr of script.attributes) {
      newScript.setAttribute(attr.name, attr.value)
    }
    newScript.setAttribute(marker, '')

    if (newScript.src) {
      waiting.push(
        new Promise((resolve) => {
          newScript.onload = newScript.onerror = resolve
        }),
      )
    }

    script.replaceWith(newScript)
  }

  return Promise.all(waiting)
}
