import type { DriverFace, PlayerColor } from '@domain/model/types'

/**
 * One remembered person: the name they play under and the design they last
 * played it in, so the next evening starts with one tap instead of four.
 */
export interface PlayerProfile {
  readonly name: string
  readonly color: PlayerColor
  readonly face: DriverFace
  /** ISO timestamp of the last game started under this name. Stamped by the
   *  adapter — the pure layers have no clock. */
  readonly lastUsedAt: string
}

/**
 * The same four people play most tables, and a device only has so much
 * storage to remember strangers with: enough for three full tables of
 * regulars, with the least-recently-seen guest evicted once it is full.
 */
export const PROFILE_LIST_CAP = 12

/**
 * The remembered regulars: every human who has started a game from this
 * device, most recent first, so a returning player finds themself at the
 * front of the list.
 *
 * A profile is keyed by name, case-insensitively — "Alex" and "alex" are the
 * same person typing with different care, not two people to remember twice.
 */
export interface PlayerProfileRepositoryPort {
  /** Most recently used first. */
  list(): readonly PlayerProfile[]
  /** The adapter supplies `lastUsedAt`, and evicts the least-recently-used
   *  profile once the list would exceed `PROFILE_LIST_CAP`. */
  upsert(profile: Omit<PlayerProfile, 'lastUsedAt'>): void
  clear(): void
}
