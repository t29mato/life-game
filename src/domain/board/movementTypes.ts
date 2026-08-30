import type { PassedQueueItem, SpaceId } from '../model/types'

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
   * Every payday and `event`-kind space passed *through*, in the order the
   * road actually crossed them. Excludes the destination, whose own effect
   * resolves through the ordinary landing path, so neither a payday nor a
   * milestone ever fires twice for a roll that ends exactly on it.
   *
   * One list rather than a pair of them, and the order is the load-bearing
   * part. These used to be two arrays — every payday, then every event — and
   * the concatenation quietly reordered a move that swept an event tile
   * *before* a payday. Nothing noticed while the whole hop animated in one go
   * and the cards were dealt afterwards; the moment the pawn started stopping
   * on each of these tiles in turn (see `nextMovementLeg`), a queue in the
   * wrong order was a pawn hopping backwards.
   *
   * Tracked by id rather than as a count because each has its own name
   * (`Signing Bonus`, `Spot Bonus`, ...) and the card names the tile it
   * happened on, exactly as a landing does.
   */
  readonly passed: readonly PassedQueueItem[]
}
