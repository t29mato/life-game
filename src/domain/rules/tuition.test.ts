import { describe, expect, it } from 'vitest'
import type { TuitionOutcome } from '../edition/types'
import { USA_ECONOMY } from '../edition/usa/economy'
import { expectedTuitionCost, tuitionBandFor } from './tuition'

const band = (upTo: number, over: Partial<TuitionOutcome> = {}): TuitionOutcome => ({
  upTo: upTo as TuitionOutcome['upTo'],
  note: `band up to ${upTo}`,
  cost: 0,
  ...over,
})

describe('tuitionBandFor', () => {
  const bands = [band(3, { note: 'steep' }), band(7, { note: 'standard' }), band(10, { note: 'waived' })]

  it('picks the first band the spin does not exceed', () => {
    expect(tuitionBandFor(bands, 1).note).toBe('steep')
    expect(tuitionBandFor(bands, 3).note).toBe('steep')
    expect(tuitionBandFor(bands, 4).note).toBe('standard')
    expect(tuitionBandFor(bands, 7).note).toBe('standard')
    expect(tuitionBandFor(bands, 8).note).toBe('waived')
    expect(tuitionBandFor(bands, 10).note).toBe('waived')
  })

  it('falls back to the last band for a table that does not reach ten', () => {
    // An edition that forgets the top of the wheel gets its best band, rather
    // than a crash in the middle of somebody's enrolment.
    const short = [band(3, { note: 'only one' })]
    expect(tuitionBandFor(short, 10).note).toBe('only one')
  })
})

describe('expectedTuitionCost', () => {
  it('averages every band, weighted by how many spins land in it', () => {
    const bands = [band(5, { cost: 100 }), band(10, { cost: 0 })]
    // Five spins (1-5) at 100, five spins (6-10) at 0.
    expect(expectedTuitionCost({ outcomes: bands })).toBe(50)
  })

  it('is dragged down by the bands that cost more, not merely by the cheap ones', () => {
    const painless = { outcomes: USA_ECONOMY.tuition.outcomes.map((outcome) => ({ ...outcome, cost: 0 })) }
    expect(expectedTuitionCost(painless)).toBeLessThan(expectedTuitionCost(USA_ECONOMY.tuition))
  })
})

describe('the USA tuition table', () => {
  it('keeps the same mean the flat $52,000 bill used to be — the fork was measured against that figure', () => {
    expect(expectedTuitionCost(USA_ECONOMY.tuition)).toBe(52_000)
  })

  it('has a worst band and a free one', () => {
    const costs = USA_ECONOMY.tuition.outcomes.map((outcome) => outcome.cost)
    expect(Math.max(...costs)).toBeGreaterThan(52_000)
    expect(Math.min(...costs)).toBe(0)
  })

  it('gets cheaper as the wheel improves, so a good spin is never the bad outcome', () => {
    const costs = USA_ECONOMY.tuition.outcomes.map((outcome) => outcome.cost)
    for (let i = 1; i < costs.length; i += 1) {
      expect(costs[i]!).toBeLessThanOrEqual(costs[i - 1]!)
    }
  })
})
