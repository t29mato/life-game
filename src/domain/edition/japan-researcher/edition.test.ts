import { describe, expect, it } from 'vitest'

import type { SpaceContent } from '../../board/route'
import type { SpaceEffect } from '../../model/types'
import { spacesOf } from '../../board/route'
import { validateRoute } from '../../board/validateRoute'
import { CAREER_FAMILY, isCareerIcon } from '../../rules/careerFamily'
import { TRADE_YEAR_STORIES } from '../../rules/tradeYear'
import { tradeYearStoriesFor } from '../lookup'
import { editionFor } from '../registry'
import { EDITION_USA } from '../usa'
import { EDITION_JAPAN } from '../japan'
import { EDITION_RESEARCHER_JAPAN } from './index'

/**
 * The Researcher: Japan edition's founding bargain, asserted so it cannot
 * drift — and it is a *different* bargain from the four country editions'.
 *
 * A country board promises to be the USA board mechanically, tile for tile, at
 * its own currency's scale. This board promises to be the USA board *except
 * where it means to differ*, and the difference is the whole product. So the
 * mirror below is run with an explicit list of divergences: four tiles and one
 * economy figure, each named, each with a reason. Anything that drifts off the
 * skeleton without being on that list fails here, loudly, which is what stops a
 * well-meaning edit unpicking two years of measured balance.
 */

const FACTOR = 100

/**
 * The tiles this board is allowed to differ on, and nothing else.
 *
 * Each entry names the USA tile it mirrors and says what it does instead. The
 * long-form arguments are on the tiles themselves in `route.ts`; these are the
 * one-line versions, and the list existing at all is the point — a divergence
 * has to be argued for and written down before it is allowed.
 */
const DIVERGENCES: Readonly<Record<string, string>> = {
  // The doctorate moves to the opening lane, because in this life the fork at
  // eighteen *is* the doctorate. That frees the gated road to be gated on it.
  'jpr-doc-defence': 'mirrors college-9 (an empty buffer tile); awards the doctorate instead',
  // The gated lane's fifth tile was the defence on that board and cannot be
  // here, so it is the thing that actually happens halfway up a fixed-term
  // career: a nationally advertised post, long odds, fail-soft.
  'jpr-ladder-open-call': 'mirrors grad-5 (the doctorate); rolls an open call for promotion instead',
}

/** Tiles that keep the mirrored effect and add a rule to it. See `SpaceEffect`. */
const HIRING_RULES: Readonly<Record<string, string>> = {
  'jpr-leave-move': 'mirrors hopper-move; deals the industry shelf at the door-in rung',
  'jpr-after-fair': 'mirrors main-career-fair; deals the industry shelf at the door-in rung',
}

describe('the researcher japan edition is registered and sound', () => {
  it('resolves by its own id and is on the shelf', () => {
    expect(editionFor('japan-researcher')).toBe(EDITION_RESEARCHER_JAPAN)
    expect(EDITION_RESEARCHER_JAPAN.name).toContain('Researcher')
  })

  it('leaves all five country editions exactly where they were', () => {
    // The owner's constraint, asserted rather than promised: this edition is
    // strictly additive, and in particular it is not the country Japan board
    // wearing a lab coat.
    for (const id of ['usa', 'japan', 'france', 'india', 'bolivia']) {
      expect(editionFor(id).id).toBe(id)
    }
    expect(editionFor('japan')).toBe(EDITION_JAPAN)
    expect(EDITION_JAPAN.route).not.toBe(EDITION_RESEARCHER_JAPAN.route)
    expect(EDITION_JAPAN.careers.doctorate).toBeUndefined()
  })

  it('builds a legal board at every difficulty', () => {
    expect(validateRoute(EDITION_RESEARCHER_JAPAN.route, EDITION_RESEARCHER_JAPAN)).toEqual([])
  })
})

