import { describe, expect, it } from 'vitest'
import { createSeededRandom } from './SeededRandomAdapter'

describe('createSeededRandom', () => {
  it('reproduces the exact same sequence for the same seed', () => {
    const a = createSeededRandom(1234)
    const b = createSeededRandom(1234)
    const sequenceA = Array.from({ length: 20 }, () => a.spin())
    const sequenceB = Array.from({ length: 20 }, () => b.spin())
    expect(sequenceA).toEqual(sequenceB)
  })

  it('diverges for different seeds', () => {
    const a = createSeededRandom(1)
    const b = createSeededRandom(2)
    const sequenceA = Array.from({ length: 20 }, () => a.spin())
    const sequenceB = Array.from({ length: 20 }, () => b.spin())
    expect(sequenceA).not.toEqual(sequenceB)
  })

  it('covers all ten spinner faces with no value outside 1-10 over 10,000 spins', () => {
    const random = createSeededRandom(42)
    const seen = new Set<number>()
    for (let i = 0; i < 10_000; i++) {
      const value = random.spin()
      expect(value).toBeGreaterThanOrEqual(1)
      expect(value).toBeLessThanOrEqual(10)
      expect(Number.isInteger(value)).toBe(true)
      seen.add(value)
    }
    expect(seen.size).toBe(10)
  })

  it('produces int(min, max) inclusive at both ends over many draws', () => {
    const random = createSeededRandom(7)
    const seen = new Set<number>()
    for (let i = 0; i < 2000; i++) {
      const value = random.int(3, 6)
      expect(value).toBeGreaterThanOrEqual(3)
      expect(value).toBeLessThanOrEqual(6)
      seen.add(value)
    }
    expect(seen).toEqual(new Set([3, 4, 5, 6]))
  })

  it('throws a descriptive error when picking from an empty array', () => {
    expect(() => createSeededRandom(1).pick([])).toThrow(/empty/i)
  })

  it('picks a deterministic sequence of items for a given seed', () => {
    const a = createSeededRandom(99)
    const b = createSeededRandom(99)
    const items = ['a', 'b', 'c', 'd', 'e']
    const picksA = Array.from({ length: 10 }, () => a.pick(items))
    const picksB = Array.from({ length: 10 }, () => b.pick(items))
    expect(picksA).toEqual(picksB)
    for (const value of picksA) {
      expect(items).toContain(value)
    }
  })

  it('shuffles deterministically for the same seed and stays a permutation', () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8]
    const a = createSeededRandom(555)
    const b = createSeededRandom(555)
    const resultA = a.shuffle(input)
    const resultB = b.shuffle(input)
    expect(resultA).toEqual(resultB)
    expect(resultA).not.toBe(input)
    expect([...resultA].sort()).toEqual([...input].sort())
    expect(input).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
  })
})
