export type BgmTrack = 'title' | 'board' | 'results'

export type SfxName =
  | 'spin'
  | 'spinStop'
  | 'hop'
  | 'coinGain'
  | 'coinLose'
  | 'lifeTile'
  | 'milestone'
  | 'select'
  | 'confirm'
  | 'fanfare'
  | 'gameOver'
  /** The whoosh under an event cut-in. */
  | 'cutIn'
  /** Ticker blip when a share is bought or a dividend lands. */
  | 'stockTick'
  /** Rubber stamp: a policy signed, a loan repaid. */
  | 'stamp'
  /** The crowd reacting to an upset — someone just lost the lead. */
  | 'upset'
  /** Handing the device to the next player. */
  | 'handoff'

/**
 * Sound is a side effect, so the presentation layer talks to it through a port
 * and tests get a silent no-op implementation.
 */
export interface AudioPort {
  /** Browsers block audio until a gesture; call this from a click handler. */
  unlock(): Promise<void>
  playBgm(track: BgmTrack): void
  stopBgm(): void
  playSfx(name: SfxName): void
  setMusicEnabled(enabled: boolean): void
  setSfxEnabled(enabled: boolean): void
  isMusicEnabled(): boolean
  isSfxEnabled(): boolean
}
