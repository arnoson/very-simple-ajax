# 🔗 Very Simple Links

A very simple turbolinks inspired library based on [Idiomorph](https://github.com/bigskysoftware/idiomorph).
You can use it for progressive enhancements and to give your multi-page websites a SPA-like feel.

💾 only ~3kb (minify and gzip)

## Installation

```
npm install @very-simple/links
```

## Usage

Intercept link clicks and let very simple links take care of fetching the new
page, merging its `<head>` and swapping in its `<body>`.

```js
// shared.js
import links from '@very-simple/links'

const initPage = () =>
  document.querySelectorAll('a').forEach((el) => {
    if ($el.init) return
    el.addEventListener('click', async (event) => {
      event.preventDefault()
      links.visit(el.getAttribute('href'))
    })
    el.$init = true
  })

links.on('visit', initPage)
links.start()
initPage()
```

```html
<!-- page-a.html -->
<html>
  <head>
    <!-- Shared scripts in the `<head>` get only executed once. -->
    <script src="./shared.js" type="module" defer></script>
    <title>Page A</title>
  </head>
  <body>
    Content A
    <a href="page-b.html">Go to Page B</a>
  </body>
</html>
```

```html
<!-- page-b.html -->
<html>
  <head>
    <script src="./shared.js" type="module" defer></script>
    <title>Page B</title>
  </head>
  <body>
    Content B
    <a href="page-b.html">Go to Page A</a>
  </body>
</html>
```

Checkout the `/examples` folder for more examples.

## Documentation

### Start

```js
links.start()

// In some rare cases you might not want to watch popstate navigation. You can
// disable it by calling `links.start({ watchHistory: false })`.
```

### Visit

```ts
links.visit('some/url/', options?)
```

```ts
interface VisitOptions {
  // Which `window.history` action should be performed, default is 'push'.
  action?: 'push' | 'replace' | 'none'

  // Wether or not to load the page from cache. Default is false (this will
  // still use a cached version for popstate events to simulate the default
  // browser behavior).
  useCache?: boolean

  // Only needed in rare cases. Provide a custom id under which the current page
  // will be cached before visiting the new URL.
  cacheId?: string
}
```

## Custom Container

By default the body is swapped, but you can specify a custom container instead.
This is useful for partial page refreshes.

```html
<meta name="simple-container" content="#my-container" />
```

## Permanent Elements

If two pages contain the same element, it can be useful to keep the element
alive instead of replacing it. For example, a video or an animated header that
shouldn't be reset between page visits. Very Simple Links uses [Idiomorph](https://github.com/bigskysoftware/idiomorph),
so elements with the same id will be kept alive instead if being replaced.

```html
<video id="my-permanent-video" src="video.mp4"></video>
```

## Progress Bar

Very Simple Links doesn't render a progress bar but provides you with everything
to easily implement your own.

Note: you have to include the progress bar element in every page.

```html
<head>
  <link
    rel="stylesheet"
    href="node_modules/very-simple/links/dist/progress.css"
  />
</head>
<body>
  <!-- Make the progressbar permanent so the css transitions work even when
  the new content is swapped in. -->
  <div id="progress"></div>
</body>
```

```css
#progress {
  position: fixed;
  top: 0;
  left: 0;
  /* The progress is available as a CSS variable (in %) */
  width: var(--simple-progress);
  height: 3px;
  opacity: 0;
  background-color: blue;
  /* Animate the progress and make sure the animation can finish by delaying
  the opacity */
  transition: width 300ms ease-out, opacity 300ms steps(1);
}

/* A data attribute is added to the document root to indicate loading */
:root[data-simple-loading] #progress {
  opacity: 1;
}
```

## Together with Very Simple Router

Using Very Simple Links together with Very Simple Router opens up a lot of
possibilities. You can use multiple html files that can each have their own
virtual routes.

```js
import links from '@very-simple/links'
import router from '@very-simple/router'
import { useRouter } from '@very-simple/links/useRouter'

// Connect links and router.
useRouter(links, router)
router.start()
// Make sure to disable watch history, as the router already does this!
links.start({ watchHistory: false })
```
