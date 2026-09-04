import { describe, expect, it } from 'vitest'
import { DIFFICULTIES } from '@domain/rules/difficulty'
import { estimateMinutes, estimatePlaytime } from './estimatePlaytime'

/*
 * The constants under test come from measurement, not taste: the round counts
 * were read off 60 seeded all-CPU games per difficulty and player count on the
 * `gameBalance.test.ts` harness (means of 17.8–21.5 across the grid), and the
 * computer seat's seconds are summed from `CPU_THINK_MS`
 * (`decideCpuCommand.ts`), the wheel's spin (`TEMPO.wheelSpinSeconds`) and the pawn's
 * hop (`Pawn.tsx`). Only the human seat's 20–30 s is an assumption, which is
 * why every mixed table renders as a range.
 */
describe('estimatePlaytime', () => {
  it('quotes the default table honestly: two humans on normal', () => {
    // 18 rounds × 2 × 20–30 s = 12–18 min, rounded outward to fives.
    expect(estimatePlaytime(2, 0, 'normal')).toBe('About 10–20 min for 2 human seats.')
  })

  it('prices a mixed table from both kinds of seat', () => {
    // 21 rounds × (2 × 20–30 s + 2 × ~5.5 s) ≈ 17.9–24.9 min.
    expect(estimatePlaytime(2, 2, 'veryHard')).toBe(
      'About 20–25 min for 2 human seats and 2 CPU seats.',
    )
  })

  it('collapses an all-CPU table to a single figure — there is no human range', () => {
    // 18 rounds × 3 × ~5.5 s ≈ 5.0 min, floored at the five-minute grain.
    expect(estimatePlaytime(0, 3, 'normal')).toBe('About 5 min for 3 CPU seats.')
  })

  it('uses the singular for a lone seat of either kind', () => {
    expect(estimatePlaytime(1, 1, 'normal')).toBe('About 10 min for 1 human seat and 1 CPU seat.')
  })

  it('grows when a human is added — more seats, more turns before anyone retires', () => {
    for (const difficulty of DIFFICULTIES) {
      const [twoLow, twoHigh] = estimateMinutes(2, 1, difficulty)
      const [threeLow, threeHigh] = estimateMinutes(3, 1, difficulty)
      expect(threeLow).toBeGreaterThan(twoLow)
      expect(threeHigh).toBeGreaterThan(twoHigh)
    }
  })

  it('grows when a CPU is added too — a computer seat is cheap, never free', () => {
    for (const difficulty of DIFFICULTIES) {
      const [low, high] = estimateMinutes(2, 1, difficulty)
      const [moreLow, moreHigh] = estimateMinutes(2, 2, difficulty)
      expect(moreLow).toBeGreaterThan(low)
      expect(moreHigh).toBeGreaterThan(high)
    }
  })

  it('grows with difficulty, because harder games run more rounds', () => {
    // Measured at ~18 rounds on normal, ~20 on hard, ~21 on very hard.
    const [normal] = estimateMinutes(2, 0, 'normal')
    const [hard] = estimateMinutes(2, 0, 'hard')
    const [veryHard] = estimateMinutes(2, 0, 'veryHard')
    expect(hard).toBeGreaterThan(normal)
    expect(veryHard).toBeGreaterThan(hard)
  })

  it('never quotes false precision — every figure is a whole multiple of five', () => {
    for (const difficulty of DIFFICULTIES) {
      for (let humans = 0; humans <= 4; humans += 1) {
        for (let cpus = humans === 0 ? 2 : 0; humans + cpus <= 4; cpus += 1) {
          const line = estimatePlaytime(humans, cpus, difficulty)
          const figures = line.match(/\d+(?=–|\s*min)/g) ?? []
          expect(figures.length).toBeGreaterThan(0)
          for (const figure of figures) expect(Number(figure) % 5).toBe(0)
        }
      }
    }
  })
})
