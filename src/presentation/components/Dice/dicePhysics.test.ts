import { describe, expect, it } from 'vitest'
import { createDiceThrow, type ThrowFrame } from './dicePhysics'

/**
 * A seeded LCG in place of `Math.random`, because a physics test that only
 * passes on lucky deals is worse than no test: every claim here — decaying
 * bounces, bounded duration, per-throw variation — is checked across a fan
 * of fixed seeds rather than eyeballed on one.
 */
function seededRandom(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 4294967296
  }
}

const SEEDS = [1, 7, 42, 1234, 99999, 271828, 3141592, 8675309] as const

/** Indexed access that fails the test loudly instead of typing undefined. */
function at<T>(items: readonly T[], index: number): T {
  const item = items[index]
  if (item === undefined) throw new Error(`missing item at ${index}`)
  return item
}

/** Step a throw at display rate and keep every frame. */
function runThrow(seed: number, targetDuration = 0.85): {
  readonly sim: ReturnType<typeof createDiceThrow>
  readonly frames: readonly ThrowFrame[]
} {
  const sim = createDiceThrow(targetDuration, seededRandom(seed))
  const dt = 1 / 60
  const frames: ThrowFrame[] = []
  for (let t = 0; t < sim.duration + dt; t += dt) {
    frames.push(sim.step(dt))
  }
  return { sim, frames }
}

describe('createDiceThrow', () => {
  it('keeps the realised duration near the nominal one on every deal', () => {
    for (const seed of SEEDS) {
      const sim = createDiceThrow(0.85, seededRandom(seed))
      // The launch jitter moves the whole timetable, but only by a little:
      // the same hand throwing the same die, not a different thrower.
      expect(sim.duration).toBeGreaterThan(0.85 * 0.75)
      expect(sim.duration).toBeLessThan(0.85 * 1.25)
    }
  })

  it('bounces two to four times, each strictly smaller than the last', () => {
    for (const seed of SEEDS) {
      const { sim } = runThrow(seed)
      expect(sim.bouncePeaks.length).toBeGreaterThanOrEqual(2)
      expect(sim.bouncePeaks.length).toBeLessThanOrEqual(4)
      // The first bounce must actually read as one at 64px, and every later
      // one must visibly decay — the whole point of simulating the throw.
      expect(at(sim.bouncePeaks, 0)).toBeGreaterThan(0.2)
      for (let i = 1; i < sim.bouncePeaks.length; i++) {
        expect(at(sim.bouncePeaks, i)).toBeLessThan(at(sim.bouncePeaks, i - 1) * 0.6)
      }
    }
  })

  it('rises off the table after first touchdown — the bounces are real frames', () => {
    for (const seed of SEEDS) {
      const { frames } = runThrow(seed)
      const firstImpact = frames.findIndex((f) => f.impact > 0)
      expect(firstImpact).toBeGreaterThan(0)
      const reboundPeak = Math.max(...frames.slice(firstImpact).map((f) => f.height))
      expect(reboundPeak).toBeGreaterThan(0.1)
    }
  })

  it('reports an impact for every contact, hardest first', () => {
    for (const seed of SEEDS) {
      const { sim, frames } = runThrow(seed)
      const impacts = frames.filter((f) => f.impact > 0).map((f) => f.impact)
      // One impact per rebound at least; the final grounding contact usually
      // adds one more unless the timetable clamp beat the integrator to it.
      expect(impacts.length).toBeGreaterThanOrEqual(sim.bouncePeaks.length)
      expect(at(impacts, 0)).toBeGreaterThan(0.9)
      for (let i = 1; i < impacts.length; i++) {
        expect(at(impacts, i)).toBeLessThan(at(impacts, i - 1))
      }
    }
  })

  it('is flat on the table, with progress complete, once the timetable runs out', () => {
    for (const seed of SEEDS) {
      const { frames } = runThrow(seed)
      const last = at(frames, frames.length - 1)
      expect(last.grounded).toBe(true)
      expect(last.height).toBe(0)
      expect(last.flightProgress).toBe(1)
      expect(last.returnProgress).toBe(1)
    }
  })

  it('always tumbles through several whole turns, never backwards', () => {
    for (const seed of SEEDS) {
      const { frames } = runThrow(seed)
      let previous = 0
      for (const frame of frames) {
        expect(frame.spinAngle).toBeGreaterThanOrEqual(previous)
        previous = frame.spinAngle
      }
      expect(previous).toBeGreaterThan(2 * 360)
    }
  })

  it('deals every throw a little differently, and the same seed identically', () => {
    const durations = new Set(SEEDS.map((seed) => createDiceThrow(0.85, seededRandom(seed)).duration))
    expect(durations.size).toBe(SEEDS.length)

    const once = runThrow(42)
    const again = runThrow(42)
    expect(again.sim.duration).toBe(once.sim.duration)
    expect(again.frames).toEqual(once.frames)
  })

  it('still lands within a test-speed timetable', () => {
    // Component tests run the throw at 0.02s; the integrator must ground the
    // die by the leg's end even when frames dwarf the bounce arcs.
    const { sim, frames } = runThrow(42, 0.02)
    expect(sim.duration).toBeLessThan(0.03)
    const last = at(frames, frames.length - 1)
    expect(last.grounded).toBe(true)
    expect(last.height).toBe(0)
  })
})
