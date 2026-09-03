import { describe, expect, it } from 'vitest'
import type { Career } from '../../model/types'
import { ALL_ICON_NAMES } from '../../model/icons'
import { AVERAGE_SPIN } from '../../rules/player'
import { ACADEMIA_CAREERS, INDUSTRY_CAREERS, PERMANENT_CAREERS } from './careers'
import { EDITION_RESEARCHER_JAPAN } from './index'
import { findCareer } from '../lookup'

/**
 * The three shelves, held to the shape the balance suite measured them at —
 * and held the *other way up* from every other edition's career suite.
 *
 * On a country board the graduate pool is the tight one and the basic pool is
 * the gamble. Here `basic` is corporate research and `graduate` is the
 * fixed-term academic posts a doctorate opens, so every ratio below points the
 * opposite way. That is not a translation of the country suite; it is the
 * assertion that this edition did the thing it exists to do.
 */

const mean = (careers: readonly { readonly salary: number }[]): number =>
  careers.reduce((sum, career) => sum + career.salary, 0) / careers.length

const band = (careers: readonly { readonly salary: number }[]): number =>
  Math.max(...careers.map((c) => c.salary)) - Math.min(...careers.map((c) => c.salary))

/** The rungs a career fair may deal: the ones nothing in the pool points at. */
const entryRungs = (pool: readonly Career[]): readonly Career[] => {
  const pointedAt = new Set(pool.map((career) => career.promotesTo).filter(Boolean))
  return pool.filter((career) => !pointedAt.has(career.id))
}

const EVERY_CAREER = [...INDUSTRY_CAREERS, ...ACADEMIA_CAREERS, ...PERMANENT_CAREERS]

