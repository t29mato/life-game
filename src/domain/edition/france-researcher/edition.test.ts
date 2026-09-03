import { describe, expect, it } from 'vitest'

import type { SpaceContent } from '../../board/route'
import type { Player, SpaceEffect } from '../../model/types'
import { spacesOf } from '../../board/route'
import { validateRoute } from '../../board/validateRoute'
import { CAREER_FAMILY, isCareerIcon } from '../../rules/careerFamily'
import { TRADE_YEAR_STORIES } from '../../rules/tradeYear'
import { careerTierOf, tradeYearStoriesFor } from '../lookup'
import { editionFor } from '../registry'
import { EDITION_USA } from '../usa'
import { EDITION_FRANCE } from '../france'
import { EDITION_RESEARCHER_JAPAN } from '../japan-researcher'
import { EDITION_RESEARCHER_FRANCE } from './index'

/**
 * The Researcher: France edition's founding bargain, asserted so it cannot
 * drift — and, in the last block, the thing this board exists to prove.
 *
 * A country board promises to be the USA board mechanically, tile for tile,
 * at its own currency's scale. A researcher board promises to be the USA
 * board *except where it means to differ*, and the difference is the whole
 * product. So the mirror below is run with an explicit list of divergences:
 * two tiles and one economy figure, each named, each with a reason. Anything
 * that drifts off the skeleton without being on that list fails here, loudly.
 *
 * And then, because two researcher boards that played the same would make the
 * country axis decoration, the final block holds this board *against its
 * sibling* and asserts the four places they say opposite things.
 */

const DIVERGENCES: Readonly<Record<string, string>> = {
  // The doctorate moves to the opening lane, because in this life the fork at
  // eighteen *is* the doctorate. That frees the gated road to be gated on it.
  'frr-uni-defence': 'mirrors college-9 (an empty buffer tile); awards the doctorate instead',
  // The gated lane's fifth tile was the defence on that board and cannot be
  // here, so it is the thing that actually decides a French research career:
  // the first sitting of the concours, a gate rather than a fair.
  'frr-conc-first-sitting': 'mirrors grad-5 (the doctorate); sits the concours instead',
}

/** A seat with nothing on it, for the questions that are only about schooling. */
const BLANK_PLAYER: Player = {
  id: 'p1',
  name: 'Alex',
  color: 'red',
  spaceId: 'frr-start',
  money: 0,
  loans: 0,
  career: null,
  hasDegree: false,
  hasDoctorate: false,
  isMarried: false,
  children: 0,
  house: null,
  lifeTiles: [],
  stocks: [],
  insurance: [],
  isCpu: false,
  isRetired: false,
  retirementRank: null,
}

/** The two tiles that carry a bar rather than a hall of booths. */
const GATES = ['frr-conc-first-sitting', 'frr-conc-second-sitting']

