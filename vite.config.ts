/// <reference types="vitest/config" />
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const resolve = (path: string) => fileURLToPath(new URL(path, import.meta.url))

const { version: packageVersion } = JSON.parse(readFileSync(resolve('./package.json'), 'utf-8')) as {
  version: string
}

/** The exact commit this bundle was built from, or null when git cannot say. */
function gitDescribe(): string | null {
  try {
    return execFileSync('git', ['describe', '--tags', '--always', '--dirty'], {
      cwd: resolve('.'),
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
  } catch {
    return null
  }
}

/**
 * The version on screen names the *commit* that produced the bundle, not a
 * number somebody remembered to bump — `1.0.0` tells you nothing about which
 * build you are looking at when three deploys share it.
 *
 * Resolved in three steps, because the build does not always run where the
 * repository is. `vercel --prod` uploads the source and builds it remotely,
 * on a machine with no `.git` at all, so a naive `git describe` at build time
 * would either fail there or silently print a stale fallback forever. The
 * deploy therefore passes the locally-resolved value in `APP_VERSION`
 * (see `npm run deploy`), git is used when building from a working tree, and
 * the package version is the last resort so a bundle is never unlabelled.
 */
const appBuild = process.env.APP_VERSION ?? gitDescribe() ?? `v${packageVersion}`

// https://vite.dev/config/
export default defineConfig({
  define: {
    // The release the notes are written about…
    __APP_VERSION__: JSON.stringify(packageVersion),
    // …and the exact build on screen, which may sit several commits past it.
    __APP_BUILD__: JSON.stringify(appBuild),
  },
  plugins: [
    react(),
    /**
     * `registerType: 'prompt'` on purpose — the whole point the owner asked
     * for this was to *stop* a tab silently running stale, precached code
     * forever. `autoUpdate` would activate a new service worker (and its
     * newly revisioned precache) the instant one finished downloading, with
     * nothing on screen to say so; `prompt` instead leaves the new worker
     * waiting until `UpdateBanner` (`virtual:pwa-register/react`) asks a
     * real person to click something first.
     *
     * `base` (the GitHub Pages subpath, passed with `--base=/<repo>/` on
     * the command line rather than set here — see deploy-pages.yml) is read
     * from Vite's own resolved config, not repeated here: the manifest's
     * `start_url`/`scope`, every icon `src`, and the service worker's own
     * registration path all end up correctly rooted at that subpath (or at
     * `/`, for the Vercel deploy, which never passes `--base`) without this
     * file needing to know which one it is being built for.
     */
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'icons.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'LIFE JOURNEY',
        short_name: 'Life Journey',
        description:
          'Roll the die, pick a career, and build a life worth bragging about in this offline board game for one to four players.',
        theme_color: '#f4e5c8',
        background_color: '#f4e5c8',
        display: 'standalone',
        icons: [
          { src: 'icons/app-icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/app-icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icons/app-icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: 'icons/app-icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Every build's asset filenames are already content-hashed by Vite,
        // so precaching everything the build actually produced is what
        // makes each service worker's own precache list — and so its own
        // generated `sw.js`, byte for byte — unique to that build. A tab
        // running an older one notices the mismatch on its own; no separate
        // version number needs to be threaded through here to make that true.
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        cleanupOutdatedCaches: true,
        navigateFallback: 'index.html',
      },
    }),
  ],
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
