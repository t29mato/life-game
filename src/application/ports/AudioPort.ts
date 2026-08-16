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
  /**
   * `editionId` only changes anything for the `'board'` track — the title and
   * results tracks are shared across every edition. An id with no
   * edition-specific arrangement (USA, or any id an adapter does not
   * recognise) falls back to the default board track, so passing it is
   * always safe.
   */
  playBgm(track: BgmTrack, editionId?: string): void
  stopBgm(): void
  playSfx(name: SfxName): void
  setMusicEnabled(enabled: boolean): void
  setSfxEnabled(enabled: boolean): void
  isMusicEnabled(): boolean
  isSfxEnabled(): boolean
}