describe('the researcher france edition is registered and sound', () => {
  it('resolves by its own id and is on the shelf', () => {
    expect(editionFor('france-researcher')).toBe(EDITION_RESEARCHER_FRANCE)
    expect(EDITION_RESEARCHER_FRANCE.name).toContain('Researcher')
    expect(EDITION_RESEARCHER_FRANCE.name).toContain('France')
  })

  it('leaves all five country editions, and the Japan researcher board, exactly where they were', () => {
    // The owner's constraint, asserted rather than promised: this edition is
    // strictly additive, and in particular it is not the country France board
    // wearing a lab coat.
    for (const id of ['usa', 'japan', 'france', 'india', 'bolivia', 'japan-researcher']) {
      expect(editionFor(id).id).toBe(id)
    }
    expect(editionFor('france')).toBe(EDITION_FRANCE)
    expect(EDITION_FRANCE.route).not.toBe(EDITION_RESEARCHER_FRANCE.route)
    expect(EDITION_FRANCE.careers.doctorate).toBeUndefined()
  })

  it('builds a legal board at every difficulty', () => {
    expect(validateRoute(EDITION_RESEARCHER_FRANCE.route, EDITION_RESEARCHER_FRANCE)).toEqual([])
  })

  /*
   * **Higher education is the premise here, not one of the roads** — and this
   * is the board where that is hardest to argue with, because the prestigious
   * side of the fork is the one that never saw a laboratory: preparatory
   * class, a national competition, an engineering school, a contract signed
   * before the diploma. The route says "it is not 'no degree'" in as many
   * words, and the engine used to contradict it on every pawn.
   *
   * `degreeOpens: 'basic'` is what keeps the Industry Fair honest. It caps at
   * the contract shelf so that no career fair in this country can hand out a
   * permanent state post; with a degree opening the contract shelf by itself,
   * the same tile would start offering a laid-off engineering cadre work as
   * an hourly lecturer paid by the class.
   */
  it('takes higher education as read, and keeps the contract shelf a doctor\'s', () => {
    expect(EDITION_RESEARCHER_FRANCE.schooling).toEqual({
      everyoneGraduates: true,
      degreeOpens: 'basic',
    })
    const seat = (over: Partial<Player>): Player => ({ ...BLANK_PLAYER, ...over })
    expect(careerTierOf(seat({ hasDegree: true }), EDITION_RESEARCHER_FRANCE)).toBe('basic')
    expect(
      careerTierOf(seat({ hasDegree: true, hasDoctorate: true }), EDITION_RESEARCHER_FRANCE),
    ).toBe('doctorate')
  })

  it('says the same thing as the other researcher board, in the same field', () => {
    // The premise belongs to the axis, not to one country on it.
    expect(EDITION_RESEARCHER_FRANCE.schooling).toEqual(EDITION_RESEARCHER_JAPAN.schooling)
  })
})

describe('the researcher france economy is the tuned economy at ×1, bar one die', () => {
  const usa = EDITION_USA.economy
  const here = EDITION_RESEARCHER_FRANCE.economy

  it('keeps every flat sum at the dollar board\'s figure, in euros', () => {
    expect(here.startingMoney).toBe(usa.startingMoney)
    expect(here.loanPrincipal).toBe(usa.loanPrincipal)
    expect(here.weddingGift).toBe(usa.weddingGift)
    expect(here.divorceSettlement).toBe(usa.divorceSettlement)
    expect(here.firstRetirementBonus).toBe(usa.firstRetirementBonus)
    expect(here.casualWagePerPip).toBe(usa.casualWagePerPip)
    expect(here.lifeInsuranceMaturity).toEqual(usa.lifeInsuranceMaturity)
    expect(here.fireNumber).toBe(usa.fireNumber)
    expect(here.firePayoutPerPip).toBe(usa.firePayoutPerPip)
    expect(here.bigMoney).toBe(usa.bigMoney)
    expect(here.loanRepayment).toEqual(usa.loanRepayment)
    expect(here.earlyLoanRepayment).toEqual(usa.earlyLoanRepayment)
    expect(here.insurancePremium).toEqual(usa.insurancePremium)
    expect(here.household).toEqual(usa.household)
    expect(here.childOutcome).toEqual(usa.childOutcome)
  })

  it('marries on the same wheel, at the same stakes, in its own words', () => {
    expect(here.marriage.proposalSpin).toBe(usa.marriage.proposalSpin)
    expect(here.marriage.secondAskSpin).toBe(usa.marriage.secondAskSpin)
    expect(here.marriage.outcomes).toHaveLength(usa.marriage.outcomes.length)
    const pairs = [
      [here.marriage.rescued, usa.marriage.rescued] as const,
      ...here.marriage.outcomes.map((bandOf, i) => [bandOf, usa.marriage.outcomes[i]!] as const),
    ]
    for (const [mine, theirs] of pairs) {
      expect(mine.upTo).toBe(theirs.upTo)
      expect(mine.giftMultiplier).toBe(theirs.giftMultiplier)
      expect(mine.cost).toBe(theirs.cost)
      expect(mine.windfall).toBe(theirs.windfall)
      expect(mine.note).not.toBe(theirs.note)
    }
  })

  it('sends the mobility bill unchanged, and a thesis die that can pay', () => {
    /*
     * The one deliberate economic divergence, and `economy.ts` argues it at
     * length. The gated road's bill is a real bill and keeps the measured
     * figures exactly. The opening lane's is not a bill at all — it is the
     * thesis years, which in France are usually funded and once in six are
     * done inside a company on a salary.
     */
    expect(here.doctorateTuition!.outcomes).toHaveLength(usa.doctorateTuition!.outcomes.length)
    here.doctorateTuition!.outcomes.forEach((bandOf, i) => {
      const theirs = usa.doctorateTuition!.outcomes[i]!
      expect(bandOf.upTo).toBe(theirs.upTo)
      expect(bandOf.cost).toBe(theirs.cost)
      expect(bandOf.note).not.toBe(theirs.note)
    })

    const meanOf = (outcomes: readonly { upTo: number; cost: number }[]): number => {
      let previous = 0
      let total = 0
      for (const bandOf of outcomes) {
        total += bandOf.cost * (bandOf.upTo - previous)
        previous = bandOf.upTo
      }
      return total / 6
    }
    expect(meanOf(here.tuition.outcomes)).toBeLessThan(meanOf(usa.tuition.outcomes) * 0.25)
    // …and it is still a real bill at the bad end: an unfunded thesis hurts.
    expect(Math.max(...here.tuition.outcomes.map((bandOf) => bandOf.cost))).toBeGreaterThan(20_000)
  })

  it('puts money in the player\'s pocket on exactly one face, and nowhere else in the game', () => {
    /*
     * **CIFRE**, and the reason `TuitionOutcome.cost` learned about negative
     * numbers. It is the only paying face of a tuition die anywhere in this
     * repository, and it is asserted in both directions so that neither the
     * face nor its uniqueness can be lost by accident.
     */
    const paying = here.tuition.outcomes.filter((bandOf) => bandOf.cost < 0)
    expect(paying).toHaveLength(1)
    expect(paying[0]!.upTo).toBe(6)
    expect(paying[0]!.cost).toBeLessThan(-10_000)
    expect(here.doctorateTuition!.outcomes.every((bandOf) => bandOf.cost > 0)).toBe(true)
    for (const edition of [EDITION_USA, EDITION_FRANCE, EDITION_RESEARCHER_JAPAN]) {
      const bands = [
        ...edition.economy.tuition.outcomes,
        ...(edition.economy.doctorateTuition?.outcomes ?? []),
      ]
      expect(bands.every((bandOf) => bandOf.cost >= 0), edition.id).toBe(true)
    }
  })

  it('counts in the same euros, rounded the same way, as the country board', () => {
    expect(EDITION_RESEARCHER_FRANCE.currency).toEqual(EDITION_FRANCE.currency)
  })
})