describe('the researcher japan economy is the tuned economy at ×100, bar one figure', () => {
  const usa = EDITION_USA.economy
  const here = EDITION_RESEARCHER_JAPAN.economy

  it('scales every flat sum', () => {
    expect(here.startingMoney).toBe(usa.startingMoney * FACTOR)
    expect(here.loanPrincipal).toBe(usa.loanPrincipal * FACTOR)
    expect(here.weddingGift).toBe(usa.weddingGift * FACTOR)
    expect(here.divorceSettlement).toBe(usa.divorceSettlement * FACTOR)
    expect(here.firstRetirementBonus).toBe(usa.firstRetirementBonus * FACTOR)
    expect(here.casualWagePerPip).toBe(usa.casualWagePerPip * FACTOR)
    expect(here.lifeInsuranceMaturity).toEqual(usa.lifeInsuranceMaturity.map((rung) => rung * FACTOR))
    expect(here.fireNumber).toBe(usa.fireNumber * FACTOR)
    expect(here.firePayoutPerPip).toBe(usa.firePayoutPerPip * FACTOR)
    expect(here.bigMoney).toBe(usa.bigMoney * FACTOR)
  })

  it('scales the difficulty rates and premiums', () => {
    for (const difficulty of ['normal', 'hard', 'veryHard'] as const) {
      expect(here.loanRepayment[difficulty]).toBe(usa.loanRepayment[difficulty] * FACTOR)
      expect(here.earlyLoanRepayment[difficulty]).toBe(usa.earlyLoanRepayment[difficulty] * FACTOR)
    }
    for (const kind of ['home', 'auto', 'life'] as const) {
      expect(here.insurancePremium[kind]).toBe(usa.insurancePremium[kind] * FACTOR)
    }
  })

  it('keeps the counts as counts and scales only the sums', () => {
    expect(here.household).toEqual(usa.household)
    expect(here.childOutcome.perPipOfPayday).toBe(usa.childOutcome.perPipOfPayday)
    expect(here.childOutcome.starSpin).toBe(usa.childOutcome.starSpin)
    expect(here.childOutcome.starPayout).toBe(usa.childOutcome.starPayout * FACTOR)
  })

  it('marries on the same wheel, at ×100 the stakes, in its own words', () => {
    expect(here.marriage.proposalSpin).toBe(usa.marriage.proposalSpin)
    expect(here.marriage.secondAskSpin).toBe(usa.marriage.secondAskSpin)
    expect(here.marriage.outcomes).toHaveLength(usa.marriage.outcomes.length)
    const pairs = [
      [here.marriage.rescued, usa.marriage.rescued] as const,
      ...here.marriage.outcomes.map((band, i) => [band, usa.marriage.outcomes[i]!] as const),
    ]
    for (const [mine, theirs] of pairs) {
      expect(mine.upTo).toBe(theirs.upTo)
      expect(mine.giftMultiplier).toBe(theirs.giftMultiplier)
      expect(mine.cost).toBe(theirs.cost * FACTOR)
      expect(mine.windfall).toBe(theirs.windfall * FACTOR)
      expect(mine.note).not.toBe(theirs.note)
    }
  })

  it('sends the same laboratory bill at ×100, and a much smaller stipend-years bill', () => {
    /*
     * The one deliberate economic divergence, and `economy.ts` argues it at
     * length: a Japanese doctorate costs years rather than money, and the
     * board already charges the years in full — eight tiles with no payday on
     * them while the other road banks three. Charging the money as well would
     * be charging twice for the same decision.
     *
     * The Fixed-Term Ladder's own bill is a real bill and keeps the measured
     * ×100 figures exactly.
     */
    expect(here.doctorateTuition!.outcomes).toHaveLength(usa.doctorateTuition!.outcomes.length)
    here.doctorateTuition!.outcomes.forEach((band, i) => {
      const theirs = usa.doctorateTuition!.outcomes[i]!
      expect(band.upTo).toBe(theirs.upTo)
      expect(band.cost).toBe(theirs.cost * FACTOR)
      expect(band.note).not.toBe(theirs.note)
    })

    const meanOf = (outcomes: readonly { upTo: number; cost: number }[]): number => {
      let previous = 0
      let total = 0
      for (const band of outcomes) {
        total += band.cost * (band.upTo - previous)
        previous = band.upTo
      }
      return total / 6
    }
    expect(meanOf(here.tuition.outcomes)).toBeLessThan(meanOf(usa.tuition.outcomes) * FACTOR * 0.6)
    // …and it is still a bill, not a gift: the worst band really hurts.
    expect(Math.max(...here.tuition.outcomes.map((band) => band.cost))).toBeGreaterThan(4_000_000)
  })

  it('counts in the same yen, rounded the same way, as the country board', () => {
    expect(EDITION_RESEARCHER_JAPAN.currency).toEqual(EDITION_JAPAN.currency)
  })
})

