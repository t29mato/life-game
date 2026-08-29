import type { SpaceId } from '../model/types'

export type MovementStopReason =
  /** The player used up every step. */
  | 'stepsExhausted'
  /** The pawn reached a fork with steps still owed; a branch choice is needed. */
  | 'fork'
  /** The pawn entered a `stop` space; leftover steps are forfeited. */
  | 'forcedStop'
  /** The pawn reached the retirement space. */
  | 'terminal'

export interface MovementPlan {
  /**
   * Spaces travelled through, excluding the origin and ending on the space the
   * pawn comes to rest on. Empty when the pawn does not move at all (which
   * happens when it starts on a fork and must choose before stepping).
   */
  readonly path: readonly SpaceId[]
  /** Where the pawn ends up. Equals the origin when `path` is empty. */
  readonly destinationId: SpaceId
  /** Steps still owed. Always 0 unless `stoppedBy === 'fork'`. */
  readonly stepsRemaining: number
  readonly stoppedBy: MovementStopReason
  /**
   * Payday spaces passed *through*. Excludes the destination, whose own effect
   * pays out, so that landing on a payday never pays twice.
   */
  readonly paydaysPassed: number
  /**
   * `event`-kind spaces passed *through*, in the order they were crossed.
   * Excludes the destination, whose own effect resolves through the ordinary
   * landing path — same rule as `paydaysPassed`, so a milestone never fires
   * twice for a roll that happens to end exactly on it.
   */
  readonly eventsPassed: readonly SpaceId[]
}
