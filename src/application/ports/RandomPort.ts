import type { SpinValue } from '@domain/model/types'

/**
 * All non-determinism in the game funnels through this port, which is what
 * makes the use cases fully testable.
 */
export interface RandomPort {
  /** One throw of the die, 1–6. */
  spin(): SpinValue
  /** An integer in [min, max], both inclusive. */
  int(min: number, max: number): number
  /** Uniform choice. Throws on an empty array. */
  pick<T>(items: readonly T[]): T
  /** A new array containing the same items in random order. */
  shuffle<T>(items: readonly T[]): T[]
}
