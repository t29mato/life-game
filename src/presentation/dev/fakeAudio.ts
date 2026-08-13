import type { AudioPort, BgmTrack, SfxName } from '@application/ports/AudioPort'

export interface FakeAudioPort extends AudioPort {
  readonly unlocked: boolean
  readonly bgmLog: BgmTrack[]
  readonly sfxLog: SfxName[]
}

/**
 * A silent, in-memory `AudioPort` for tests and local development. Records
 * everything it was asked to do so behavioural tests can assert on it.
 */
export function createFakeAudioPort(): FakeAudioPort {
  let unlocked = false
  let musicEnabled = true
  let sfxEnabled = true
  const bgmLog: BgmTrack[] = []
  const sfxLog: SfxName[] = []

  return {
    get unlocked() {
      return unlocked
    },
    bgmLog,
    sfxLog,
    async unlock() {
      unlocked = true
    },
    playBgm(track) {
      bgmLog.push(track)
    },
    stopBgm() {
      // no-op for the fake
    },
    playSfx(name) {
      sfxLog.push(name)
    },
    setMusicEnabled(enabled) {
      musicEnabled = enabled
    },
    setSfxEnabled(enabled) {
      sfxEnabled = enabled
    },
    isMusicEnabled() {
      return musicEnabled
    },
    isSfxEnabled() {
      return sfxEnabled
    },
  }
}