describe('the researcher japan career catalogue', () => {
  it('keeps all three shelves deep enough for a fair to deal twice', () => {
    expect(INDUSTRY_CAREERS.length).toBeGreaterThanOrEqual(12)
    expect(ACADEMIA_CAREERS.length).toBeGreaterThanOrEqual(12)
    expect(PERMANENT_CAREERS.length).toBeGreaterThanOrEqual(6)
    expect(entryRungs(INDUSTRY_CAREERS).length).toBeGreaterThanOrEqual(4)
    expect(entryRungs(ACADEMIA_CAREERS).length).toBeGreaterThanOrEqual(4)
    expect(entryRungs(PERMANENT_CAREERS).length).toBeGreaterThanOrEqual(4)
  })

  it('marks the two academic shelves as needing the schooling, and industry as not', () => {
    // The master's exit is not "no degree" in the fiction — but mechanically
    // it is the shelf a player reaches without the engine's degree flag, and
    // the engine has to be told so.
    for (const career of INDUSTRY_CAREERS) expect(career.requiresDegree).toBe(false)
    for (const career of [...ACADEMIA_CAREERS, ...PERMANENT_CAREERS]) {
      expect(career.requiresDegree).toBe(true)
    }
  })

  it('has unique ids and unique titles across all three shelves', () => {
    const ids = EVERY_CAREER.map((career) => career.id)
    const titles = EVERY_CAREER.map((career) => career.title)
    expect(new Set(ids).size).toBe(ids.length)
    expect(new Set(titles).size).toBe(titles.length)
  })

  it('only names art the icon registry can actually draw', () => {
    for (const career of EVERY_CAREER) expect(ALL_ICON_NAMES).toContain(career.icon)
  })

  it('keeps every salary a real, sane living', () => {
    for (const career of EVERY_CAREER) {
      expect(career.salary).toBeGreaterThanOrEqual(2_000_000)
      expect(career.salary).toBeLessThanOrEqual(15_000_000)
    }
  })

  // -------------------------------------------------------------------------
  // The inversion, in the catalogue rather than in the play
  // -------------------------------------------------------------------------

  it('makes the academia shelf several times wider than the industry shelf', () => {
    /*
     * The single most load-bearing number in this edition. The width of this
     * shelf *is* the volatility of the doctorate lane — measured at ¥2.45M to
     * ¥14.7M against industry's ¥4.2M to ¥6.475M, a ratio of 5.4 — and
     * `balance.test.ts` is what turns it into a finishing spread. Narrow this
     * and the opening fork stops meaning anything.
     */
    expect(band(ACADEMIA_CAREERS)).toBeGreaterThan(band(INDUSTRY_CAREERS) * 4)
  })

  it('keeps the industry shelf narrow: a dependable wage, never a spectacular one', () => {
    // A whole working life on the safe road fits inside one academic ladder's
    // bottom two rungs.
    expect(band(INDUSTRY_CAREERS)).toBeLessThan(3_000_000)
    expect(Math.min(...INDUSTRY_CAREERS.map((c) => c.salary))).toBeGreaterThanOrEqual(4_000_000)
  })

  it('gives the academia shelf the grimmest rung on the board', () => {
    // The part-time lecturer, paid by the course. One of the two winces this
    // edition owes the people it is written for.
    const worst = Math.min(...ACADEMIA_CAREERS.map((c) => c.salary))
    expect(worst).toBeLessThan(3_000_000)
    expect(worst).toBeLessThan(Math.min(...INDUSTRY_CAREERS.map((c) => c.salary)) * 0.7)
  })

  it('gives the academia shelf the tallest top on the board', () => {
    const best = Math.max(...ACADEMIA_CAREERS.map((c) => c.salary))
    expect(best).toBeGreaterThan(Math.max(...INDUSTRY_CAREERS.map((c) => c.salary)) * 2)
    expect(best).toBeGreaterThan(Math.max(...PERMANENT_CAREERS.map((c) => c.salary)))
  })

  it('climbs industry on time served and academia by open competition', () => {
    /*
     * Promotion is the second place this board's argument is written in
     * numbers. A research division's next grade lands four times in six; an
     * advertised academic post lands twice, and its top step once. Failing
     * costs nothing but the year — this board's catastrophic moment is the
     * end of the ladder, not the climb.
     */
    for (const career of INDUSTRY_CAREERS.filter((c) => c.promotesTo)) {
      expect(career.promotionSpin).toBe(3)
    }
    for (const career of ACADEMIA_CAREERS.filter((c) => c.promotesTo)) {
      expect(career.promotionSpin).toBeGreaterThanOrEqual(5)
    }
    for (const career of PERMANENT_CAREERS.filter((c) => c.promotesTo)) {
      expect(career.promotionSpin).toBe(3)
    }
  })

  it('runs the academia ladders longer than the industry ones', () => {
    const height = (pool: readonly Career[], entry: Career): number => {
      let rungs = 1
      let above = entry.promotesTo
      const seen = new Set([entry.id])
      while (above && !seen.has(above)) {
        seen.add(above)
        rungs += 1
        above = pool.find((c) => c.id === above)?.promotesTo
      }
      return rungs
    }
    const tallest = (pool: readonly Career[]) =>
      Math.max(...entryRungs(pool).map((entry) => height(pool, entry)))
    expect(tallest(ACADEMIA_CAREERS)).toBe(3)
    expect(tallest(INDUSTRY_CAREERS)).toBe(2)
    expect(tallest(PERMANENT_CAREERS)).toBe(2)
  })

  // -------------------------------------------------------------------------
  // The permanent shelf
  // -------------------------------------------------------------------------

  it('gives the permanent shelf the highest floor and not the highest ceiling', () => {
    /*
     * The base game's doctoral-shelf argument, and it still holds with the
     * roles swapped: nobody holding a permanent post ever scrapes by, and the
     * researcher who spent a life on soft money and climbed the whole way
     * still out-earns them. That is what keeps the gated road an argument
     * rather than an upgrade.
     */
    const floor = Math.min(...PERMANENT_CAREERS.map((c) => c.salary))
    // Above everything the safe road can ever pay…
    expect(floor).toBeGreaterThan(Math.max(...INDUSTRY_CAREERS.map((c) => c.salary)))
    // …and above whatever an open call would have dealt you instead, on
    // average. Not above the *whole* academic shelf: its top rungs beat this
    // one, and are meant to.
    expect(floor).toBeGreaterThan(mean(entryRungs(ACADEMIA_CAREERS)))
    expect(band(PERMANENT_CAREERS)).toBeLessThan(band(INDUSTRY_CAREERS))
  })

  it('makes every rung of the permanent shelf, and only those, safe from a layoff', () => {
    // The mechanical payoff of the gated road — and the one thing on this
    // board no other board in the game has.
    for (const career of PERMANENT_CAREERS) expect(career.cannotBeLaidOff).toBe(true)
    for (const career of [...INDUSTRY_CAREERS, ...ACADEMIA_CAREERS]) {
      expect(career.cannotBeLaidOff).toBeUndefined()
    }
  })

  it('pays the permanent shelf a contract, never a die', () => {
    // Ten years of one-year contracts is exactly the thing you buy a
    // predictable income with.
    for (const career of PERMANENT_CAREERS) expect(career.payPerPip).toBeUndefined()
  })

  // -------------------------------------------------------------------------
  // Soft money
  // -------------------------------------------------------------------------

  const unsteady = (careers: readonly Career[]): readonly Career[] =>
    careers.filter((career) => career.payPerPip !== undefined)

  it('quotes an honest salary for every unsteady job', () => {
    for (const career of unsteady(EVERY_CAREER)) {
      const average = career.payPerPip! * AVERAGE_SPIN
      expect(Math.abs(average - career.salary) / career.salary).toBeLessThan(0.01)
      expect(career.payPerPip!).toBeGreaterThan(0)
    }
  })

  it('puts the soft money where the soft money is', () => {
    // Whether the salary exists next year is decided by a panel you will never
    // meet — so the academia shelf is paid by the die far more often than the
    // industry shelf, which is on a contract.
    expect(unsteady(ACADEMIA_CAREERS).length).toBeGreaterThan(unsteady(INDUSTRY_CAREERS).length * 3)
    expect(unsteady(ACADEMIA_CAREERS).length).toBeLessThan(ACADEMIA_CAREERS.length)
    expect(unsteady(INDUSTRY_CAREERS).length).toBeGreaterThan(0)
  })

  it('keeps the clinic salaried all the way up, which is its own bitter joke', () => {
    for (const id of [
      'career-jpr-clinical-fellow',
      'career-jpr-trial-physician',
      'career-jpr-trial-centre-director',
    ]) {
      expect(findCareer(id, EDITION_RESEARCHER_JAPAN)?.payPerPip).toBeUndefined()
    }
  })

  it('pays by the die exactly where the money really is somebody else\'s decision', () => {
    // The postdoc, the part-time lecturer, the field station, the centre on a
    // ten-year programme.
    for (const id of [
      'career-jpr-postdoc',
      'career-jpr-part-time-lecturer',
      'career-jpr-station-assistant',
      'career-jpr-centre-director',
    ]) {
      expect(findCareer(id, EDITION_RESEARCHER_JAPAN)?.payPerPip).toBeGreaterThan(0)
    }
  })

  // -------------------------------------------------------------------------
  // The ordinary catalogue rules every edition keeps
  // -------------------------------------------------------------------------

  it('keeps a calling on both of the shelves a fair can deal from', () => {
    const callings = EVERY_CAREER.filter((career) => career.isCalling)
    expect(callings.length).toBeGreaterThanOrEqual(4)
    for (const calling of callings) expect(calling.promotesTo).toBeUndefined()
    expect(INDUSTRY_CAREERS.some((career) => career.isCalling)).toBe(true)
    expect(ACADEMIA_CAREERS.some((career) => career.isCalling)).toBe(true)
    // …and none on the permanent shelf, whose whole promise is the money and
    // the certainty. A calling read as a choice belongs a shelf below.
    expect(PERMANENT_CAREERS.some((career) => career.isCalling)).toBe(false)
  })

  it('never hires anybody straight onto a fortune', () => {
    for (const career of [...entryRungs(INDUSTRY_CAREERS), ...entryRungs(ACADEMIA_CAREERS)]) {
      expect(career.salary).toBeGreaterThanOrEqual(2_000_000)
      expect(career.salary).toBeLessThanOrEqual(11_000_000)
    }
  })

  it('points every promotesTo at a rung that exists on the same shelf', () => {
    for (const pool of [INDUSTRY_CAREERS, ACADEMIA_CAREERS, PERMANENT_CAREERS]) {
      const ids = new Set(pool.map((career) => career.id))
      for (const career of pool) {
        if (career.promotesTo) {
          expect(ids.has(career.promotesTo), `${career.id} -> ${career.promotesTo}`).toBe(true)
        }
      }
    }
  })

  it('gives every career a positive raise step, a title, an icon and a description', () => {
    for (const career of EVERY_CAREER) {
      expect(career.raiseStep).toBeGreaterThan(0)
      expect(career.title.length).toBeGreaterThan(0)
      expect(career.icon.length).toBeGreaterThan(0)
      expect(career.description.length).toBeGreaterThan(0)
    }
  })
})
