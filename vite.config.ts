import { defineConfig } from 'vitest/config'

export default defineConfig({
  root: 'dev',
  test: { environment: 'jsdom' },
})
