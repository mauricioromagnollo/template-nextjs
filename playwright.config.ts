import { defineConfig, devices } from '@playwright/test'

const PORT = Number(process.env.PORT ?? 3000)
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${PORT}`

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // Build once and serve the production output, unless a base URL (a deploy
  // preview, for instance) is provided externally. On CI the workflow already
  // built the app in an earlier step, so only the server is started here.
  //
  // `reuseExistingServer` locally is a speed/safety trade-off worth knowing
  // about: Playwright will adopt WHATEVER already answers on the port instead of
  // building, so another project left running on 3000 makes this suite test a
  // different app and fail in ways that look like real bugs. Set it to `false`
  // if you would rather Playwright fail loudly on a busy port.
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: process.env.CI ? 'npm run start' : 'npm run build && npm run start',
        url: baseURL,
        timeout: 180_000,
        reuseExistingServer: !process.env.CI,
      },
})
