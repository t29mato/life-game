import type { RandomPort } from '@application/ports/RandomPort'
import type { SpinValue } from '@domain/model/types'

/** `RandomPort` backed by `Math.random`, used for real gameplay. */
export function createMathRandom(): RandomPort {
  const int = (min: number, max: number): number =>
    Math.floor(Math.random() * (max - min + 1)) + min

  const spin = (): SpinValue => int(1, 10) as SpinValue

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
