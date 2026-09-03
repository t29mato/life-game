import { describe, expect, it } from 'vitest'
import type { Career, Player } from '../model/types'
import { TRADE_YEAR_STORIES, type TradeYearStories } from '../rules/tradeYear'
import type { Edition } from './types'
import { EDITION_USA } from './usa'
import {
  careerPoolFor,
  careerTierOf,
  lowerTier,
  findCareer,
  findHouse,
  findLifeTile,
  findStock,
  hiringPoolFor,
  ladderPositionOf,
  nextRungOf,
  rungFor,
  seniorityOf,
  tradeYearStoriesFor,
} from './lookup'

/**
 * The ladder machinery, which is what makes a career something you climb.
 *
 * Everything here is derived from `promotesTo` and nothing else — no rung
 * number is written down anywhere in a catalogue — so these tests are what say
 * the derivation is right, and what an edition author gets told off by when
 * they write a chain that does not hang together.
 */

const career = (id: string, over: Partial<Career> = {}): Career => ({
  id,
  title: id,
  salary: 30_000,
  raiseStep: 3_000,
  requiresDegree: false,
  icon: 'space:new-skills',
  description: `${id} does a job.`,
  ...over,
})

/** An edition with hand-written ladders, so the walk can be checked exactly. */
const editionWith = (
  basic: readonly Career[],
  graduate: readonly Career[] = [],
  doctorate?: readonly Career[],
): Edition => ({
  ...EDITION_USA,
  careers: { basic, graduate, ...(doctorate ? { doctorate } : {}) },
})

const playerWith = (over: Partial<Player> = {}): Player => ({
  id: 'p1',
  name: 'Alex',
  color: 'red',
  spaceId: 'start',
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
  ...over,
})

