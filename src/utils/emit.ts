export const emit = (event: string, detail: any) => {
  document.dispatchEvent(
    new CustomEvent(`very-simple-links:${event}`, { detail })
  )
}
