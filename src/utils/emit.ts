export const emit = (event: 'before-visit' | 'visit', detail: any) => {
  document.dispatchEvent(
    new CustomEvent(`very-simple-links:${event}`, { detail })
  )
}
