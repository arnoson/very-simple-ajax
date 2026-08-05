interface Element {
  /**
   * Experimental Chrome API for element-scoped view transitions.
   * Not yet part of the stable View Transitions API spec.
   */
  startViewTransition?(callback?: () => void | Promise<void>): ViewTransition
}
