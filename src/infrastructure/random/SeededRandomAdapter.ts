import type { RandomPort } from '@application/ports/RandomPort'
import type { SpinValue } from '@domain/model/types'
import { SPIN_FACES } from '@domain/model/constants'

/**
 * mulberry32 — a tiny, fast, well-distributed 32-bit PRNG. Good enough for a
 * board game and, crucially, reproducible: the same seed always yields the
 * same sequence, which is what makes deterministic tests and shareable replay
 * seeds possible.
 */
function mulberry32(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** `RandomPort` backed by a seeded mulberry32 generator, for reproducible tests and replays. */
export function createSeededRandom(seed: number): RandomPort {
  const next = mulberry32(seed)

  const int = (min: number, max: number): number =>
    Math.floor(next() * (max - min + 1)) + min

  const spin = (): SpinValue => int(1, SPIN_FACES) as SpinValue

  const pick = <T>(items: readonly T[]): T => {
    if (items.length === 0) {
      throw new Error('Cannot pick from an empty array')
    }
    return items[int(0, items.length - 1)] as T
  }

  const shuffle = <T>(items: readonly T[]): T[] => {
    const result = [...items]
    for (let i = result.length - 1; i > 0; i--) {
      const j = int(0, i)
      const a = result[i] as T
      const b = result[j] as T
      result[i] = b
      result[j] = a
    }
    return result
  }

  return { spin, int, pick, shuffle }
}
