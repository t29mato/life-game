import type { Borrowing, Difficulty, EditionId, LandingEvent, Player, PlayerId } from '@domain/model/types'
import { editionFor } from '@domain/edition/registry'
import { loanRepaymentFor } from '@domain/rules/difficulty'

/**
 * Stamps `LandingEvent.borrowing` from the same two rosters
 * `withBalanceAfter` and `withStandingChange` read. See `Borrowing` itself
 * for why a card carries it at all.
 *
 * Every handler that could force a borrow used to push a sentence into
 * `notes` instead — seven of them, each remembering to compare the loan
 * counts itself and each free to forget. Worse, a note is prose: the card
 * could say "Took out 1 loan — $60,000 borrowed" underneath a green band
 * reading "+$8,000", and the band is what a player reads. Reporting it here,
 * once, off the rosters, makes the borrow a structured fact the plate itself
 * can be built from rather than a footnote arguing with the headline.
 *
 * The charge is derived rather than reported: `borrowed - moneyDelta` is
 * what the tile actually took, because the wallet's own movement is the
 * bill and the loan added together. Derived from the ledger, not from
 * whatever number the handler thought it was charging — the same reasoning
 * `balanceAfter` is read off the post-effect player for. A player who walks
 * into the bank and simply takes a loan is charged nothing, and lands on
 * zero here, which is exactly what the card should then show: one beat.
 */
export function withBorrowing(
  event: LandingEvent,
  /** The roster the effect started from. */
  playersBefore: readonly Player[],
  /** The roster the effect left behind. */
  playersAfter: readonly Player[],
  playerId: PlayerId,
  difficulty: Difficulty,
  editionId: EditionId,
): LandingEvent {
  const before = playersBefore.find((candidate) => candidate.id === playerId)
  const after = playersAfter.find((candidate) => candidate.id === playerId)
  if (!before || !after) return event

  const loans = after.loans - before.loans
  // Repaying a loan is not borrowing, and neither is standing still. Left
  // absent rather than reported as zero loans, the same way `balanceAfter`
  // stays absent on a moneyless landing.
  if (loans <= 0) return event

  const edition = editionFor(editionId)
  const borrowed = loans * edition.economy.loanPrincipal
  const dueAtRetirement = loans * loanRepaymentFor(difficulty, edition)

  const borrowing: Borrowing = {
    loans,
    borrowed,
    dueAtRetirement,
    charge: Math.max(0, borrowed - event.moneyDelta),
  }
  return { ...event, borrowing }
}
