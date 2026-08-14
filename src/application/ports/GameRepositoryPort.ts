import type { EditionId, GameState } from '@domain/model/types'

export interface GameSnapshot {
  /** Bumped whenever the persisted shape changes; older snapshots are dropped. */
  readonly version: number
  readonly savedAt: string
  readonly state: GameState
}

/** What the title screen shows for one slot without loading the whole game. */
export interface SaveSlotInfo {
  readonly slot: number
  readonly occupied: boolean
  /** ISO timestamp, or null when the slot is empty. */
  readonly savedAt: string | null
  /** Player names, in seat order. Empty when the slot is empty. */
  readonly playerNames: readonly string[]
  /** Turn the save was taken on, or null when the slot is empty. */
  readonly turn: number | null
  /**
   * Which country the save was played on, or null when the slot is empty.
   *
   * Four slots and five editions means the slot list is the only place a player
   * can tell a half-finished Japan game from a half-finished France one — the
   * names and the turn number look identical. A save written before editions
   * existed carries no id and reads back as `null`, which the UI shows as
   * nothing at all rather than guessing a flag.
   */
  readonly editionId: EditionId | null
}

/** Slots the UI offers. Slot 0 is reserved for the rolling autosave. */
export const SAVE_SLOT_COUNT = 4
export const AUTOSAVE_SLOT = 0

export interface GameRepositoryPort {
  save(slot: number, state: GameState): void
  /** Returns null when the slot is empty, or when the stored data is unusable. */
  load(slot: number): GameState | null
  clear(slot: number): void
  has(slot: number): boolean
  /** Exactly `SAVE_SLOT_COUNT` entries, in slot order, cheap enough to poll. */
  list(): readonly SaveSlotInfo[]
}