describe('the researcher france route is the measured skeleton, bar the tiles it argues about', () => {
  const usaSpaces = spacesOf(EDITION_USA.route)
  const mine = spacesOf(EDITION_RESEARCHER_FRANCE.route)

  /** The sums an effect can carry, for the ×1 comparison. */
  const sumsOf = (effect: SpaceEffect): readonly number[] => {
    switch (effect.type) {
      case 'gainMoney':
      case 'payMoney':
      case 'payEach':
      case 'collectFromEach':
      case 'payPerChild':
      case 'collectPerChild':
        return [effect.amount]
      case 'spinForMoney':
        return [effect.perPip]
      case 'stockDividend':
        return [effect.perShare]
      case 'haveChildren':
        return [effect.celebrationPerPip]
      default:
        return []
    }
  }

  it('walks the same shape: segment for segment, tile for tile', () => {
    expect(EDITION_RESEARCHER_FRANCE.route.segments.map((s) => s.kind)).toEqual(
      EDITION_USA.route.segments.map((s) => s.kind),
    )
    expect(mine).toHaveLength(usaSpaces.length)
  })

  it('mirrors every tile mechanically at ×1, except the two it names', () => {
    mine.forEach((tile, i) => {
      const theirs = usaSpaces[i]!
      const at = `${tile.id} (mirrors ${theirs.id})`
      const diverges = tile.id in DIVERGENCES

      expect(tile.appearsFrom, at).toBe(theirs.appearsFrom)
      expect(tile.unscaled, at).toBe(theirs.unscaled)
      expect(tile.amountFrom, at).toBe(theirs.amountFrom)
      expect(sumsOf(tile.effect), at).toEqual(sumsOf(theirs.effect))

      if (!diverges) {
        expect(tile.kind, at).toBe(theirs.kind)
        expect(tile.effect.type, at).toBe(theirs.effect.type)
        const compulsoryOf = (space: SpaceContent) =>
          'compulsory' in space.effect ? space.effect.compulsory : undefined
        expect(compulsoryOf(tile), at).toBe(compulsoryOf(theirs))
      }

      const hazardOf = (space: SpaceContent) => ('hazard' in space.effect ? space.effect.hazard : undefined)
      expect(hazardOf(tile), at).toBe(hazardOf(theirs))

      expect(tile.harsher === undefined, at).toBe(theirs.harsher === undefined)
      if (tile.harsher && theirs.harsher) {
        expect(tile.harsher.from, at).toBe(theirs.harsher.from)
        expect(tile.harsher.kind, at).toBe(theirs.harsher.kind)
        expect(tile.harsher.effect.type, at).toBe(theirs.harsher.effect.type)
        expect(sumsOf(tile.harsher.effect), at).toEqual(sumsOf(theirs.harsher.effect))
      }
    })
  })

  it('lists every divergence, and every listed divergence is real', () => {
    // Both directions: a tile that drifts off the skeleton without being on
    // the list is a mistake, and an entry on the list for a tile that no
    // longer diverges is a comment that has gone stale.
    const drifted = mine
      .map((tile, i) => [tile, usaSpaces[i]!] as const)
      .filter(([tile, theirs]) => tile.kind !== theirs.kind || tile.effect.type !== theirs.effect.type)
      .map(([tile]) => tile.id)
    expect(drifted.sort()).toEqual(Object.keys(DIVERGENCES).sort())
  })

  it('awards the doctorate on the opening lane, so the gated road can ask for it', () => {
    const opening = EDITION_RESEARCHER_FRANCE.route.segments[0]!
    expect(opening.kind).toBe('fork')
    const universityLane = opening.kind === 'fork' ? opening.branches[0] : null
    expect(universityLane!.identity.name).toBe('The University')
    const effects = universityLane!.spaces.map((space) => space.effect.type)
    expect(effects.indexOf('graduate')).toBeGreaterThan(-1)
    expect(effects.indexOf('doctorate')).toBe(effects.indexOf('graduate') + 1)
    // Both fire for everybody who walks the lane, not only whoever lands
    // exactly: an ordinary tile here would make the gated road a promise the
    // board keeps to some players and not others.
    for (const type of ['graduate', 'doctorate'] as const) {
      const tile = universityLane!.spaces.find((space) => space.effect.type === type)!
      expect(['event', 'stop']).toContain(tile.kind)
    }
  })

  it('gates the concours road on the doctorate itself, and leaves the road opposite open', () => {
    const gate = EDITION_RESEARCHER_FRANCE.route.segments[4]!
    expect(gate.kind).toBe('fork')
    const [concours, engineers] = gate.kind === 'fork' ? gate.branches : []
    expect(concours!.identity.name).toBe('The Concours')
    expect(concours!.identity.requires).toBe('doctorate')
    expect(engineers!.identity.requires).toBeUndefined()
    // No payday anywhere on it: the years not earning are the road's price,
    // and a wage packet in the middle would quietly refund it.
    expect(concours!.spaces.filter((space) => space.kind === 'payday')).toEqual([])
  })

  it('sits the competition exactly twice, and that is the attempt limit', () => {
    /*
     * **The France mechanic**, asserted as board geometry because that is
     * what it is: there is no counter and no new player state, only a lane
     * with two gate tiles on it and nothing after them. Miss both and the
     * road runs out one tile in front of a layoff notice and two in front of
     * the fair.
     */
    const gate = EDITION_RESEARCHER_FRANCE.route.segments[4]!
    const concours = gate.kind === 'fork' ? gate.branches[0] : null
    const sittings = concours!.spaces.filter(
      (space) => space.effect.type === 'careerChange' && space.effect.passSpin !== undefined,
    )
    expect(sittings.map((space) => space.id)).toEqual(GATES)
    for (const sitting of sittings) {
      expect(sitting.effect.type === 'careerChange' && sitting.effect.passSpin).toBe(5)
      // Compulsory, because a gate nobody sat is not a gate — and because
      // `validateRoute` will not accept an `event` careerChange that is not.
      expect(sitting.effect.type === 'careerChange' && sitting.effect.compulsory).toBe(true)
      // Dealing the fonctionnaire shelf, which nothing else on the board deals.
      expect(sitting.effect.type === 'careerChange' && sitting.effect.pool).toBe('doctorate')
    }
    // The last two tiles of the lane are the two sittings, so there is
    // nothing after the second one to soften it.
    expect(concours!.spaces.slice(-2).map((space) => space.id)).toEqual(GATES)
  })

  it('lets no career fair anywhere hand out a permanent state post', () => {
    /*
     * The other half of the same rule, and the reason the gate means
     * anything. Every tile on this board that deals a career names the shelf
     * it deals from, and only the two sittings name the fonctionnaire shelf.
     * Without this a doctorate holder would be offered a permanent post at
     * the very fair that represents having given up on getting one.
     */
    const dealers = mine.filter(
      (space) => space.effect.type === 'careerChange' || space.effect.type === 'chooseCareer',
    )
    expect(dealers.length).toBeGreaterThanOrEqual(5)
    for (const space of dealers) {
      const pool = 'pool' in space.effect ? space.effect.pool : undefined
      expect(pool, space.id).toBeDefined()
      if (pool === 'doctorate') expect(GATES).toContain(space.id)
    }
  })

  it('never charges a mover their climb — the diploma travels and the years count', () => {
    /*
     * The single field that tells the two labour markets apart. The
     * Researcher: Japan board writes `startsOver` on two tiles, because a
     * hiring calendar built around taking a cohort in at twenty-three has no
     * column for eleven years of contracts. France's has one: a doctorate is
     * a recognised diploma, the years are counted into the grade, and a
     * concours reckons seniority when it appoints. So the field appears
     * nowhere on this board, and it appears on the sibling's — asserted here
     * in both directions so that neither fact can quietly change.
     */
    for (const space of mine) {
      if (space.effect.type !== 'careerChange') continue
      expect(space.effect.startsOver, space.id).toBeUndefined()
    }
    const japan = spacesOf(EDITION_RESEARCHER_JAPAN.route).filter(
      (space) => space.effect.type === 'careerChange' && space.effect.startsOver === true,
    )
    expect(japan.length).toBe(2)
  })

  it('says everything in its own words — no USA or country-France copy leaks through', () => {
    const elsewhere = new Set([
      ...usaSpaces.map((space) => space.description),
      ...spacesOf(EDITION_FRANCE.route).map((space) => space.description),
      ...spacesOf(EDITION_RESEARCHER_JAPAN.route).map((space) => space.description),
    ])
    expect(mine.filter((space) => elsewhere.has(space.description)).map((s) => s.id)).toEqual([])
  })

  it('carries full catalogues of its own, including a third shelf', () => {
    expect(EDITION_RESEARCHER_FRANCE.houses).toHaveLength(9)
    expect(EDITION_RESEARCHER_FRANCE.lifeTiles).toHaveLength(36)
    expect(EDITION_RESEARCHER_FRANCE.stocks).toHaveLength(5)
    expect(EDITION_RESEARCHER_FRANCE.careers.doctorate?.length).toBeGreaterThan(0)
  })
})

