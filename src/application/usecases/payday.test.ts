import { describe, expect, it } from 'vitest'
import type { Career } from '@domain/model/types'
import { CASUAL_WAGE_PER_PIP } from '@domain/model/constants'
import { fixturePlayer } from '../testing/fixtures'
import { createFakeRandom } from '../testing/fakes'
import { collectPaydays, describeSpins, passedPaydayLine } from './payday'

const SALARIED: Career = {
  id: 'career-test-salaried',
  title: 'Test Salaried',
  salary: 40_000,
  raiseStep: 4_000,
  requiresDegree: false,
  icon: 'space:payday',
  description: 'A salaried career used only in tests.',
}

const UNSTEADY: Career = {
  id: 'career-test-unsteady',
  title: 'Test Unsteady',
  salary: 44_100,
  payPerPip: 12_600,
  raiseStep: 5_500,
  requiresDegree: false,
  icon: 'space:payday',
  description: 'An unsteady career used only in tests.',
}

describe('collectPaydays', () => {
  it('pays a salaried player the same packet every time, without touching the wheel', () => {
    const random = createFakeRandom({ spins: [5] })
    const result = collectPaydays(fixturePlayer({ career: SALARIED, money: 0 }), 3, { random })

    expect(result.total).toBe(SALARIED.salary * 3)
    expect(result.player.money).toBe(SALARIED.salary * 3)
    expect(result.kind).toBe('salary')
    expect(result.packets.map((packet) => packet.spin)).toEqual([null, null, null])
    // A flat wage must never consume a spin: doing so would shift every later
    // roll in the game for a player whose pay does not depend on one.
    expect(random.calls.spins).toBe(0)
  })

  it('rolls every passed payday separately for unsteady work', () => {
    const random = createFakeRandom({ spins: [2, 4, 6] })
    const result = collectPaydays(fixturePlayer({ career: UNSTEADY, money: 0 }), 3, { random })

    expect(random.calls.spins).toBe(3)
    expect(result.packets.map((packet) => packet.spin)).toEqual([2, 4, 6])
    expect(result.packets.map((packet) => packet.amount)).toEqual([25_200, 50_400, 75_600])
    expect(result.total).toBe(151_200)
    expect(result.kind).toBe('variable')
  })

  it('pays casual shifts by the spin while between jobs', () => {
    const random = createFakeRandom({ spins: [4, 6] })
    const result = collectPaydays(fixturePlayer({ career: null, money: 1_000 }), 2, { random })

    expect(result.kind).toBe('casual')
    expect(result.total).toBe(CASUAL_WAGE_PER_PIP * 10)
    expect(result.player.money).toBe(1_000 + CASUAL_WAGE_PER_PIP * 10)
  })

  it('never pays an unemployed player nothing — unemployment is not a dead stretch', () => {
    for (const spin of [1, 3, 6] as const) {
      const result = collectPaydays(fixturePlayer({ career: null, money: 0 }), 1, {
        random: createFakeRandom({ spins: [spin] }),
      })
      expect(result.total).toBeGreaterThan(0)
    }
  })

  it('collects nothing at all when no payday was passed', () => {
    const random = createFakeRandom({ spins: [5] })
    const player = fixturePlayer({ career: null, money: 700 })
    const result = collectPaydays(player, 0, { random })

    expect(result.total).toBe(0)
    expect(result.packets).toEqual([])
    expect(result.player).toBe(player)
    expect(random.calls.spins).toBe(0)
  })

  it('leaves the player it was given untouched', () => {
    const player = fixturePlayer({ career: UNSTEADY, money: 500 })
    collectPaydays(player, 2, { random: createFakeRandom({ spins: [3] }) })
    expect(player.money).toBe(500)
  })
})

describe('describeSpins', () => {
  it('names a single roll', () => {
    expect(describeSpins([{ amount: 1, spin: 4 }])).toBe('a 4')
  })

  it('joins two rolls with "and"', () => {
    expect(describeSpins([
      { amount: 1, spin: 3 },
      { amount: 1, spin: 5 },
    ])).toBe('3 and 5')
  })

  it('joins three or more with commas and a final "and"', () => {
    expect(describeSpins([
      { amount: 1, spin: 3 },
      { amount: 1, spin: 5 },
      { amount: 1, spin: 2 },
    ])).toBe('3, 5 and 2')
  })

  it('is empty when nothing was spun', () => {
    expect(describeSpins([{ amount: 1, spin: null }])).toBe('')
  })
})

describe('passedPaydayLine', () => {
  it('reports a flat wage as the plain collection it is', () => {
    const collection = collectPaydays(fixturePlayer({ career: SALARIED, money: 0 }), 2, {
      random: createFakeRandom(),
    })
    expect(passedPaydayLine('Ada', collection)).toBe('Ada passes payday 2x: $80,000 — now $80,000.')
  })

  it('shows the spins behind an unsteady packet', () => {
    const collection = collectPaydays(fixturePlayer({ career: UNSTEADY, money: 0 }), 2, {
      random: createFakeRandom({ spins: [3, 5] }),
    })
    expect(passedPaydayLine('Ada', collection)).toBe('Ada passes payday 2x, spinning 3 and 5: $100,800 — now $100,800.')
  })

  it('says a player between jobs picked up shifts', () => {
    const collection = collectPaydays(fixturePlayer({ career: null, money: 0 }), 1, {
      random: createFakeRandom({ spins: [6] }),
    })
    const amount = '$' + (CASUAL_WAGE_PER_PIP * 6).toLocaleString('en-US')
    expect(passedPaydayLine('Ada', collection)).toBe(
      `Ada picks up shifts passing payday, spinning a 6: ${amount} — now ${amount}.`,
    )
  })
})
