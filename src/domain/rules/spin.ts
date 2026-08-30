import type { Decision, GamePhase } from '../model/types'

/**
 * Where a spin the player is being asked to press comes from.
 *
 * `movement` is the ordinary roll-to-move — no `Decision` exists yet, only
 * `phase: 'awaitingSpin'` (or `awaitingDistanceSpin`, a fork's second press),
 * and the number decides where the pawn goes next.
 * `event` is everything else the die ever decides (tuition, a promotion
 * review, a marriage proposal, career choice, the joint account…) — always
 * a `kind: 'valueSpin'` decision, raised by `applyEffect` once the pawn has
 * already landed somewhere. The tile position is meaningless to an event
 * roll; it is not meaningless to a movement roll, which is the whole reason
 * the two are shown differently — a movement roll belongs over the board it
 * is about to move a pawn across, an event roll does not.
 */
export type SpinOrigin = 'movement' | 'event'

/**
 * `null` when nothing is currently asking for a spin at all — the caller
 * has to decide separately whether that matters to it.
 */
export function spinOriginOf(phase: GamePhase, pendingDecision: Decision | null): SpinOrigin | null {
  if (phase === 'awaitingSpin' || phase === 'awaitingDistanceSpin') return 'movement'
  if (phase === 'awaitingDecision' && pendingDecision?.kind === 'valueSpin') return 'event'
  return null
}