describe('ladders', () => {
  describe('hiringPoolFor', () => {
    it('deals the bottom of each ladder and nothing above it', () => {
      const edition = editionWith([
        career('a1', { promotesTo: 'a2' }),
        career('a2', { promotesTo: 'a3' }),
        career('a3'),
        career('b1', { promotesTo: 'b2' }),
        career('b2'),
      ])
      expect(hiringPoolFor(edition, 'basic').map((c) => c.id)).toEqual(['a1', 'b1'])
    })

    it('treats a pool with no chains at all as a pool of one-rung ladders', () => {
      // An edition that has not written any ladders still gets a working fair.
      const edition = editionWith([career('x'), career('y')])
      expect(hiringPoolFor(edition, 'basic').map((c) => c.id)).toEqual(['x', 'y'])
    })

    it('switches to the graduate ladders for a player with a degree', () => {
      const edition = editionWith([career('basic1')], [career('grad1', { promotesTo: 'grad2' }), career('grad2')])
      expect(hiringPoolFor(edition, 'graduate').map((c) => c.id)).toEqual(['grad1'])
    })

    it('never offers the real board a job somebody has to be promoted into', () => {
      for (const tier of ['basic', 'graduate', 'doctorate'] as const) {
        const pool = careerPoolFor(EDITION_USA, tier)
        const pointedAt = new Set(pool.map((c) => c.promotesTo).filter(Boolean))
        for (const hire of hiringPoolFor(EDITION_USA, tier)) {
          expect(pointedAt.has(hire.id)).toBe(false)
        }
      }
    })
  })

  describe('ladderPositionOf', () => {
    it('numbers the rungs from the bottom and knows how tall the ladder is', () => {
      const edition = editionWith([
        career('a1', { promotesTo: 'a2' }),
        career('a2', { promotesTo: 'a3' }),
        career('a3'),
      ])
      expect(ladderPositionOf('a1', edition)).toMatchObject({ rung: 1, height: 3 })
      expect(ladderPositionOf('a2', edition)).toMatchObject({ rung: 2, height: 3 })
      expect(ladderPositionOf('a3', edition)).toMatchObject({ rung: 3, height: 3 })
      expect(ladderPositionOf('a3', edition)!.entry.id).toBe('a1')
      expect(ladderPositionOf('a2', edition)!.rungs.map((c) => c.id)).toEqual(['a1', 'a2', 'a3'])
    })

    it('gives a calling a ladder of exactly one rung', () => {
      const position = ladderPositionOf('career-youth-coach')
      expect(position).toMatchObject({ rung: 1, height: 1 })
    })

    it('does not walk forever on a chain that loops back on itself', () => {
      // A loop is a mistake, but the walk must terminate so the mistake is a
      // failed catalogue test rather than a hung game.
      const edition = editionWith([career('l1', { promotesTo: 'l2' }), career('l2', { promotesTo: 'l1' })])
      expect(hiringPoolFor(edition, 'basic')).toHaveLength(0)
      expect(ladderPositionOf('l1', edition)).toBeUndefined()
    })

    it('stops at a rung that points at a job the edition does not have', () => {
      const edition = editionWith([career('m1', { promotesTo: 'nowhere' })])
      expect(ladderPositionOf('m1', edition)).toMatchObject({ rung: 1, height: 1 })
    })

    it('returns undefined for a career the edition has never heard of', () => {
      expect(ladderPositionOf('career-not-real')).toBeUndefined()
    })
  })

  describe('nextRungOf', () => {
    it('finds the job above this one', () => {
      const apprentice = findCareer('career-salon-apprentice')!
      expect(nextRungOf(apprentice)?.id).toBe('career-stylist')
    })

    it('returns undefined at the top of a ladder', () => {
      expect(nextRungOf(findCareer('career-salon-owner')!)).toBeUndefined()
    })

    it('returns undefined for a calling, which has no rung above it by design', () => {
      expect(nextRungOf(findCareer('career-veterinarian')!)).toBeUndefined()
    })

    it('promotes a career whose salary has been raised out of all recognition', () => {
      // A career carried in a save has had raises applied to the object itself.
      // The chain, not the figures, is what says where it goes next.
      const raised: Career = { ...findCareer('career-salon-apprentice')!, salary: 999_000 }
      expect(nextRungOf(raised)?.id).toBe('career-stylist')
    })
  })

  describe('seniorityOf', () => {
    it('reads the rung an employed player is standing on', () => {
      const player = playerWith({ career: findCareer('career-stylist')! })
      expect(seniorityOf(player)).toBe(2)
    })

    it('reads what a layoff left behind while the player is out of work', () => {
      const player = playerWith({ career: null, carriedSeniority: 2 })
      expect(seniorityOf(player)).toBe(2)
    })

    it('reads a player who has never worked as the bottom rung', () => {
      expect(seniorityOf(playerWith({ career: null }))).toBe(1)
    })

    it('reads a save written before ladders existed as the bottom rung', () => {
      expect(seniorityOf(playerWith({ career: null, carriedSeniority: 0 }))).toBe(1)
    })
  })

  describe('rungFor', () => {
    const edition = editionWith([
      career('tall1', { promotesTo: 'tall2' }),
      career('tall2', { promotesTo: 'tall3' }),
      career('tall3'),
      career('short1', { promotesTo: 'short2' }),
      career('short2'),
    ])
    const entry = (id: string) => hiringPoolFor(edition, 'basic').find((c) => c.id === id)!

    it('joins a new trade at the level already reached, not at the bottom', () => {
      expect(rungFor(entry('tall1'), 2, edition).id).toBe('tall2')
    })

    it('takes a mover at the top of a ladder too short to hold their seniority', () => {
      // A stylist walking into a two-rung trade runs it; they do not start again.
      expect(rungFor(entry('short1'), 3, edition).id).toBe('short2')
    })

    it('hires somebody with nothing behind them at the bottom', () => {
      expect(rungFor(entry('tall1'), 1, edition).id).toBe('tall1')
      expect(rungFor(entry('tall1'), 0, edition).id).toBe('tall1')
    })

    it('hands back the entry itself when the edition has no ladder for it', () => {
      const stranger = career('stranger')
      expect(rungFor(stranger, 3, edition)).toBe(stranger)
    })
  })
})

