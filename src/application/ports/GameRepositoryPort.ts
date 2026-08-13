import type { GameState } from '@domain/model/types'

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