describe('the researcher japan route is the measured skeleton, bar the tiles it argues about', () => {
  const usaSpaces = spacesOf(EDITION_USA.route)
  const mine = spacesOf(EDITION_RESEARCHER_JAPAN.route)

  /** The sums an effect can carry, for the ×100 comparison. */
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
      default:
        return []
    }
  }

  it('walks the same shape: segment for segment, tile for tile', () => {
    expect(EDITION_RESEARCHER_JAPAN.route.segments.map((s) => s.kind)).toEqual(
      EDITION_USA.route.segments.map((s) => s.kind),
    )
    expect(mine).toHaveLength(usaSpaces.length)
  })

  it('mirrors every tile mechanically at ×100, except the two it names', () => {
    mine.forEach((tile, i) => {
      const theirs = usaSpaces[i]!
      const at = `${tile.id} (mirrors ${theirs.id})`
      const diverges = tile.id in DIVERGENCES

      expect(tile.appearsFrom, at).toBe(theirs.appearsFrom)
      expect(tile.unscaled, at).toBe(theirs.unscaled)
      expect(tile.amountFrom, at).toBe(theirs.amountFrom)
      expect(sumsOf(tile.effect), at).toEqual(sumsOf(theirs.effect).map((sum) => sum * FACTOR))

      if (!diverges) {
        expect(tile.kind, at).toBe(theirs.kind)
        expect(tile.effect.type, at).toBe(theirs.effect.type)
      }

      const hazardOf = (space: SpaceContent) => ('hazard' in space.effect ? space.effect.hazard : undefined)
      expect(hazardOf(tile), at).toBe(hazardOf(theirs))
      const compulsoryOf = (space: SpaceContent) =>
        'compulsory' in space.effect ? space.effect.compulsory : undefined
      expect(compulsoryOf(tile), at).toBe(compulsoryOf(theirs))

      expect(tile.harsher === undefined, at).toBe(theirs.harsher === undefined)
      if (tile.harsher && theirs.harsher) {
        expect(tile.harsher.from, at).toBe(theirs.harsher.from)
        expect(tile.harsher.kind, at).toBe(theirs.harsher.kind)
        expect(tile.harsher.effect.type, at).toBe(theirs.harsher.effect.type)
        expect(sumsOf(tile.harsher.effect), at).toEqual(
          sumsOf(theirs.harsher.effect).map((sum) => sum * FACTOR),
        )
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
    const opening = EDITION_RESEARCHER_JAPAN.route.segments[0]!
    expect(opening.kind).toBe('fork')
    const doctoralLane = opening.kind === 'fork' ? opening.branches[0] : null
    expect(doctoralLane!.identity.name).toBe('The Doctoral Course')
    // Both milestones, in order: the master's gown, then the defence.
    const effects = doctoralLane!.spaces.map((space) => space.effect.type)
    expect(effects.indexOf('graduate')).toBeGreaterThan(-1)
    expect(effects.indexOf('doctorate')).toBe(effects.indexOf('graduate') + 1)
    // Both fire for everybody who walks the lane, not only whoever lands
    // exactly: an ordinary tile here would make the gated road a promise the
    // board keeps to some players and not others.
    for (const type of ['graduate', 'doctorate'] as const) {
      const tile = doctoralLane!.spaces.find((space) => space.effect.type === type)!
      expect(['event', 'stop']).toContain(tile.kind)
    }
  })

  it('gates the ladder on the doctorate itself, and leaves the road opposite open', () => {
    const gate = EDITION_RESEARCHER_JAPAN.route.segments[4]!
    expect(gate.kind).toBe('fork')
    const [ladder, staff] = gate.kind === 'fork' ? gate.branches : []
    expect(ladder!.identity.name).toBe('The Fixed-Term Ladder')
    expect(ladder!.identity.requires).toBe('doctorate')
    expect(staff!.identity.requires).toBeUndefined()
    // No payday anywhere on it: the years not earning are the road's price,
    // and a wage packet in the middle would quietly refund it.
    expect(ladder!.spaces.filter((space) => space.kind === 'payday')).toEqual([])
    // And it ends on the cliff — a compulsory redraw, which for a doctorate
    // holder can only deal from the permanent shelf.
    const last = ladder!.spaces[ladder!.spaces.length - 1]!
    expect(last.id).toBe('jpr-ladder-cliff')
    expect(last.effect).toMatchObject({ type: 'careerChange', compulsory: true })
    expect('pool' in last.effect ? last.effect.pool : undefined).toBeUndefined()
  })

  it('charges the hiring calendar on exactly the two tiles that are leaving', () => {
    /*
     * The line that will make this board play differently from the American
     * researcher's board, which deals the same redraw *at* the player's rung.
     * Asserted in both directions so a third tile cannot quietly acquire the
     * rule, and so neither of these two can quietly lose it.
     */
    const charged = mine.filter(
      (space) => space.effect.type === 'careerChange' && space.effect.startsOver === true,
    )
    expect(charged.map((space) => space.id).sort()).toEqual(Object.keys(HIRING_RULES).sort())
    for (const space of charged) {
      expect(space.effect.type === 'careerChange' && space.effect.pool).toBe('basic')
    }
  })

  it('says everything in its own words — no USA or country-Japan copy leaks through', () => {
    const elsewhere = new Set([
      ...usaSpaces.map((space) => space.description),
      ...spacesOf(EDITION_JAPAN.route).map((space) => space.description),
    ])
    expect(mine.filter((space) => elsewhere.has(space.description)).map((s) => s.id)).toEqual([])
  })

  it('carries full catalogues of its own, including a third shelf', () => {
    expect(EDITION_RESEARCHER_JAPAN.houses).toHaveLength(9)
    expect(EDITION_RESEARCHER_JAPAN.lifeTiles).toHaveLength(36)
    expect(EDITION_RESEARCHER_JAPAN.stocks).toHaveLength(5)
    expect(EDITION_RESEARCHER_JAPAN.careers.doctorate?.length).toBeGreaterThan(0)
  })
})

describe('the trade-year override', () => {
  it('writes its own vignettes for every family this board can actually deal', () => {
    const families = new Set(
      [
        ...EDITION_RESEARCHER_JAPAN.careers.basic,
        ...EDITION_RESEARCHER_JAPAN.careers.graduate,
        ...(EDITION_RESEARCHER_JAPAN.careers.doctorate ?? []),
      ]
        .filter((career) => isCareerIcon(career.icon))
        .map((career) => CAREER_FAMILY[career.icon as Parameters<typeof isCareerIcon>[0] & keyof typeof CAREER_FAMILY]),
    )
    for (const family of families) {
      const stories = tradeYearStoriesFor(EDITION_RESEARCHER_JAPAN, family)
      expect(stories, family).not.toBe(TRADE_YEAR_STORIES[family])
      expect(stories).toHaveLength(6)
      for (const line of stories) expect(line.length).toBeGreaterThan(40)
    }
  })

  it('leaves every other edition reading the engine-global table', () => {
    for (const edition of [EDITION_USA, EDITION_JAPAN]) {
      expect(tradeYearStoriesFor(edition, 'science')).toBe(TRADE_YEAR_STORIES.science)
    }
  })

  it('does not write a family this board has no work in', () => {
    // There is no sporting career on this board to have a season, so `pitch`
    // falls back — which is the fallback doing its job rather than a gap.
    expect(tradeYearStoriesFor(EDITION_RESEARCHER_JAPAN, 'pitch')).toBe(TRADE_YEAR_STORIES.pitch)
  })
})
