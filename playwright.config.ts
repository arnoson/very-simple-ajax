import type { PlaywrightTestConfig } from '@playwright/test'
import { devices } from '@playwright/test'

const config: PlaywrightTestConfig = {
  testDir: './test',
  webServer: { command: 'vite', port: 5173 },
  use: { ...devices['Desktop Chrome'] },
  timeout: 5 * 1000,
}

export default config