describe('the trade-year override', () => {
  it('writes its own vignettes for every family this board can actually deal', () => {
    const families = new Set(
      [
        ...EDITION_RESEARCHER_FRANCE.careers.basic,
        ...EDITION_RESEARCHER_FRANCE.careers.graduate,
        ...(EDITION_RESEARCHER_FRANCE.careers.doctorate ?? []),
      ]
        .filter((career) => isCareerIcon(career.icon))
        .map((career) => CAREER_FAMILY[career.icon as Parameters<typeof isCareerIcon>[0] & keyof typeof CAREER_FAMILY]),
    )
    for (const family of families) {
      const stories = tradeYearStoriesFor(EDITION_RESEARCHER_FRANCE, family)
      expect(stories, family).not.toBe(TRADE_YEAR_STORIES[family])
      expect(stories).toHaveLength(6)
      for (const line of stories) expect(line.length).toBeGreaterThan(40)
    }
  })

  it('is its own table, not the Japan researcher board\'s', () => {
    for (const family of ['science', 'field', 'care', 'office'] as const) {
      expect(tradeYearStoriesFor(EDITION_RESEARCHER_FRANCE, family)).not.toEqual(
        tradeYearStoriesFor(EDITION_RESEARCHER_JAPAN, family),
      )
    }
  })

  it('leaves every other edition reading the engine-global table', () => {
    for (const edition of [EDITION_USA, EDITION_FRANCE]) {
      expect(tradeYearStoriesFor(edition, 'science')).toBe(TRADE_YEAR_STORIES.science)
    }
  })

  it('does not write a family this board has no work in', () => {
    // There is no sporting career on this board to have a season, so `pitch`
    // falls back — the fallback doing its job rather than a gap.
    expect(tradeYearStoriesFor(EDITION_RESEARCHER_FRANCE, 'pitch')).toBe(TRADE_YEAR_STORIES.pitch)
  })
})