describe('catalogue lookups', () => {
  it('finds a house, a life tile and a stock by id', () => {
    const house = EDITION_USA.houses[0]!
    const tile = EDITION_USA.lifeTiles[0]!
    const stock = EDITION_USA.stocks[0]!
    expect(findHouse(house.id)).toBe(house)
    expect(findLifeTile(tile.id)).toBe(tile)
    expect(findStock(stock.id)).toBe(stock)
  })

  it('returns undefined for ids no catalogue holds', () => {
    expect(findHouse('house-atlantis')).toBeUndefined()
    expect(findLifeTile('tile-nope')).toBeUndefined()
    expect(findStock('stock-nope')).toBeUndefined()
    expect(findCareer('career-nope')).toBeUndefined()
  })

  it('searches the edition it is given rather than the default one', () => {
    const edition = editionWith([career('only-here')])
    expect(findCareer('only-here', edition)?.id).toBe('only-here')
    expect(findCareer('only-here')).toBeUndefined()
    expect(findCareer('career-surgeon', edition)).toBeUndefined()
  })

  it('offers every rung for lookup, not merely the ones a fair deals', () => {
    expect(careerPoolFor(EDITION_USA, 'basic').length).toBeGreaterThan(
      hiringPoolFor(EDITION_USA, 'basic').length,
    )
    expect(careerPoolFor(EDITION_USA, 'graduate')).toBe(EDITION_USA.careers.graduate)
  })
})

/**
 * The third shelf, and the two small functions that decide which one a fair
 * deals from.
 *
 * Both of them exist because a shelf is now a rung on a hierarchy rather than
 * a boolean, and a hierarchy has two questions a boolean never had: what is
 * this player entitled to, and what does *this fair* have on the table.
 */
