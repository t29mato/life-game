import type { AudioPort, BgmTrack, SfxName } from '@application/ports/AudioPort'

export interface SilentAudioAdapterCalls {
  unlock: number
  readonly playBgm: BgmTrack[]
  stopBgm: number
  readonly playSfx: SfxName[]
}

/** A no-op `AudioPort` that records what it was asked to do, for tests and muted/reduced-motion contexts. */
export interface SilentAudioAdapter extends AudioPort {
  readonly calls: SilentAudioAdapterCalls
}

export function createSilentAudioAdapter(): SilentAudioAdapter {
  const calls: SilentAudioAdapterCalls = {
    unlock: 0,
    playBgm: [],
    stopBgm: 0,
    playSfx: [],
  }

  let musicEnabled = true
  let sfxEnabled = true

  return {
    calls,
    async unlock() {
      calls.unlock += 1
    },
    playBgm(track: BgmTrack, _editionId?: string) {
      calls.playBgm.push(track)
    },
    stopBgm() {
      calls.stopBgm += 1
    },
    playSfx(name: SfxName) {
      calls.playSfx.push(name)
    },
    setMusicEnabled(enabled: boolean) {
      musicEnabled = enabled
    },
    setSfxEnabled(enabled: boolean) {
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
