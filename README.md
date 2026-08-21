# 🧩 Very Simple Ajax

A very simple turbolinks inspired library based on [Idiomorph](https://github.com/bigskysoftware/idiomorph).
You can use it for progressive enhancements and to give your multi-page websites a SPA-like feel.

💾 only ~6kb (minify and gzip)

## Installation

```
npm install @very-simple/ajax
```

## Usage

```ts
import { start } from '@very-simple/ajax'
start()
```

```html
<a href="/about">About</a>
```

Clicking the link now fetches `/about`, morphs the browser history and
replaces the page content, without a full page reload.

Checkout the `/examples` folder for more examples.

### Attributes

Add these attributes to a link or form to tweak how its visit behaves,
without writing any JavaScript:

| Attribute           | Description                                                                          |
| ------------------- | ------------------------------------------------------------------------------------ |
| `data-ajax-reload`  | Opt out of interception entirely; the browser performs a normal navigation/submit.   |
| `data-ajax-regions` | Comma separated list of selectors to swap instead of the whole `<body>`.             |
| `data-ajax-history` | History mode to use: `push`, `replace` or `none`.                                    |
| `data-ajax-merge`   | Merge strategy for the swapped content, e.g. `morph`, `replace`, `before`, `append`. |
| `data-ajax-state`   | JSON encoded state to store in `history.state` for this visit.                       |

```html
<!-- only swap #content, preserving the merge strategy for that region -->
<a href="/about" data-ajax-regions="#content" data-ajax-merge="morph">About</a>

<!-- opt out of ajax handling for this link, e.g. to force a full reload -->
<a href="/logout" data-ajax-reload>Logout</a>
```

> The `data-ajax-` prefix can be customized via the `prefix` option in `start()`.

### `start(options?)`

Call this once when your app boots. It intercepts same-origin link clicks and
form submissions and turns them into ajax visits, and hooks into browser
back/forward navigation.

```ts
import { start } from '@very-simple/ajax'

start({
  // Strategy used to merge the swapped content into the current DOM.
  merge: 'replace',
  // Morph the `<head>` instead of leaving it untouched.
  morphHeads: true,
  // Re-execute `<script>` tags found in the swapped content.
  executeScripts: true,
  // Wrap navigations in the View Transitions API, if supported.
  viewTransitions: false,
  // Delay (ms) before showing a loading indicator on slow visits.
  loadingDelay: 500,
  // Delay (ms) before hiding the loading indicator again.
  progressHideDelay: 500,
  // Prefix used for the `data-ajax-*` attributes.
  prefix: 'data-ajax-',
  // Default selectors to swap instead of the whole `<body>`, used for visits
  // that don't specify their own `regions` (e.g. via `data-ajax-regions`).
  regions: [],
  // Custom scroll handling, e.g. restoring position on back/forward visits.
  scrollBehavior: ({ isBackForward, savedPosition }) =>
    isBackForward ? savedPosition : { top: 0 },
  // Called after an element is added to the DOM by a merge.
  mount: (el) => {},
  // Called before an element is removed from the DOM by a merge.
  unmount: (el) => {},
})
```

### `visit(url, options?)`

A lower-level API for triggering a visit programmatically, e.g. in
response to a custom event or timer instead of a link click:

```ts
import { visit } from '@very-simple/ajax'

visit('/about', {
  // History mode to use: `push`, `replace` or `none`.
  history: 'push',
  // Selectors to swap instead of the whole `<body>`.
  regions: ['#content'],
  // State to store in `history.state` for this visit.
  state: {},
  // Options passed through to the underlying `fetch()` call.
  request: {},
  // Focus the first element with `autofocus` in the swapped content.
  autoFocus: true,
  // ... You can also overwrite any option set in `start()` an a per-visit bases here.
})
```

### Events

Every visit fires a series of `CustomEvent`s on `document`, each namespaced
with `ajax:`:

| Event               | Description                                                                |
| ------------------- | -------------------------------------------------------------------------- |
| `ajax:before-visit` | Fired before the new page is fetched.                                      |
| `ajax:before-swap`  | Fired after the new document has been loaded, right before it's merged in. |
| `ajax:after-swap`   | Fired right after the new content has been merged in.                      |
| `ajax:load`         | Fired once the whole visit (including scroll/focus handling) has finished. |

#### Async listeners

Use `event.detail.waitUntil(promise)` on those same events to delay the
visit until the given promise settles, e.g. to run an animation before
continuing:

```ts
document.addEventListener('ajax:before-swap', (e) => {
  e.detail.waitUntil(animateIn())
})
```

#### Aborting

`before-visit`, `before-swap` and `after-swap` carry an `AbortSignal` in
`event.detail.signal`, which is aborted if the visit gets superseded by a
newer one (e.g. the user clicks another link while yours is still running).
If your listener does anything that isn't automatically cancelled, like a
manual animation loop, check `signal.aborted` (or listen for the signal's
`abort` event) to stop it early:

```ts
document.addEventListener('ajax:before-swap', (e) => {
  const { signal } = e.detail
  const stopWhenAborted = () => (running = false)
  signal.addEventListener('abort', stopWhenAborted)

  let running = true
  const loop = () => {
    if (!running) return
    // ...do some animation work...
    requestAnimationFrame(loop)
  }
  loop()
})
```

## Common patterns

### Load more

Turn a "load more" link into an infinite-scroll-like list by appending the
new region into the existing one and replacing the link itself with the next
page's link:

```html
<div id="posts" data-ajax-merge="append">
  <article>1. Lorem Ipsum</article>
  <article>2. Lorem Ipsum</article>
</div>

<a
  id="load-more"
  href="/posts?page=2"
  data-ajax-history="none"
  data-ajax-regions="#posts, #load-more"
>
  More
</a>
```

Since `#load-more` is one of the swapped regions, the response's `#load-more`
link (pointing to page 3) replaces this one, so clicking it again keeps
loading further pages.

### Loading content into a dialog

Regions aren't limited to the elements currently visible on the page. You can
target a hidden `<dialog>` and only swap its content, leaving the rest of the
page untouched:

```html
<dialog id="preview"></dialog>

<a href="/posts/1" data-ajax-regions="#preview" data-ajax-history="none">
  Preview
</a>
```

The response for `/posts/1` provides its own `#preview` region and opens
itself via an inline script, since `executeScripts` re-runs `<script>` tags
found in the swapped content:

```html
<dialog id="preview">
  <h2>Post 1</h2>
  <script>
    document.getElementById('preview').showModal()
  </script>
</dialog>
```

### Permanent elements

Mark an element with `data-ajax-permanent` (and give it a stable `id`) to
keep it alive across visits instead of replacing it, e.g. a currently
playing `<audio>`/`<video>` element or anything else with state that
shouldn't be reset:

```html
<div id="player" data-ajax-permanent>
  <audio src="/song.mp3" controls></audio>
</div>
```

As long as an element with the same `id` exists in both the old and the new
document, it's kept instead of being replaced.

> With the default `replace`/`update` merge strategies the permanent element
> is still moved to wherever it appears in the new content, which can cause a
> visible flash for things like playing animations. Use `merge: 'morph'`
> instead (globally or via `data-ajax-merge`) so the element is truly left
> untouched in place.
