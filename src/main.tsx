import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Analytics } from '@vercel/analytics/react'

import { createGameStore } from '@application/createGameStore'
import { createWebAudioAdapter } from '@infrastructure/audio/WebAudioAdapter'
import { createLocalStorageGameRepository } from '@infrastructure/persistence/LocalStorageGameRepository'
import { createLocalStoragePlayerProfileRepository } from '@infrastructure/persistence/LocalStoragePlayerProfileRepository'
import { createLocalStorageStatsRepository } from '@infrastructure/persistence/LocalStorageStatsRepository'
import { createMathRandom } from '@infrastructure/random/MathRandomAdapter'
import { App } from '@presentation/App'

import './index.css'

/**
 * Composition root — the only module in the project that knows all four layers
 * exist. Everything below this line receives its collaborators by injection,
 * which is what lets the domain and application layers be tested without a DOM.
 */
const store = createGameStore({
  random: createMathRandom(),
  repository: createLocalStorageGameRepository(),
  stats: createLocalStorageStatsRepository(),
})

const audio = createWebAudioAdapter()

// The remembered regulars live beside the app rather than inside the store:
// no game rule ever reads them, so they stay a shell concern, injected the
// same way the audio adapter is.
const profiles = createLocalStoragePlayerProfileRepository()

const container = document.getElementById('root')
if (!container) {
  throw new Error('Root container #root is missing from index.html')
}

createRoot(container).render(
  <StrictMode>
    <App store={store} audio={audio} profiles={profiles} />
    {/* Loads /_vercel/insights/script.js, which only exists on a Vercel
        deployment — on GitHub Pages (or any other host) the request 404s and
        the library logs one console line and does nothing further. No env
        check needed to keep this Vercel-only. */}
    <Analytics />
  </StrictMode>,
)
