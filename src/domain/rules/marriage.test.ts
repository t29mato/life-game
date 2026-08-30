import { describe, expect, it } from 'vitest'
import type { EconomyConstants, MarriageOutcome } from '../edition/types'
import { USA_ECONOMY } from '../edition/usa/economy'
import { expectedMarriageValue, marriageBandFor, marriageOutcomeValue } from './marriage'

const band = (upTo: number, over: Partial<MarriageOutcome> = {}): MarriageOutcome => ({
  upTo: upTo as MarriageOutcome['upTo'],
  note: `band up to ${upTo}`,
  giftMultiplier: 1,
  cost: 0,
  windfall: 0,
  ...over,
})

describe('marriageBandFor', () => {
  const bands = [band(2, { note: 'cheap' }), band(4, { note: 'middling' }), band(6, { note: 'grand' })]

  it('picks the first band the roll does not exceed', () => {
    expect(marriageBandFor(bands, 1).note).toBe('cheap')
    expect(marriageBandFor(bands, 2).note).toBe('cheap')
    expect(marriageBandFor(bands, 3).note).toBe('middling')
    expect(marriageBandFor(bands, 4).note).toBe('middling')
    expect(marriageBandFor(bands, 5).note).toBe('grand')
    expect(marriageBandFor(bands, 6).note).toBe('grand')
  })

  it('falls back to the last band for a table that does not reach the top face', () => {
    // An edition that forgets the top of the die gets its best band, rather
    // than a crash in the middle of somebody's wedding.
    const short = [band(3, { note: 'only one' })]
    expect(marriageBandFor(short, 6).note).toBe('only one')
  })
})

describe('marriageOutcomeValue', () => {
  it('counts a gift from every rival, plus the windfall, less the bill', () => {
    const outcome = band(10, { giftMultiplier: 1.5, cost: 20_000, windfall: 5_000 })
    expect(marriageOutcomeValue(outcome, USA_ECONOMY, 3)).toBe(
      USA_ECONOMY.weddingGift * 1.5 * 3 + 5_000 - 20_000,
    )
  })

  it('can come out negative, which is the whole point of the rework', () => {
    const outcome = band(10, { cost: 40_000 })
    expect(marriageOutcomeValue(outcome, USA_ECONOMY, 1)).toBeLessThan(0)
  })
})

describe('expectedMarriageValue', () => {
  /*
   * The one property the spread is built inside. Marriage has to stay worth
   * doing on average: a negative expectation means nobody marries, and children,
   * Family Lane and the whole family scoring lane hang off reaching that tile.
   */
  it('stays positive at every table size the game allows', () => {
    for (const rivals of [1, 2, 3]) {
      expect(expectedMarriageValue(USA_ECONOMY, rivals)).toBeGreaterThan(0)
    }
  })

  it('makes a fuller table a safer bet, because more envelopes change hands', () => {
    const duel = expectedMarriageValue(USA_ECONOMY, 1)
    const fullTable = expectedMarriageValue(USA_ECONOMY, 3)
    expect(fullTable).toBeGreaterThan(duel)
  })

  it('is dragged down by the bands that cost money, not merely by the good ones', () => {
    // Strip every cost out and the average must rise — proof the losing bands
    // are actually being counted rather than quietly skipped.
    const painless: EconomyConstants = {
      ...USA_ECONOMY,
      marriage: {
        ...USA_ECONOMY.marriage,
        rescued: { ...USA_ECONOMY.marriage.rescued, cost: 0 },
        outcomes: USA_ECONOMY.marriage.outcomes.map((outcome) => ({ ...outcome, cost: 0 })),
      },
    }
    expect(expectedMarriageValue(painless, 1)).toBeGreaterThan(expectedMarriageValue(USA_ECONOMY, 1))
  })

  it('counts a refused proposal as moving no money at all', () => {
    // A refusal pays a LIFE tile, which is not cash and does not belong in a
    // figure the computer compares against dollars.
    const alwaysRefused: EconomyConstants = {
      ...USA_ECONOMY,
      marriage: { ...USA_ECONOMY.marriage, proposalSpin: 6, secondAskSpin: 6 },
    }
    const spec = alwaysRefused.marriage
    // Only a 6 marries; every other roll fails both asks and pays nothing.
    const top = spec.outcomes[spec.outcomes.length - 1]!
    expect(expectedMarriageValue(alwaysRefused, 1)).toBeCloseTo(
      (marriageOutcomeValue(top, alwaysRefused, 1) +
        5 * (1 / 6) * marriageOutcomeValue(spec.rescued, alwaysRefused, 1)) /
        6,
      6,
    )
  })
})

describe('the USA marriage table', () => {
  it('has a losing end and a winning end', () => {
    const { marriage } = USA_ECONOMY
    const values = [marriage.rescued, ...marriage.outcomes].map((outcome) =>
      marriageOutcomeValue(outcome, USA_ECONOMY, 1),
    )
    expect(Math.min(...values)).toBeLessThan(0)
    expect(Math.max(...values)).toBeGreaterThan(0)
  })

  it('improves as the wheel does, so a good spin is never the bad outcome', () => {
    // The wheel has to read the way a player expects, or the tile is a riddle.
    const values = USA_ECONOMY.marriage.outcomes.map((outcome) =>
      marriageOutcomeValue(outcome, USA_ECONOMY, 1),
    )
    for (let i = 1; i < values.length; i += 1) {
      expect(values[i]!).toBeGreaterThan(values[i - 1]!)
    }
  })

  it('makes the rescued proposal the worst marriage on the table', () => {
    const rescued = marriageOutcomeValue(USA_ECONOMY.marriage.rescued, USA_ECONOMY, 1)
    for (const outcome of USA_ECONOMY.marriage.outcomes) {
      expect(rescued).toBeLessThanOrEqual(marriageOutcomeValue(outcome, USA_ECONOMY, 1))
    }
  })
})
