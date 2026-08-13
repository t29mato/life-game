import { describe, expect, it } from 'vitest'
import type { Career } from '../../model/types'
import { ALL_ICON_NAMES } from '../../model/icons'
import { AVERAGE_SPIN } from '../../rules/player'
import { BASIC_CAREERS, GRADUATE_CAREERS } from './careers'
import { findCareer } from '../lookup'

const mean = (careers: readonly { readonly salary: number }[]): number =>
  careers.reduce((sum, career) => sum + career.salary, 0) / careers.length

/** Highest salary in a pool minus its lowest — how wide a life the pool covers. */
const spread = (careers: readonly { readonly salary: number }[]): number =>
  Math.max(...careers.map((c) => c.salary)) - Math.min(...careers.map((c) => c.salary))

describe('careers catalog', () => {
  // The career-change spaces re-draw two fresh careers every time they fire, so
  // a thin pool turns churn into the same two offers over and over.
  it('keeps a deep basic pool, none of it needing a degree', () => {
    expect(BASIC_CAREERS.length).toBeGreaterThanOrEqual(12)
    for (const career of BASIC_CAREERS) {
      expect(career.requiresDegree).toBe(false)
    }
  })

  it('keeps a deep graduate pool, all of it needing a degree', () => {
    expect(GRADUATE_CAREERS.length).toBeGreaterThanOrEqual(10)
    for (const career of GRADUATE_CAREERS) {
      expect(career.requiresDegree).toBe(true)
    }
  })

  it('has unique titles so a re-draw never offers the same job twice', () => {
    const titles = [...BASIC_CAREERS, ...GRADUATE_CAREERS].map((career) => career.title)
    expect(new Set(titles).size).toBe(titles.length)
  })

  it('only names art the icon registry can actually draw', () => {
    for (const career of [...BASIC_CAREERS, ...GRADUATE_CAREERS]) {
      expect(ALL_ICON_NAMES).toContain(career.icon)
    }
  })

  it('keeps every salary a real, sane living', () => {
    for (const career of [...BASIC_CAREERS, ...GRADUATE_CAREERS]) {
      expect(career.salary).toBeGreaterThanOrEqual(20_000)
      expect(career.salary).toBeLessThanOrEqual(100_000)
    }
  })

  /*
   * The shape of the two pools is the whole balance of the opening fork, so it
   * is asserted here rather than left to the play-through suite to discover.
   * A degree buys a *floor*: every graduate job is a good, dull living. No
   * degree means a ladder nobody vetted, with rungs at both ends.
   */
  it('pays graduates better on average — the degree is still worth having', () => {
    expect(mean(GRADUATE_CAREERS)).toBeGreaterThan(mean(BASIC_CAREERS))
  })

  it('keeps the graduate pool narrow: a dependable wage, never a spectacular one', () => {
    expect(spread(GRADUATE_CAREERS)).toBeLessThan(25_000)
    expect(Math.min(...GRADUATE_CAREERS.map((c) => c.salary))).toBeGreaterThanOrEqual(50_000)
  })

  it('keeps the basic pool wide — the draw itself is the gamble', () => {
    // Comfortably wider than the graduate band, which is what makes Straight to
    // Work the volatile life rather than merely the poorer one.
    expect(spread(BASIC_CAREERS)).toBeGreaterThan(spread(GRADUATE_CAREERS) * 2)
  })

  it('lets the best basic job out-earn every graduate job on the board', () => {
    const bestBasic = Math.max(...BASIC_CAREERS.map((c) => c.salary))
    const bestGraduate = Math.max(...GRADUATE_CAREERS.map((c) => c.salary))
    expect(bestBasic).toBeGreaterThan(bestGraduate)
  })

  it('keeps the gap in the means small enough for the board to answer', () => {
    // Every payday collects the difference, a dozen times a game. At the old
    // $54k it was worth more than the whole rest of the board put together and
    // College Lane won 93 games in 100.
    expect(mean(GRADUATE_CAREERS) - mean(BASIC_CAREERS)).toBeLessThan(30_000)
  })

  /*
   * Unsteady work: paid `payPerPip × spin` rather than a flat packet. Which
   * jobs earn it is a content judgement — a food truck has good weeks and bad
   * ones, a surgeon does not — but two things about it are load-bearing and
   * belong here. The headline `salary` has to stay honest, because it is what
   * the panel quotes and what the computer prices the job by; and the volatile
   * work has to sit mostly in the basic pool, which is the lane that is
   * supposed to swing.
   */
  const unsteady = (careers: readonly Career[]): readonly Career[] =>
    careers.filter((career) => career.payPerPip !== undefined)

  it('quotes an honest salary for every unsteady job', () => {
    for (const career of unsteady([...BASIC_CAREERS, ...GRADUATE_CAREERS])) {
      const average = career.payPerPip! * AVERAGE_SPIN
      expect(Math.abs(average - career.salary) / career.salary).toBeLessThan(0.01)
    }
  })

  it('gives every unsteady job a positive pay per pip', () => {
    for (const career of unsteady([...BASIC_CAREERS, ...GRADUATE_CAREERS])) {
      expect(career.payPerPip!).toBeGreaterThan(0)
    }
  })

  it('puts the unsteady work mostly in the pool with no safety net', () => {
    expect(unsteady(BASIC_CAREERS).length).toBeGreaterThan(unsteady(GRADUATE_CAREERS).length * 3)
  })

  it('leaves a steady living available in both pools', () => {
    // Volatility has to be something a player can end up with, never something
    // every offer forces on them.
    expect(unsteady(BASIC_CAREERS).length).toBeLessThan(BASIC_CAREERS.length)
    expect(unsteady(GRADUATE_CAREERS).length).toBeLessThan(GRADUATE_CAREERS.length)
  })

  it('keeps the professions that could not possibly vary on a flat salary', () => {
    for (const id of ['career-surgeon', 'career-university-professor', 'career-architect']) {
      expect(findCareer(id)?.payPerPip).toBeUndefined()
    }
  })

  it('pays the trades whose weeks really do differ by the spin', () => {
    for (const id of ['career-food-truck-owner', 'career-delivery-courier', 'career-salon-owner']) {
      expect(findCareer(id)?.payPerPip).toBeGreaterThan(0)
    }
  })

  it('gives every career a positive raise step', () => {
    for (const career of [...BASIC_CAREERS, ...GRADUATE_CAREERS]) {
      expect(career.raiseStep).toBeGreaterThan(0)
    }
  })

  it('gives every career a title, icon, and description', () => {
    for (const career of [...BASIC_CAREERS, ...GRADUATE_CAREERS]) {
      expect(career.title.length).toBeGreaterThan(0)
      expect(career.icon.length).toBeGreaterThan(0)
      expect(career.description.length).toBeGreaterThan(0)
    }
  })

  it('has unique ids across both pools', () => {
    const ids = [...BASIC_CAREERS, ...GRADUATE_CAREERS].map((career) => career.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  describe('findCareer', () => {
    it('finds a basic career by id', () => {
      const target = BASIC_CAREERS[0]
      expect(target).toBeDefined()
      expect(findCareer(target!.id)).toEqual(target)
    })

    it('finds a graduate career by id', () => {
      const target = GRADUATE_CAREERS[0]
      expect(target).toBeDefined()
      expect(findCareer(target!.id)).toEqual(target)
    })

    it('returns undefined for an unknown id', () => {
      expect(findCareer('not-a-real-career')).toBeUndefined()
    })
  })
})
