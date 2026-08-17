import { defineConfig, devices } from '@playwright/test'

/**
 * Real-browser regression coverage for layout bugs jsdom cannot see at all —
 * jsdom never runs a layout engine, so a board that visually overflows its
 * grid cell and overlaps the wheel and player panels passes every existing
 * component test while looking broken on an actual phone. This is what
 * caught v1.3.0's mobile regression in the first place; keep it running.
 *
 * `webServer` starts the Vite dev server itself, so `npx playwright test`
 * (or `npm run test:e2e`) works standalone — CI does not need a separate
 * build step first.
 */
export default defineConfig({
  testDir: './e2e',
  // Every project boots its own real Chromium against the same dev server;
  // capped rather than left at the CPU-count default so a machine already
  // under load (a laptop mid-build, a shared CI runner) does not turn a
  // passing layout assertion into a flaky timeout purely from contention.
  workers: 2,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  timeout: 45_000,
  reporter: process.env.CI ? [['github'], ['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev -- --port 5173 --strictPort',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
  // `devices['iPhone ...']` defaults to WebKit (it's modelling real Safari),
  // but this suite is checking CSS layout math, not a browser engine — pinned
  // to chromium on every project so only one browser ever needs installing,
  // in CI or locally.
  projects: [
    { name: 'iphone-se', use: { ...devices['iPhone SE'], defaultBrowserType: 'chromium' } },
    { name: 'iphone-12', use: { ...devices['iPhone 12'], defaultBrowserType: 'chromium' } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } } },
  ],
})
