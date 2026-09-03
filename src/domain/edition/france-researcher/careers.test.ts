import { describe, expect, it } from 'vitest'
import type { Career } from '../../model/types'
import { ALL_ICON_NAMES } from '../../model/icons'
import { AVERAGE_SPIN } from '../../rules/player'
import { CADRE_CAREERS, CONTRACT_CAREERS, FONCTIONNAIRE_CAREERS } from './careers'
import { EDITION_RESEARCHER_FRANCE } from './index'
import { findCareer } from '../lookup'

/**
 * The three shelves, held to the shape the balance suite measured them at —
 * and held to a *different* shape from the Researcher: Japan board's, which
 * is the entire reason this board exists.
 *
 * Japan's permanent shelf has a floor standing above industry's ceiling:
 * clearing the gate there buys safety *and* money. France's does the
 * opposite, and this file is where that is written down as arithmetic rather
 * than as prose — the best-paid post behind the gate is out-earned by every
 * second rung of the road the player could have taken at eighteen.
 */

const mean = (careers: readonly { readonly salary: number }[]): number =>
  careers.reduce((sum, career) => sum + career.salary, 0) / careers.length

const band = (careers: readonly { readonly salary: number }[]): number =>
  Math.max(...careers.map((c) => c.salary)) - Math.min(...careers.map((c) => c.salary))

const floorOf = (careers: readonly Career[]): number => Math.min(...careers.map((c) => c.salary))
const ceilingOf = (careers: readonly Career[]): number => Math.max(...careers.map((c) => c.salary))

/** The rungs a career fair may deal: the ones nothing in the pool points at. */
const entryRungs = (pool: readonly Career[]): readonly Career[] => {
  const pointedAt = new Set(pool.map((career) => career.promotesTo).filter(Boolean))
  return pool.filter((career) => !pointedAt.has(career.id))
}

/** Everything one rung above a door — "industry's rung 2", in the concept doc's words. */
const secondRungs = (pool: readonly Career[]): readonly Career[] => {
  const above = new Set(entryRungs(pool).map((career) => career.promotesTo).filter(Boolean))
  return pool.filter((career) => above.has(career.id))
}

const EVERY_CAREER = [...CADRE_CAREERS, ...CONTRACT_CAREERS, ...FONCTIONNAIRE_CAREERS]

