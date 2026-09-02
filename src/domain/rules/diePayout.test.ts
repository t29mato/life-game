import { describe, expect, it } from 'vitest'
import { SPIN_FACES } from '../model/constants'
import { USA_ECONOMY } from '../edition/usa'
import { BASIC_CAREERS } from '../edition/usa'
import { expectedPayday } from './player'
import { SPIN_VALUES, householdSwing, perPipPayout } from './diePayout'
import type { Player, SpinValue } from '../model/types'

function player(overrides: Partial<Player> = {}): Player {
  return {
    id: 'p1',
    name: 'Alex',
    color: 'red',
    spaceId: 'start',
    money: 100_000,
    loans: 0,
    career: null,
    hasDegree: false,
    hasDoctorate: false,
    isMarried: true,
    children: 0,
    house: null,
    lifeTiles: [],
    stocks: [],
    insurance: [],
    isCpu: false,
    isRetired: false,
    retirementRank: null,
    ...overrides,
  }
}

describe('SPIN_VALUES', () => {
  it('is every face of the die, low to high', () => {
    expect(SPIN_VALUES).toEqual([1, 2, 3, 4, 5, 6])
    expect(SPIN_VALUES).toHaveLength(SPIN_FACES)
  })
})

describe('perPipPayout', () => {
  it('pays the rate once per pip', () => {
    expect(perPipPayout(750_000, 1)).toBe(750_000)
    expect(perPipPayout(750_000, 6)).toBe(4_500_000)
  })

  /*
   * The property the published tables lean on: higher is better, every time,
   * with no face worth the same as the one below it. A card that prints six
   * rows is making exactly this promise on the game's behalf.
   */
  it('rises strictly with the face, so the table never has two equal rungs', () => {
    const amounts = SPIN_VALUES.map((face) => perPipPayout(310_000, face))
    for (let i = 1; i < amounts.length; i += 1) {
      expect(amounts[i]!).toBeGreaterThan(amounts[i - 1]!)
    }
  })
})

describe('householdSwing', () => {
  const { breakEvenSpin, shareOfPayday } = USA_ECONOMY.household

  it('lands exactly nowhere on the break-even face', () => {
    expect(householdSwing(player(), USA_ECONOMY, breakEvenSpin)).toBe(0)
  })

  it('costs money below the break-even face and pays above it', () => {
    expect(householdSwing(player(), USA_ECONOMY, 1)).toBeLessThan(0)
    expect(householdSwing(player(), USA_ECONOMY, SPIN_FACES as SpinValue)).toBeGreaterThan(0)
  })

  /*
   * The reason this is a share of a payday rather than a flat sum: a bad
   * month has to mean the same thing to a school-leaver on the bottom rung
   * as it does to somebody at the top of a ladder. A flat figure would land
   * hardest on whoever earns least.
   */
  it('scales with what this player actually earns', () => {
    const earner = player({ career: BASIC_CAREERS[0]! })
    const idle = player({ career: null })
    expect(expectedPayday(earner, USA_ECONOMY)).toBeGreaterThan(expectedPayday(idle, USA_ECONOMY))
    expect(householdSwing(earner, USA_ECONOMY, 6)).toBeGreaterThan(householdSwing(idle, USA_ECONOMY, 6))
  })

  it('is the edition\'s own formula, not a rounded guess at it', () => {
    const subject = player({ career: BASIC_CAREERS[0]! })
    for (const face of SPIN_VALUES) {
      expect(householdSwing(subject, USA_ECONOMY, face)).toBe(
        Math.round((face - breakEvenSpin) * expectedPayday(subject, USA_ECONOMY) * shareOfPayday),
      )
    }
  })
})
