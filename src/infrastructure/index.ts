/** Barrel export for the infrastructure layer's port implementations. */

export { createMathRandom } from './random/MathRandomAdapter'
export { createSeededRandom } from './random/SeededRandomAdapter'

export {
  SAVE_KEY_PREFIX,
  SAVE_VERSION,
  createLocalStorageGameRepository,
} from './persistence/LocalStorageGameRepository'
export {
  STATS_KEY,
  STATS_HISTORY_CAP,
  createLocalStorageStatsRepository,
} from './persistence/LocalStorageStatsRepository'
export { createMemoryStorage } from './persistence/memoryStorage'

export { createWebAudioAdapter, SFX_NAMES } from './audio/WebAudioAdapter'
export { createSilentAudioAdapter } from './audio/SilentAudioAdapter'
export type { SilentAudioAdapter, SilentAudioAdapterCalls } from './audio/SilentAudioAdapter'
export {
  TITLE_TRACK,
  BOARD_TRACK,
  RESULTS_TRACK,
  noteToFrequency,
  transpose,
  chord,
} from './audio/theory'
export type { Track, Voice, VoiceRole, Waveform, NoteEvent, ChordQuality } from './audio/theory'
