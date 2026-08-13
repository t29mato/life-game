import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { createGameStore } from '@application/createGameStore'
import { createWebAudioAdapter } from '@infrastructure/audio/WebAudioAdapter'
import { createLocalStorageGameRepository } from '@infrastructure/persistence/LocalStorageGameRepository'
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

const container = document.getElementById('root')
if (!container) {
  throw new Error('Root container #root is missing from index.html')
}

createRoot(container).render(
  <StrictMode>
    <App store={store} audio={audio} />
  </StrictMode>,
)
