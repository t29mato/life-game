import { describe, expect, it } from 'vitest'
import type { SpinValue } from '../model/types'
import { gateOfferIndex, gatePassed, passingCut } from './careerGate'

/**
 * The gated career die, read the same way twice: once by the card that
 * publishes the table before the press, and once by the code that resolves
 * the roll after it. These three functions exist so that "the same way" is a
 * fact rather than a hope.
 */
describe('careerGate', () => {
  describe('gatePassed', () => {
    it('appoints on the bar and above, and on nothing under it', () => {
      const faces: SpinValue[] = [1, 2, 3, 4, 5, 6]
      expect(faces.filter((face) => gatePassed(face, 5))).toEqual([5, 6])
      expect(faces.filter((face) => gatePassed(face, 4))).toEqual([4, 5, 6])
      expect(faces.filter((face) => gatePassed(face, 6))).toEqual([6])
    })
  })

  describe('passingCut', () => {
    it('splits two passing faces one each', () => {
      expect(passingCut(5)).toBe(6)
    })

    it('gives the larger half to the low offer when the span is odd', () => {
      // Four and five take the first post, six the second — the way the whole
      // die splits when there is no bar at all.
      expect(passingCut(4)).toBe(6)
      expect(passingCut(2)).toBe(5)
    })
  })

  describe('gateOfferIndex', () => {
    it('reads the cut back the same way the table printed it', () => {
      expect(gateOfferIndex(5, 5)).toBe(0)
      expect(gateOfferIndex(6, 5)).toBe(1)
      expect(gateOfferIndex(4, 4)).toBe(0)
      expect(gateOfferIndex(5, 4)).toBe(0)
      expect(gateOfferIndex(6, 4)).toBe(1)
    })

    it('never asks for a third offer', () => {
      for (const bar of [2, 3, 4, 5, 6] as SpinValue[]) {
        for (const face of [1, 2, 3, 4, 5, 6] as SpinValue[]) {
          if (!gatePassed(face, bar)) continue
          expect([0, 1]).toContain(gateOfferIndex(face, bar))
        }
      }
    })
  })
})
