import type { Difficulty, EditionId, LandingEvent, Player, PlayerId } from '@domain/model/types'
import { rankPlayers } from '@domain/rules/standing'

/**
 * Stamps `LandingEvent.rankBefore`/`rankAfter` from the same two rosters
 * `withBalanceAfter` reads — the one the effect started from and the one it
 * left behind. See the fields' own doc comment for why a card carries them
 * at all.
 *
 * Called from the same two doors `withBalanceAfter` is: a landing
 * (`applyEffect`) and an answered decision (`resolved` in `choose.ts`). Both
 * already have both rosters in hand for their own reasons, so this asks
 * nothing new of either — only one more read of a ranking function that was
 * already being run for the player strip behind the card.
 */
export function withStandingChange(
  event: LandingEvent,
  /** The roster the effect started from. */
  playersBefore: readonly Player[],
  /** The roster the effect left behind. */
  playersAfter: readonly Player[],
  playerId: PlayerId,
  difficulty: Difficulty,
  editionId: EditionId,
): LandingEvent {
  const rankBefore = rankPlayers(playersBefore, difficulty, editionId).get(playerId)?.rank
  const rankAfter = rankPlayers(playersAfter, difficulty, editionId).get(playerId)?.rank

  // Nothing to report when either side could not be read, or the standing
  // never moved — the common case, since most landings are not close to the
  // next or previous rung. Left absent rather than a repeated number, the
  // same way `balanceAfter` stays absent on a moneyless landing.
  if (rankBefore === undefined || rankAfter === undefined || rankBefore === rankAfter) return event

  return { ...event, rankBefore, rankAfter }
}
