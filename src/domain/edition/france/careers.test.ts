import { describe, expect, it } from 'vitest'
import type { Career } from '../../model/types'
import { ALL_ICON_NAMES } from '../../model/icons'
import { AVERAGE_SPIN } from '../../rules/player'
import { BASIC_CAREERS, GRADUATE_CAREERS } from './careers'
import { EDITION_FRANCE } from './index'
import { findCareer } from '../lookup'

/**
 * The France career pools, held to the same shape the USA pools were measured
 * at — because the shape of the two pools *is* the balance of the opening
 * fork, and this edition changes the country and never the shape. Every
 * threshold below is the USA suite's at ×1.
 */

const mean = (careers: readonly { readonly salary: number }[]): number =>
  careers.reduce((sum, career) => sum + career.salary, 0) / careers.length

const spread = (careers: readonly { readonly salary: number }[]): number =>
  Math.max(...careers.map((c) => c.salary)) - Math.min(...careers.map((c) => c.salary))

describe('france careers catalog', () => {
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

  /** The rungs a career fair may deal: the ones nothing in the pool points at. */
  const entryRungs = (pool: readonly Career[]): readonly Career[] => {
    const pointedAt = new Set(pool.map((career) => career.promotesTo).filter(Boolean))
    return pool.filter((career) => !pointedAt.has(career.id))
  }

  it('keeps every salary a real, sane living', () => {
    for (const career of [...BASIC_CAREERS, ...GRADUATE_CAREERS]) {
      expect(career.salary).toBeGreaterThanOrEqual(20_000)
      expect(career.salary).toBeLessThanOrEqual(150_000)
    }
  })

  it('never hires anybody straight onto a fortune', () => {
    // Nobody is handed the bistro on Apprenticeship Day: a fair deals the
    // bottom rung, and the bottom rung earns like one.
    for (const career of [...entryRungs(BASIC_CAREERS), ...entryRungs(GRADUATE_CAREERS)]) {
      expect(career.salary).toBeGreaterThanOrEqual(20_000)
      expect(career.salary).toBeLessThanOrEqual(70_000)
    }
  })

  it('pays the top of a ladder what running the place is actually worth', () => {
    const bestEntry = Math.max(...entryRungs(BASIC_CAREERS).map((career) => career.salary))
    const bestTop = Math.max(...BASIC_CAREERS.map((career) => career.salary))
    expect(bestTop).toBeGreaterThan(bestEntry * 2)
  })

  it('pays graduates better on average — the diploma is still worth having', () => {
    expect(mean(GRADUATE_CAREERS)).toBeGreaterThan(mean(BASIC_CAREERS))
  })

  it('keeps the graduate pool narrow: a dependable wage, never a spectacular one', () => {
    // The grande-école prize is a floor, not a ceiling: a whole graduate life
    // fits in a band a single trade ladder climbs through twice over.
    expect(spread(GRADUATE_CAREERS)).toBeLessThan(30_000)
    expect(Math.min(...GRADUATE_CAREERS.map((c) => c.salary))).toBeGreaterThanOrEqual(50_000)
  })

  it('keeps the basic pool wide — the draw itself is the gamble', () => {
    expect(spread(BASIC_CAREERS)).toBeGreaterThan(spread(GRADUATE_CAREERS) * 2)
  })

  it('lets the best trade out-earn every graduate job on the board', () => {
    const bestBasic = Math.max(...BASIC_CAREERS.map((c) => c.salary))
    const bestGraduate = Math.max(...GRADUATE_CAREERS.map((c) => c.salary))
    expect(bestBasic).toBeGreaterThan(bestGraduate)
  })

  it('keeps the gap in the means small enough for the board to answer', () => {
    expect(mean(GRADUATE_CAREERS) - mean(BASIC_CAREERS)).toBeLessThan(30_000)
  })

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
    expect(unsteady(BASIC_CAREERS).length).toBeLessThan(BASIC_CAREERS.length)
    expect(unsteady(GRADUATE_CAREERS).length).toBeLessThan(GRADUATE_CAREERS.length)
  })

  it('keeps the professions that could not possibly vary on a flat salary', () => {
    // The state does not have good weeks, and neither does a surgical rota.
    for (const id of ['career-fr-hospital-surgeon', 'career-fr-university-professor', 'career-fr-ministry-section-head']) {
      expect(findCareer(id, EDITION_FRANCE)?.payPerPip).toBeUndefined()
    }
  })

  it('pays the trades whose weeks really do differ by the spin', () => {
    // The crêpe stand's market crowd, the courier's December, the novelist's
    // autumn season.
    for (const id of ['career-fr-crepe-stand-owner', 'career-fr-delivery-courier', 'career-fr-novelist']) {
      expect(findCareer(id, EDITION_FRANCE)?.payPerPip).toBeGreaterThan(0)
    }
  })

  it('keeps a calling in each pool that a layoff can never touch', () => {
    const callings = [...BASIC_CAREERS, ...GRADUATE_CAREERS].filter((career) => career.isCalling)
    expect(callings.length).toBeGreaterThanOrEqual(4)
    for (const calling of callings) {
      expect(calling.promotesTo).toBeUndefined()
    }
    expect(BASIC_CAREERS.some((career) => career.isCalling)).toBe(true)
    expect(GRADUATE_CAREERS.some((career) => career.isCalling)).toBe(true)
  })

  it('points every promotesTo at a rung that exists in the same pool', () => {
    for (const pool of [BASIC_CAREERS, GRADUATE_CAREERS]) {
      const ids = new Set(pool.map((career) => career.id))
      for (const career of pool) {
        if (career.promotesTo) expect(ids.has(career.promotesTo), `${career.id} -> ${career.promotesTo}`).toBe(true)
      }
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
})