describe('the researcher france career catalogue', () => {
  it('keeps all three shelves deep enough for a fair to deal twice', () => {
    expect(CADRE_CAREERS.length).toBeGreaterThanOrEqual(12)
    expect(CONTRACT_CAREERS.length).toBeGreaterThanOrEqual(12)
    expect(FONCTIONNAIRE_CAREERS.length).toBeGreaterThanOrEqual(6)
    expect(entryRungs(CADRE_CAREERS).length).toBeGreaterThanOrEqual(4)
    expect(entryRungs(CONTRACT_CAREERS).length).toBeGreaterThanOrEqual(4)
    expect(entryRungs(FONCTIONNAIRE_CAREERS).length).toBeGreaterThanOrEqual(4)
  })

  it('marks the two doctoral shelves as needing the schooling, and the cadre shelf as not', () => {
    // The grande école road is not "no degree" in the fiction — an engineering
    // diploma is five years of higher education — but mechanically it is the
    // shelf a player reaches without the engine's degree flag, and the engine
    // has to be told so.
    for (const career of CADRE_CAREERS) expect(career.requiresDegree).toBe(false)
    for (const career of [...CONTRACT_CAREERS, ...FONCTIONNAIRE_CAREERS]) {
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
      expect(career.salary).toBeGreaterThanOrEqual(20_000)
      expect(career.salary).toBeLessThanOrEqual(150_000)
    }
  })

  // -------------------------------------------------------------------------
  // The opening fork, in the catalogue rather than in the play
  // -------------------------------------------------------------------------

  it('pays the doctorate\'s shelf half again as much at the door', () => {
    /*
     * The single most load-bearing number in this edition, and the one the
     * balance pass spent its whole budget on.
     *
     * The University road forgoes three paydays and pays a bill; the grande
     * école road is salaried from its first square. Nothing about the shelves
     * matters if the shelf at the end of the long road does not out-pay the
     * short one *at the rung a fair actually deals*, and the first cut of this
     * board proved it: the entry rungs were 27% apart, the opening fork
     * measured 33.3% to the University, and it was a road nobody sane takes.
     * Measured now at €63,409 against €40,455 — half again — and the fork
     * measures 45.0%.
     */
    const doorIn = mean(entryRungs(CONTRACT_CAREERS))
    const theirs = mean(entryRungs(CADRE_CAREERS))
    expect(doorIn).toBeGreaterThan(theirs * 1.4)
    // …and not so far ahead that the short road is pointless.
    expect(doorIn).toBeLessThan(theirs * 1.9)
  })

  it('makes the contract shelf the widest thing on the board', () => {
    // €24,500 to €148,000 — an hourly lecturer invoicing eight months in
    // arrears at one end, a private laboratory's director of research at the
    // other. This is what a French doctorate actually opens, and its width is
    // most of what a player is buying with five years.
    expect(band(CONTRACT_CAREERS)).toBeGreaterThan(band(CADRE_CAREERS))
    expect(ceilingOf(CONTRACT_CAREERS)).toBeGreaterThan(ceilingOf(CADRE_CAREERS))
  })

  it('gives the contract shelf the grimmest rung on the board', () => {
    // The hourly lecturer, paid by the class at three universities. One of the
    // two winces this edition owes the people it is written for.
    expect(floorOf(CONTRACT_CAREERS)).toBeLessThan(floorOf(CADRE_CAREERS) * 0.8)
  })

  // -------------------------------------------------------------------------
  // The fonctionnaire shelf — and the argument with the Japan board
  // -------------------------------------------------------------------------

  it('gives the fonctionnaire shelf the highest floor of any shelf', () => {
    // Nobody who clears the concours ever scrapes by. €68,000 against the
    // cadre shelf's €35,000 and the contract shelf's €24,500.
    expect(floorOf(FONCTIONNAIRE_CAREERS)).toBeGreaterThan(floorOf(CADRE_CAREERS))
    expect(floorOf(FONCTIONNAIRE_CAREERS)).toBeGreaterThan(floorOf(CONTRACT_CAREERS))
    // …and it is worth sitting for: the door-in post pays more than the
    // average door the contract shelf deals, so the gate is a raise on
    // average rather than a fine.
    expect(floorOf(FONCTIONNAIRE_CAREERS)).toBeGreaterThan(mean(entryRungs(CONTRACT_CAREERS)))
  })

  it('gives it the lowest ceiling of any shelf — beaten by every cadre second rung', () => {
    /*
     * **The France board's whole argument, as one comparison**, and the exact
     * inverse of the Researcher: Japan board's, whose permanent shelf has a
     * floor *above* the industry shelf's ceiling.
     *
     * Here the best-paid post the state can appoint you to pays €80,000, and
     * every single second rung of the road the player could have taken at
     * eighteen — €82,000 to €94,500 — already beats it. That is what the
     * concours costs, and it is charged monthly for thirty years.
     */
    const best = ceilingOf(FONCTIONNAIRE_CAREERS)
    const cadreSecondRungs = secondRungs(CADRE_CAREERS)
    expect(cadreSecondRungs.length).toBeGreaterThanOrEqual(6)
    for (const rung of cadreSecondRungs) {
      expect(rung.salary, rung.title).toBeGreaterThan(best)
    }
    expect(best).toBeLessThan(ceilingOf(CADRE_CAREERS))
    expect(best).toBeLessThan(ceilingOf(CONTRACT_CAREERS))
  })

  it('keeps the fonctionnaire band narrow — the tightest work in the game', () => {
    // €68,000 to €80,000. A whole career inside twelve thousand euros, which
    // is what `balance.test.ts` measures as the tightest finishing spread of
    // the three shelves.
    expect(band(FONCTIONNAIRE_CAREERS)).toBeLessThan(band(CADRE_CAREERS) / 5)
    expect(band(FONCTIONNAIRE_CAREERS)).toBeLessThan(band(CONTRACT_CAREERS) / 5)
  })

  it('makes every rung of the fonctionnaire shelf, and only those, safe from a layoff', () => {
    // The mechanical payoff of the gated road, and the *only* thing it buys.
    for (const career of FONCTIONNAIRE_CAREERS) expect(career.cannotBeLaidOff).toBe(true)
    for (const career of [...CADRE_CAREERS, ...CONTRACT_CAREERS]) {
      expect(career.cannotBeLaidOff).toBeUndefined()
    }
  })

  it('pays the fonctionnaire shelf a grade, never a die', () => {
    // Whatever else a permanent state post is, it is not soft money.
    for (const career of FONCTIONNAIRE_CAREERS) expect(career.payPerPip).toBeUndefined()
  })

  it('raises the fonctionnaire shelf at nearly twice everybody else\'s rate', () => {
    /*
     * The half of the French bargain that is easy to miss, expressed in a
     * field the engine already had. A civil servant advances by seniority
     * whether or not anything happens: the step comes round, the grade moves
     * up, nobody has to ask. So the shelf with the lowest ceiling in the game
     * climbs toward it automatically, at about nine per cent a step against
     * everybody else's five, which over the back half of a board is real
     * money and is most of why the road is worth walking at all.
     */
    for (const career of FONCTIONNAIRE_CAREERS) {
      expect(career.raiseStep / career.salary, career.title).toBeGreaterThan(0.085)
    }
    for (const career of [...CADRE_CAREERS, ...CONTRACT_CAREERS]) {
      expect(career.raiseStep / career.salary, career.title).toBeLessThan(0.065)
    }
  })

  // -------------------------------------------------------------------------
  // One long-odds roll on the whole board, and it is not in here
  // -------------------------------------------------------------------------

  it('never asks for more than a four to climb — the concours is the only long roll', () => {
    /*
     * This board's shape in one assertion. All of a French research life's
     * risk is compressed into a single entrance competition in the player's
     * early thirties (see `route.ts`, where the gate rolls at five), and
     * *nothing else on the board* is a long shot. The cadre climbs on time
     * served; the contract world climbs when the next post is advertised; and
     * once the concours is behind you the career has no competitive step left
     * in it at all, which is precisely what it was for.
     *
     * The Japan board is the other way round: its climb is a lottery and its
     * gate is a certainty.
     */
    for (const career of EVERY_CAREER) {
      if (career.promotionSpin === undefined) continue
      expect(career.promotionSpin, career.title).toBeLessThanOrEqual(4)
    }
    for (const career of CADRE_CAREERS.filter((c) => c.promotesTo)) expect(career.promotionSpin).toBe(3)
    for (const career of CONTRACT_CAREERS.filter((c) => c.promotesTo)) expect(career.promotionSpin).toBe(4)
    for (const career of FONCTIONNAIRE_CAREERS.filter((c) => c.promotesTo)) expect(career.promotionSpin).toBe(3)
  })

  it('runs the two open shelves three rungs tall and the gated one two', () => {
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
    expect(tallest(CADRE_CAREERS)).toBe(3)
    expect(tallest(CONTRACT_CAREERS)).toBe(3)
    expect(tallest(FONCTIONNAIRE_CAREERS)).toBe(2)
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

  it('puts the soft money where the money is somebody else\'s decision', () => {
    // The hours invoiced in arrears, the contract that ends, the round that
    // has not closed, the mission that was not sold. The contract shelf lives
    // on it; the cadre shelf has exactly two ladders that do.
    expect(unsteady(CONTRACT_CAREERS).length).toBeGreaterThan(unsteady(CADRE_CAREERS).length * 2)
    expect(unsteady(CONTRACT_CAREERS).length).toBeLessThan(CONTRACT_CAREERS.length)
    expect(unsteady(CADRE_CAREERS).length).toBeGreaterThan(0)
  })

  it('keeps the clinic salaried all the way up, which is its own bitter joke', () => {
    for (const id of [
      'career-frr-clinical-fellow',
      'career-frr-trial-physician',
      'career-frr-trial-centre-director',
    ]) {
      expect(findCareer(id, EDITION_RESEARCHER_FRANCE)?.payPerPip).toBeUndefined()
    }
  })

  it('pays by the die exactly where the pay really is by the piece', () => {
    for (const id of [
      'career-frr-hourly-lecturer',
      'career-frr-postdoc',
      'career-frr-station-assistant',
      'career-frr-science-journalist',
    ]) {
      expect(findCareer(id, EDITION_RESEARCHER_FRANCE)?.payPerPip).toBeGreaterThan(0)
    }
  })

  // -------------------------------------------------------------------------
  // The ordinary catalogue rules every edition keeps
  // -------------------------------------------------------------------------

  it('keeps a calling on both of the shelves a fair can deal from', () => {
    const callings = EVERY_CAREER.filter((career) => career.isCalling)
    expect(callings.length).toBeGreaterThanOrEqual(4)
    for (const calling of callings) expect(calling.promotesTo).toBeUndefined()
    expect(CADRE_CAREERS.some((career) => career.isCalling)).toBe(true)
    expect(CONTRACT_CAREERS.some((career) => career.isCalling)).toBe(true)
    // …and none behind the gate, whose whole promise is the certainty. A
    // calling read as a choice belongs on a shelf a fair can actually deal.
    expect(FONCTIONNAIRE_CAREERS.some((career) => career.isCalling)).toBe(false)
  })

  it('never hires anybody straight onto a fortune', () => {
    for (const career of [...entryRungs(CADRE_CAREERS), ...entryRungs(CONTRACT_CAREERS)]) {
      expect(career.salary).toBeGreaterThanOrEqual(20_000)
      expect(career.salary).toBeLessThanOrEqual(110_000)
    }
  })

  it('points every promotesTo at a rung that exists on the same shelf', () => {
    for (const pool of [CADRE_CAREERS, CONTRACT_CAREERS, FONCTIONNAIRE_CAREERS]) {
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
