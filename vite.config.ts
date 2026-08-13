/// <reference types="vitest/config" />
import { readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const resolve = (path: string) => fileURLToPath(new URL(path, import.meta.url))

/**
 * The on-screen build version is read straight from `package.json` at build
 * time rather than hand-copied into a component — a version that can drift
 * from the package that produced it is worse than showing none at all.
 */
const { version: appVersion } = JSON.parse(readFileSync(resolve('./package.json'), 'utf-8')) as {
  version: string
}

// https://vite.dev/config/
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@domain': resolve('./src/domain'),
      '@application': resolve('./src/application'),
      '@infrastructure': resolve('./src/infrastructure'),
      '@presentation': resolve('./src/presentation'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    /**
     * The board is an 86-space SVG of roughly 7,000 nodes, and mounting the
     * whole app in jsdom costs a second or two — jsdom only, and only in
     * development mode: the production build mounts the same board in ~200 ms.
     * Vitest's 5 s default left too thin a margin for that under any load.
     * Headroom for a slow environment, not for slow logic — the domain and
     * application suites still finish in milliseconds.
     */
    testTimeout: 20_000,
    /**
     * Vitest defaults to roughly one worker per core. Each worker is a separate
     * process holding its own jsdom, and the presentation suites are the
     * memory-hungry ones, so the default width costs well over a gigabyte. Half
     * the cores keeps the suite comfortable on a machine someone is actually
     * working on, at a modest cost in wall clock.
     */
    maxWorkers: 4,
    coverage: {
      include: ['src/domain/**', 'src/application/**', 'src/infrastructure/**'],
    },
  },
})
