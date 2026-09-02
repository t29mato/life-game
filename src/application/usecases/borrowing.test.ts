import { describe, expect, it } from 'vitest'
import type { LandingEvent } from '@domain/model/types'
import { USA_ECONOMY } from '@domain/edition/usa/economy'
import { EDITION_USA } from '@domain/edition/usa'
import { loanRepaymentFor } from '@domain/rules/difficulty'
import { fixturePlayer } from '../testing/fixtures'
import { withBorrowing } from './borrowing'

const PRINCIPAL = USA_ECONOMY.loanPrincipal
const SETTLEMENT = loanRepaymentFor('normal', EDITION_USA)

function event(overrides: Partial<LandingEvent> = {}): LandingEvent {
  return {
    spaceId: 'a',
    title: 'Tuition Bill',
    description: 'The bursar wants paying.',
    icon: 'space:tuition-bill',
    tone: 'blue',
    moneyDelta: 0,
    lifeTilesGained: [],
    notes: [],
    ...overrides,
  }
}

describe('withBorrowing', () => {
  it('leaves a card alone when the player paid out of their own pocket', () => {
    const before = fixturePlayer({ money: 100_000 })
    const after = fixturePlayer({ money: 48_000 })
    const stamped = withBorrowing(event({ moneyDelta: -52_000 }), [before], [after], 'p1', 'normal', 'usa')

    expect(stamped.borrowing).toBeUndefined()
  })

  it('leaves a card alone when a loan was repaid rather than taken', () => {
    const before = fixturePlayer({ money: 60_000, loans: 2 })
    const after = fixturePlayer({ money: 25_000, loans: 1 })
    const stamped = withBorrowing(event({ moneyDelta: -35_000 }), [before], [after], 'p1', 'normal', 'usa')

    expect(stamped.borrowing).toBeUndefined()
  })

  /*
   * The B1 case, in the numbers the playtest actually reported: $10,000 in
   * the wallet, a $52,000 tuition bill, one automatic $60,000 loan, and a
   * wallet that ends the card *up* $8,000. The card used to render that
   * $8,000 in a green band, which reads as having profited from tuition.
   */
  it('separates the bill from the loan that covered it', () => {
    const before = fixturePlayer({ money: 10_000, loans: 0 })
    const after = fixturePlayer({ money: 18_000, loans: 1 })
    const stamped = withBorrowing(event({ moneyDelta: 8_000 }), [before], [after], 'p1', 'normal', 'usa')

    expect(stamped.borrowing).toEqual({
      loans: 1,
      borrowed: PRINCIPAL,
      dueAtRetirement: SETTLEMENT,
      charge: PRINCIPAL - 8_000,
    })
    // The delta itself is untouched: the wallet really did go up, and the
    // card still has to be able to say so.
    expect(stamped.moneyDelta).toBe(8_000)
  })

  it('adds up several loans forced by one bill', () => {
    const before = fixturePlayer({ money: 0, loans: 0 })
    const after = fixturePlayer({ money: 10_000, loans: 3 })
    const stamped = withBorrowing(event({ moneyDelta: 10_000 }), [before], [after], 'p1', 'normal', 'usa')

    expect(stamped.borrowing?.loans).toBe(3)
    expect(stamped.borrowing?.borrowed).toBe(3 * PRINCIPAL)
    expect(stamped.borrowing?.dueAtRetirement).toBe(3 * SETTLEMENT)
    expect(stamped.borrowing?.charge).toBe(3 * PRINCIPAL - 10_000)
  })

  it('charges nothing for a loan nobody billed for', () => {
    const before = fixturePlayer({ money: 5_000, loans: 0 })
    const after = fixturePlayer({ money: 5_000 + PRINCIPAL, loans: 1 })
    const stamped = withBorrowing(event({ moneyDelta: PRINCIPAL }), [before], [after], 'p1', 'normal', 'usa')

    expect(stamped.borrowing?.charge).toBe(0)
  })

  it('settles at the rate the difficulty charges, not the standard one', () => {
    const before = fixturePlayer({ money: 0, loans: 0 })
    const after = fixturePlayer({ money: 8_000, loans: 1 })
    const hard = withBorrowing(event({ moneyDelta: 8_000 }), [before], [after], 'p1', 'veryHard', 'usa')

    expect(hard.borrowing?.dueAtRetirement).toBe(loanRepaymentFor('veryHard', EDITION_USA))
    expect(hard.borrowing?.dueAtRetirement).toBeGreaterThan(SETTLEMENT)
  })

  it('borrows in the edition it is playing, not in dollars', () => {
    const before = fixturePlayer({ money: 0, loans: 0 })
    const after = fixturePlayer({ money: 100_000, loans: 1 })
    const stamped = withBorrowing(event({ moneyDelta: 100_000 }), [before], [after], 'p1', 'normal', 'japan')

    expect(stamped.borrowing?.borrowed).not.toBe(PRINCIPAL)
  })
})
