# 🧩 Very Simple Ajax

A very simple turbolinks inspired library based on [Idiomorph](https://github.com/bigskysoftware/idiomorph).
You can use it for progressive enhancements and to give your multi-page websites a SPA-like feel.

💾 only ~3kb (minify and gzip)

## Installation

```
npm install @very-simple/ajax
```

## Usage

Intercept link clicks and let very simple ajax take care of fetching the new
page, merging its `<head>` and swapping in its `<body>`.

```js
// shared.js
import ajax from '@very-simple/ajax'

const initPage = () =>
  document.querySelectorAll('a').forEach((el) => {
    if ($el.init) return
    el.addEventListener('click', async (event) => {
      event.preventDefault()
      ajax.visit(el.getAttribute('href'))
    })
    el.$init = true
  })

ajax.on('visit', initPage)
ajax.start()
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
ajax.start()

// In some rare cases you might not want to watch popstate navigation. You can
// disable it by calling `ajax.start({ watchHistory: false })`.
```

### Visit

```ts
ajax.visit('some/url/', options?)
```

```ts
interface VisitOptions {
  // Which `window.history` action should be performed, default is 'push'.
  action?: 'push' | 'replace' | 'none'

  // The merge strategy to merge old and new content, default is 'replace'.
  merge?:
    | 'replace'
    | 'morph'
    | 'before'
    | 'after'
    | 'prepend'
    | 'append'
    | 'update'
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
shouldn't be reset between page visits. Very Simple Ajax uses [Idiomorph](https://github.com/bigskysoftware/idiomorph),
so elements with the same id will be kept alive instead if being replaced.

```html
<video id="my-permanent-video" src="video.mp4"></video>
```

## Progress Bar

Very Simple Ajax doesn't render a progress bar but provides you with everything
to easily implement your own.

Note: you have to include the progress bar element in every page.

```html
<head>
  <link
    rel="stylesheet"
    href="node_modules/very-simple/ajax/dist/progress.css"
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
