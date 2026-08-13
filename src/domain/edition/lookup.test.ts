import { describe, expect, it } from 'vitest'
import type { Career, Player } from '../model/types'
import type { Edition } from './types'
import { EDITION_USA } from './usa'
import {
  careerPoolFor,
  findCareer,
  findHouse,
  findLifeTile,
  findStock,
  hiringPoolFor,
  ladderPositionOf,
  nextRungOf,
  rungFor,
  seniorityOf,
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
const editionWith = (basic: readonly Career[], graduate: readonly Career[] = []): Edition => ({
  ...EDITION_USA,
  careers: { basic, graduate },
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
      expect(hiringPoolFor(edition, false).map((c) => c.id)).toEqual(['a1', 'b1'])
    })

    it('treats a pool with no chains at all as a pool of one-rung ladders', () => {
      // An edition that has not written any ladders still gets a working fair.
      const edition = editionWith([career('x'), career('y')])
      expect(hiringPoolFor(edition, false).map((c) => c.id)).toEqual(['x', 'y'])
    })

    it('switches to the graduate ladders for a player with a degree', () => {
      const edition = editionWith([career('basic1')], [career('grad1', { promotesTo: 'grad2' }), career('grad2')])
      expect(hiringPoolFor(edition, true).map((c) => c.id)).toEqual(['grad1'])
    })

    it('never offers the real board a job somebody has to be promoted into', () => {
      for (const hasDegree of [false, true]) {
        const pool = careerPoolFor(EDITION_USA, hasDegree)
        const pointedAt = new Set(pool.map((c) => c.promotesTo).filter(Boolean))
        for (const hire of hiringPoolFor(EDITION_USA, hasDegree)) {
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
      expect(hiringPoolFor(edition, false)).toHaveLength(0)
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
    const entry = (id: string) => hiringPoolFor(edition, false).find((c) => c.id === id)!

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
    expect(careerPoolFor(EDITION_USA, false).length).toBeGreaterThan(
      hiringPoolFor(EDITION_USA, false).length,
    )
    expect(careerPoolFor(EDITION_USA, true)).toBe(EDITION_USA.careers.graduate)
  })
})
