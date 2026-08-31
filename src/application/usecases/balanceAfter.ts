import type { LandingEvent, Player, PlayerId } from '@domain/model/types'

/**
 * Stamps `LandingEvent.balanceAfter` from the state the effect actually left
 * behind — see the field's own doc comment for why a card carries it at all.
 *
 * There are exactly two doors a finished card can come out of: a landing
 * (`applyEffect`) and an answered decision (`resolved` in `choose.ts`, which
 * a tile swept past mid-move reaches through `resolveSpinOutcome` as well).
 * Each calls this once, on its way out, so no individual handler ever has to
 * remember to — the alternative is thirty-odd effect branches each composing
 * their own "Now $X" line, which is both thirty chances to forget and thirty
 * chances to print a number that disagrees with the wallet the player can see
 * on the strip behind the card.
 *
 * Reading the balance from the post-effect player is what makes it safe: it
 * is the wallet, not a sum of the wallet and the plate, so an auto-loan that
 * clamps a debit reports where the money truly landed rather than where
 * subtraction says it should have.
 */
export function withBalanceAfter(
  event: LandingEvent,
  /** The roster *after* the effect, not the one it started from. */
  players: readonly Player[],
  playerId: PlayerId,
): LandingEvent {
  // Nothing moved, so there is no "and now you have" to report — a graduation
  // or a career change would otherwise print an unchanged balance as if the
  // tile had been about money all along.
  if (event.moneyDelta === 0) return event

  const player = players.find((candidate) => candidate.id === playerId)
  // `exactOptionalPropertyTypes`: leave the key absent rather than assigning
  // an explicit `undefined`. A player who is somehow not in the post-effect
  // state is a bug elsewhere, and a card with no balance line beats one
  // confidently reporting a balance of nothing.
  if (!player) return event

  return { ...event, balanceAfter: player.money }
}
