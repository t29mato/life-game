import { describe, expect, it } from 'vitest'

import type { Career, SpinValue } from '../model/types'
import { SPIN_FACES } from '../model/constants'
import { CAREER_FAMILIES, CAREER_FAMILY, type CareerFamily } from './careerFamily'
import {
  bestTradeYear,
  expectedTradeYearValue,
  TRADE_YEAR_STORIES,
  tradeFamilyOf,
  tradeYearFor,
  tradeYearSwing,
  tradeYearWeight,
} from './tradeYear'
import { allEditions } from '../edition/registry'

const EVERY_FACE: readonly SpinValue[] = Array.from(
  { length: SPIN_FACES },
  (_, i) => (i + 1) as SpinValue,
)

const cook = (overrides: Partial<Career> = {}): Career => ({
  id: 'career-line-cook',
  title: 'Line Cook',
  salary: 50_000,
  raiseStep: 5_000,
  requiresDegree: false,
  icon: 'career:line-cook',
  description: 'Six burners and a ticket rail.',
  ...overrides,
})

describe('the year a trade has', () => {
  describe('the stories', () => {
    it('writes one for every face of the die, for every family', () => {
      for (const family of CAREER_FAMILIES) {
        expect(TRADE_YEAR_STORIES[family], family).toHaveLength(SPIN_FACES)
        for (const story of TRADE_YEAR_STORIES[family]) {
          expect(story.length, family).toBeGreaterThan(20)
        }
      }
    })

    it('covers every family the taxonomy knows about, and no others', () => {
      expect(Object.keys(TRADE_YEAR_STORIES).sort()).toEqual([...CAREER_FAMILIES].sort())
      expect(new Set(Object.values(CAREER_FAMILY)).size).toBe(CAREER_FAMILIES.length)
    })

    /*
     * A vignette shared between two families would be a family that has
     * nothing of its own to say, which is the whole reason the tile is written
     * per family rather than once for everybody.
     */
    it('gives every family its own words', () => {
      const all = CAREER_FAMILIES.flatMap((family) => TRADE_YEAR_STORIES[family])
      expect(new Set(all).size).toBe(all.length)
    })

    /**
     * Every career in every edition has to be able to have a year. A trade
     * whose icon is missing from `CAREER_FAMILY` would be a blank card, and a
     * family missing from the table above would be the same thing one level up.
     */
    it('has a year for every career in every edition', () => {
      for (const edition of allEditions()) {
        const careers = [
          ...edition.careers.basic,
          ...edition.careers.graduate,
          ...(edition.careers.doctorate ?? []),
        ]
        for (const career of careers) {
          const year = tradeYearFor(career, 4, 0.5, 100)
          expect(year, `${edition.id}: ${career.id}`).not.toBeNull()
          expect(year!.story.length).toBeGreaterThan(20)
        }
      }
    })
  })

  describe('what a face is worth', () => {
    it('weights the die symmetrically about its middle', () => {
      expect(EVERY_FACE.map(tradeYearWeight)).toEqual([-1, -0.6, -0.2, 0.2, 0.6, 1])
    })

    it('never deals an even year — every face is a good one or a bad one', () => {
      for (const face of EVERY_FACE) {
        expect(tradeYearSwing(50_000, 0.5, face, 100)).not.toBe(0)
      }
    })

    it('costs on the low half and pays on the high half', () => {
      for (const face of EVERY_FACE) {
        const swing = tradeYearSwing(50_000, 0.5, face, 100)
        if (face <= SPIN_FACES / 2) expect(swing).toBeLessThan(0)
        else expect(swing).toBeGreaterThan(0)
      }
    })

    it('makes the best year worth exactly what the worst one costs', () => {
      expect(tradeYearSwing(50_000, 0.5, 6, 100)).toBe(-tradeYearSwing(50_000, 0.5, 1, 100))
      expect(bestTradeYear(50_000, 0.5, 100)).toBe(25_000)
    })

    /*
     * The whole reason the stake is a share rather than a sum: the swing has
     * to mean the same thing to an apprentice and to the owner of the place.
     */
    it('scales with what the player earns, not with a figure on the tile', () => {
      const apprentice = tradeYearSwing(29_750, 0.5, 6, 100)
      const owner = tradeYearSwing(121_100, 0.5, 6, 100)
      expect(owner / apprentice).toBeCloseTo(121_100 / 29_750, 1)
    })

    it('rounds to the edition unit, so a card never prints loose change', () => {
      for (const face of EVERY_FACE) {
        expect(Math.abs(tradeYearSwing(33_333, 0.5, face, 100)) % 100).toBe(0)
        expect(Math.abs(tradeYearSwing(33_333, 0.5, face, 100_000)) % 100_000).toBe(0)
      }
    })
  })

  /*
   * The property the board is balanced against. A tile that paid out on
   * average would be a raise handed to whoever walks past it, and every mean
   * in `gameBalance.test.ts` would have to be re-measured; a tile that cost on
   * average would be a tax on having a job.
   */
  describe('what it is worth before anybody rolls', () => {
    it('is worth exactly nothing, at any salary and any stake', () => {
      for (const salary of [24_000, 29_750, 50_000, 121_100, 148_400, 4_200_000]) {
        for (const share of [0.2, 0.5, 0.75]) {
          expect(expectedTradeYearValue(salary, share, 100), `${salary} at ${share}`).toBe(0)
        }
      }
    })

    it('stays worth nothing for every career the game deals', () => {
      for (const edition of allEditions()) {
        const careers = [
          ...edition.careers.basic,
          ...edition.careers.graduate,
          ...(edition.careers.doctorate ?? []),
        ]
        for (const career of careers) {
          expect(
            expectedTradeYearValue(career.salary, 0.5, edition.currency.tileRounding),
            `${edition.id}: ${career.id}`,
          ).toBe(0)
        }
      }
    })
  })

  describe('who it happens to', () => {
    it('reads the family off the trade the player is holding', () => {
      expect(tradeFamilyOf(cook())).toBe<CareerFamily>('kitchen')
      expect(tradeFamilyOf(cook({ icon: 'career:surgeon' }))).toBe<CareerFamily>('care')
    })

    it('passes by anybody who is not working', () => {
      expect(tradeFamilyOf(null)).toBeNull()
      expect(tradeFamilyOf(undefined)).toBeNull()
      expect(tradeYearFor(null, 6, 0.5, 100)).toBeNull()
    })

    it('tells the family story for the face that came up', () => {
      const year = tradeYearFor(cook(), 1, 0.5, 100)
      expect(year!.family).toBe<CareerFamily>('kitchen')
      expect(year!.story).toBe(TRADE_YEAR_STORIES.kitchen[0])
      expect(year!.swing).toBeLessThan(0)

      const good = tradeYearFor(cook(), 6, 0.5, 100)
      expect(good!.story).toBe(TRADE_YEAR_STORIES.kitchen[5])
      expect(good!.swing).toBeGreaterThan(0)
    })
  })
})