describe('the two researcher boards genuinely play differently', () => {
  /*
   * The country axis has to earn its place, and §8 of the concept document
   * sets the bar: a difference that is only prose is the thin
   * differentiation the five country boards already have, rebuilt at higher
   * cost. Every assertion in this block is about what a player *does or
   * risks*, and every one of them points the opposite way on the two boards.
   */
  const france = EDITION_RESEARCHER_FRANCE
  const japan = EDITION_RESEARCHER_JAPAN

  const floorOf = (careers: readonly { readonly salary: number }[]) =>
    Math.min(...careers.map((c) => c.salary))
  const ceilingOf = (careers: readonly { readonly salary: number }[]) =>
    Math.max(...careers.map((c) => c.salary))

  it('puts the gated shelf below industry here and above it there', () => {
    // Japan: the permanent shelf's floor stands above the industry shelf's
    // ceiling — clearing the gate buys safety *and* a raise.
    expect(floorOf(japan.careers.doctorate!)).toBeGreaterThan(ceilingOf(japan.careers.basic))
    // France: the fonctionnaire shelf's ceiling sits below the cadre shelf's,
    // and well below it — clearing the gate buys safety and nothing else.
    expect(ceilingOf(france.careers.doctorate!)).toBeLessThan(ceilingOf(france.careers.basic) * 0.7)
  })

  it('makes the climb the lottery there and the gate the lottery here', () => {
    // Japan's academia shelf climbs at five and six: promotion is the long
    // shot, and the end of the gated road is a certainty.
    const japanAcademia = japan.careers.graduate.filter((c) => c.promotesTo)
    expect(japanAcademia.every((c) => (c.promotionSpin ?? 0) >= 5)).toBe(true)
    const japanCliff = spacesOf(japan.route).find((s) => s.id === 'jpr-ladder-cliff')!
    expect(japanCliff.effect.type === 'careerChange' && japanCliff.effect.passSpin).toBeUndefined()

    // France: nothing climbs above a four, and the two gate tiles are the
    // only rolls on the board that can hand back nothing at all.
    const frenchLadders = [...france.careers.basic, ...france.careers.graduate, ...france.careers.doctorate!]
    expect(frenchLadders.every((c) => (c.promotionSpin ?? 0) <= 4)).toBe(true)
    const frenchGates = spacesOf(france.route).filter(
      (s) => s.effect.type === 'careerChange' && s.effect.passSpin !== undefined,
    )
    expect(frenchGates).toHaveLength(2)
  })

  it('charges leaving there and not here', () => {
    const chargedIn = (edition: typeof france): number =>
      spacesOf(edition.route).filter(
        (s) => s.effect.type === 'careerChange' && s.effect.startsOver === true,
      ).length
    expect(chargedIn(japan)).toBe(2)
    expect(chargedIn(france)).toBe(0)
  })

  it('can pay the student here and never there', () => {
    const paysOn = (edition: typeof france): number =>
      edition.economy.tuition.outcomes.filter((b) => b.cost < 0).length
    expect(paysOn(france)).toBe(1)
    expect(paysOn(japan)).toBe(0)
  })
})
