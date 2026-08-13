import { afterEach, describe, expect, it, vi } from 'vitest'
import { createMathRandom } from './MathRandomAdapter'

describe('createMathRandom', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('spin', () => {
    it('maps the lowest possible draw to 1', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0)
      expect(createMathRandom().spin()).toBe(1)
    })

    it('maps a draw just under 1 to 10', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.999999999)
      expect(createMathRandom().spin()).toBe(10)
    })

    it('never returns a value outside 1-10 across the full range of draws', () => {
      const random = createMathRandom()
      for (let step = 0; step < 100; step++) {
        vi.spyOn(Math, 'random').mockReturnValue(step / 100)
        const value = random.spin()
        expect(value).toBeGreaterThanOrEqual(1)
        expect(value).toBeLessThanOrEqual(10)
        expect(Number.isInteger(value)).toBe(true)
      }
    })
  })

  describe('int', () => {
    it('returns the minimum when the draw is 0', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0)
      expect(createMathRandom().int(5, 9)).toBe(5)
    })

    it('returns the maximum when the draw is just under 1', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.999999999)
      expect(createMathRandom().int(5, 9)).toBe(9)
    })

    it('supports a min/max range of a single value', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.5)
      expect(createMathRandom().int(7, 7)).toBe(7)
    })
  })

  describe('pick', () => {
    it('throws a descriptive error on an empty array', () => {
      expect(() => createMathRandom().pick([])).toThrow(/empty/i)
    })

    it('returns the first item when the draw is 0', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0)
      expect(createMathRandom().pick(['a', 'b', 'c'])).toBe('a')
    })

    it('returns the last item when the draw is just under 1', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.999999999)
      expect(createMathRandom().pick(['a', 'b', 'c'])).toBe('c')
    })
  })

  describe('shuffle', () => {
    it('returns a new array rather than mutating the input', () => {
      const input = [1, 2, 3, 4, 5]
      const copy = [...input]
      const result = createMathRandom().shuffle(input)
      expect(result).not.toBe(input)
      expect(input).toEqual(copy)
    })

    it('returns a permutation containing exactly the same items', () => {
      const input = [1, 2, 3, 4, 5, 6, 7, 8]
      const result = createMathRandom().shuffle(input)
      expect(result).toHaveLength(input.length)
      expect([...result].sort()).toEqual([...input].sort())
    })

    it('leaves order unchanged when every draw picks the last remaining slot', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.999999999)
      const result = createMathRandom().shuffle([1, 2, 3, 4])
      expect(result).toEqual([1, 2, 3, 4])
    })

    it('handles empty and single-item arrays', () => {
      const random = createMathRandom()
      expect(random.shuffle([])).toEqual([])
      expect(random.shuffle([42])).toEqual([42])
    })
  })
})