describe('career tiers', () => {
  const basics = [career('basic1')]
  const grads = [career('grad1')]
  const docs = [career('doc1')]

  describe('careerTierOf', () => {
    it('reads a player with no schooling as the basic shelf', () => {
      expect(careerTierOf(playerWith())).toBe('basic')
    })

    it('reads a degree as the graduate shelf', () => {
      expect(careerTierOf(playerWith({ hasDegree: true }))).toBe('graduate')
    })

    it('reads a doctorate as the doctoral shelf', () => {
      expect(careerTierOf(playerWith({ hasDegree: true, hasDoctorate: true }))).toBe('doctorate')
    })

    /*
     * A degree does not open the same shelf on every board. On a researcher's
     * board the `graduate` shelf is academia, and academia is opened by the
     * doctorate — so an edition gets to say what a first degree is worth, and
     * one that says nothing keeps the base game's answer. Without this, a
     * board where everybody has been to university would have no way left to
     * tell the master's exit from the doctorate at a career fair.
     */
    it('lets an edition say which shelf a first degree opens', () => {
      const researcherish: Edition = {
        ...editionWith(basics, grads, docs),
        schooling: { everyoneGraduates: true, degreeOpens: 'basic' },
      }
      expect(careerTierOf(playerWith({ hasDegree: true }), researcherish)).toBe('basic')
      // The doctorate still answers for itself, and so does no schooling at all.
      expect(careerTierOf(playerWith({ hasDegree: true, hasDoctorate: true }), researcherish)).toBe('doctorate')
      expect(careerTierOf(playerWith(), researcherish)).toBe('basic')
    })

    it('keeps the base game\'s answer for an edition that says nothing', () => {
      expect(careerTierOf(playerWith({ hasDegree: true }), editionWith(basics, grads))).toBe('graduate')
    })
  })

  describe('lowerTier', () => {
    it('hands a school-leaver the basic pool at a graduate fair', () => {
      expect(lowerTier('graduate', 'basic')).toBe('basic')
    })

    it('hands a doctor only what the fair in front of them deals', () => {
      expect(lowerTier('basic', 'doctorate')).toBe('basic')
      expect(lowerTier('graduate', 'doctorate')).toBe('graduate')
    })

    it('is the doctoral shelf only when both sides say so', () => {
      expect(lowerTier('doctorate', 'doctorate')).toBe('doctorate')
    })
  })

  describe('the doctoral shelf', () => {
    it('deals from the doctoral pool when the edition has written one', () => {
      const edition = editionWith(basics, grads, docs)
      expect(hiringPoolFor(edition, 'doctorate').map((c) => c.id)).toEqual(['doc1'])
      expect(careerPoolFor(edition, 'doctorate').map((c) => c.id)).toEqual(['doc1'])
    })

    /*
     * The rollout fallback, and the reason it is not an error. Four of the five
     * countries have no grad school on their board yet, so nothing can ever ask
     * them for a doctor — but a shared engine should not have to know which
     * countries are finished, and answering with the shelf below is the only
     * honest thing left to answer.
     */
    it('falls back to the graduate shelf on an edition that has written none', () => {
      const edition = editionWith(basics, grads)
      expect(hiringPoolFor(edition, 'doctorate').map((c) => c.id)).toEqual(['grad1'])
      expect(careerPoolFor(edition, 'doctorate').map((c) => c.id)).toEqual(['grad1'])
    })

    it('indexes doctoral careers by id, so a save reloads its doctor into a real job', () => {
      const edition = editionWith(basics, grads, docs)
      expect(findCareer('doc1', edition)?.id).toBe('doc1')
      expect(ladderPositionOf('doc1', edition)?.rung).toBe(1)
    })

    /*
     * Compared at the door, which is where the comparison is actually made: a
     * fair deals bottom rungs and nothing else, so "the doctorate pays better"
     * has to be true of the offers on the table rather than of the whole
     * catalogue. It is not true rung for rung and is not meant to be — a
     * postdoc earns less than a corporate lawyer who has already been promoted
     * once, which is both realistic and the reason the shelf is a floor rather
     * than a ceiling.
     */
    it('gives the USA board a doctoral shelf whose worst offer beats the graduate hall\'s best', () => {
      const graduateBest = Math.max(...hiringPoolFor(EDITION_USA, 'graduate').map((c) => c.salary))
      const doctoralWorst = Math.min(...hiringPoolFor(EDITION_USA, 'doctorate').map((c) => c.salary))
      expect(doctoralWorst).toBeGreaterThan(graduateBest)
    })

    /*
     * The one number the doctoral shelf is not allowed to beat. See
     * `DOCTORATE_CAREERS` — the school-leaver's best life out-earning every
     * qualified job on the board is where Straight to Work's volatility comes
     * from, and it is the opening fork's whole argument.
     */
    it('never out-earns the top of a basic ladder', () => {
      const basicTop = Math.max(...EDITION_USA.careers.basic.map((c) => c.salary))
      const doctoralTop = Math.max(...(EDITION_USA.careers.doctorate ?? []).map((c) => c.salary))
      expect(doctoralTop).toBeLessThan(basicTop)
    })
  })
})

/**
 * The trade-year table, and the one thing an edition may say about it: some
 * families sound like this edition, and every family it does not mention
 * still sounds like every other edition.
 */
describe('tradeYearStoriesFor', () => {
  const OVERRIDE: TradeYearStories = [
    'One.',
    'Two.',
    'Three.',
    'Four.',
    'Five.',
    'Six.',
  ]

  it('reads the engine-global table for an edition with no override at all', () => {
    expect(tradeYearStoriesFor(EDITION_USA, 'science')).toBe(TRADE_YEAR_STORIES.science)
  })

  it('reads an edition override for the family it names', () => {
    const edition: Edition = { ...EDITION_USA, tradeYearStories: { science: OVERRIDE } }
    expect(tradeYearStoriesFor(edition, 'science')).toBe(OVERRIDE)
  })

  it('falls back to the global table for every family the edition does not override', () => {
    const edition: Edition = { ...EDITION_USA, tradeYearStories: { science: OVERRIDE } }
    expect(tradeYearStoriesFor(edition, 'kitchen')).toBe(TRADE_YEAR_STORIES.kitchen)
    expect(tradeYearStoriesFor(edition, 'field')).toBe(TRADE_YEAR_STORIES.field)
  })
})
