import { describe, expect, it } from 'vitest'
import type { Career, Player } from '../model/types'
import { USA_ECONOMY } from '../edition/usa/economy'
import { findCareer } from '../edition/lookup'
import type { SpinValue } from '../model/types'
import {
  NEW_BABY_ARRIVALS,
  TWINS_ARRIVALS,
  certainArrivals,
  childReturnFor,
  childrenArrivingOn,
  expectedArrivals,
  expectedChildValue,
} from './children'

/** A player whose only interesting property is what a payday is worth to them. */
const earner = (salary: number): Player => ({ children: 0, career: { salary } as Career }) as Player
const jobless = (): Player => ({ children: 0, career: null }) as Player

const { starSpin, starPayout } = USA_ECONOMY.childOutcome

describe('childReturnFor', () => {
  it('pays an ordinary life a share of what the parent earns', () => {
    const poor = childReturnFor(earner(34_000), 5)
    const rich = childReturnFor(earner(148_500), 5)
    expect(poor).toBeGreaterThan(0)
    expect(rich / poor).toBeCloseTo(148_500 / 34_000, 1)
  })

  it('pays more for a better life, at every wage', () => {
    for (const salary of [24_000, 70_000, 148_500]) {
      const parent = earner(salary)
      expect(childReturnFor(parent, 5)).toBeGreaterThan(childReturnFor(parent, 1))
    }
  })

  it('pays a star flat, so anybody’s child can be one', () => {
    /*
     * The half that deliberately does *not* scale. A jackpot only the wealthy
     * can win is worse design and worse taste, and a courier's kid making it
     * big is the better story.
     */
    expect(childReturnFor(earner(24_000), starSpin)).toBe(starPayout)
    expect(childReturnFor(earner(148_500), starSpin)).toBe(starPayout)
    expect(childReturnFor(jobless(), starSpin)).toBe(starPayout)
  })

  it('is worth far more to a poor family as a star than as an ordinary life', () => {
    // The flat star is what keeps the lane a lottery worth entering from the
    // bottom: on the lowest wage on the board it is worth more than every
    // ordinary life on the die put together.
    const parent = earner(24_000)
    const everyOrdinaryLife = ([1, 2, 3, 4, 5] as const).reduce(
      (sum, spin) => sum + childReturnFor(parent, spin),
      0,
    )
    expect(childReturnFor(parent, starSpin)).toBeGreaterThan(everyOrdinaryLife)
  })

  it('counts an unsteady trade at what it really averages', () => {
    // `salary` is the expected packet for a job paid by the wheel, so a food
    // truck and a contract of the same worth raise a child on the same money.
    const truck = findCareer('career-food-truck-owner')!
    expect(truck.payPerPip).toBeGreaterThan(0)
    expect(childReturnFor(earner(truck.salary), 5)).toBe(
      childReturnFor({ children: 0, career: truck } as Player, 5),
    )
  })

  it('still pays something for a child of somebody who never worked', () => {
    expect(childReturnFor(jobless(), 5)).toBeGreaterThan(0)
  })
})

describe('expectedChildValue', () => {
  it('sits between the worst ordinary life and the star', () => {
    const parent = earner(70_000)
    expect(expectedChildValue(parent)).toBeGreaterThan(childReturnFor(parent, 1))
    expect(expectedChildValue(parent)).toBeLessThan(starPayout)
  })

  it('is the average of the six faces the die actually has', () => {
    const parent = earner(70_000)
    const faces = [1, 2, 3, 4, 5, 6] as const
    const byHand = faces.reduce((sum, spin) => sum + childReturnFor(parent, spin), 0) / 6
    expect(expectedChildValue(parent)).toBeCloseTo(byHand, 0)
  })

  it('rises with the parent’s income, which is the whole point', () => {
    const groomer = expectedChildValue(earner(34_000))
    const median = expectedChildValue(earner(70_000))
    const owner = expectedChildValue(earner(148_500))
    expect(median).toBeGreaterThan(groomer)
    expect(owner).toBeGreaterThan(median)
    // ...but never proportionally, because the star is flat and lifts the floor.
    expect(owner / groomer).toBeLessThan(148_500 / 34_000)
  })

  it('scales exactly with the unit an edition counts in', () => {
    // A hundred-times edition must price a child at a hundred times, to the
    // last representable bit — no rounding may creep in on the way.
    const hundred = { ...USA_ECONOMY, childOutcome: { ...USA_ECONOMY.childOutcome, starPayout: starPayout * 100 } }
    expect(expectedChildValue(earner(70_000 * 100), hundred)).toBeCloseTo(
      expectedChildValue(earner(70_000)) * 100,
      6,
    )
  })
})

describe('the arrival die', () => {
  /*
   * The owner's own numbers, spelled out face by face rather than derived from
   * `NEW_BABY_ARRIVALS`: 1〜2だと0人、3〜5で一人、6で双子. A test that reads
   * the same table the engine reads cannot notice the day the table is edited,
   * which is the only day this test is for.
   */
  it.each([
    [1, 0],
    [2, 0],
    [3, 1],
    [4, 1],
    [5, 1],
    [6, 2],
  ])('brings %i → %i on a New Baby tile', (face, expected) => {
    expect(childrenArrivingOn(NEW_BABY_ARRIVALS, face as SpinValue)).toBe(expected)
  })

  it('is two faces in six where no child arrives, and that is the point', () => {
    const empty = ([1, 2, 3, 4, 5, 6] as const).filter(
      (face) => childrenArrivingOn(NEW_BABY_ARRIVALS, face) === 0,
    )
    expect(empty).toEqual([1, 2])
  })

  it('averages five sixths of a child, which is what a computer seat prices it at', () => {
    expect(expectedArrivals(NEW_BABY_ARRIVALS)).toBeCloseTo(5 / 6, 10)
  })

  it('reads a scan that has already happened as certain, on every face', () => {
    expect(certainArrivals(TWINS_ARRIVALS)).toBe(2)
    expect(expectedArrivals(TWINS_ARRIVALS)).toBe(2)
  })

  it('says a real distribution is not certain, which is what asks for the die', () => {
    expect(certainArrivals(NEW_BABY_ARRIVALS)).toBeNull()
  })

  it('falls back to the last band rather than to nobody if a table stops short', () => {
    // A malformed table handing out nothing is a far worse failure here than
    // one repeating its best band — see `childrenArrivingOn`.
    expect(childrenArrivingOn([{ upTo: 3, children: 1 }], 6)).toBe(1)
  })
})
