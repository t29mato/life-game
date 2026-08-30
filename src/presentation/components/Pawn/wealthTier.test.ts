import { describe, expect, it } from 'vitest'
import { EDITION_USA } from '@domain/edition/usa'
import { scaleEdition } from '@domain/edition/scale'
import { wealthTier } from './wealthTier'

const scale = EDITION_USA.economy

describe('wealthTier', () => {
  it('puts any player in the red into the battered runabout', () => {
    expect(wealthTier(-1, scale)).toBe(1)
    expect(wealthTier(-500_000, scale)).toBe(1)
  })

  it('gives everyone else the familiar roadster until they reach big money', () => {
    expect(wealthTier(0, scale)).toBe(2)
    expect(wealthTier(scale.bigMoney - 1, scale)).toBe(2)
  })

  it("adds the brightwork at the edition's own big-money threshold", () => {
    expect(wealthTier(scale.bigMoney, scale)).toBe(3)
    expect(wealthTier(scale.fireNumber - 1, scale)).toBe(3)
  })

  it('rolls out the grand tourer at retire-on-the-spot money', () => {
    expect(wealthTier(scale.fireNumber, scale)).toBe(4)
  })

  it('tiers identically on an edition counting in a 100× unit', () => {
    // The banding must be relative to the edition's own economy, never a
    // dollar figure — the same property `scaleInvariance.test.ts` holds the
    // engine to. A sum that earns tier 3 in dollars earns tier 3 at ×100.
    const x100 = scaleEdition(EDITION_USA, 100, { id: 'usa-x100' }).economy
    for (const worth of [-10_000, 0, scale.bigMoney, scale.fireNumber]) {
      expect(wealthTier(worth * 100, x100)).toBe(wealthTier(worth, scale))
    }
  })
})
