import { describe, expect, it } from 'vitest'
import type { SpinValue } from '@domain/model/types'
import { PEG_SPAN, SEGMENT_DEGREES, createWheelSpin, faceAtAngle, tickerBend } from './wheelPhysics'

/**
 * A tiny reproducible source, so a claim about *how* a hundred spins behave is
 * a claim about the same hundred spins every run. The physics is deterministic
 * given its launch speed, and the launch speed is the only thing dealt.
 */
function seeded(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 4294967296
  }
}

const FACES: readonly SpinValue[] = [1, 2, 3, 4, 5, 6]

/** One spin's angle sampled densely enough to catch anything it does. */
function trajectory(spin: { duration: number; angleAt(s: number): number }): number[] {
  const out: number[] = []
  for (let s = 0; s <= spin.duration; s += spin.duration / 900) out.push(spin.angleAt(s))
  out.push(spin.angleAt(spin.duration))
  return out
}

describe('faceAtAngle', () => {
  it('reads the segment under the pointer, and wraps with the wheel', () => {
    expect(faceAtAngle(0)).toBe(1)
    expect(faceAtAngle(SEGMENT_DEGREES / 2)).toBe(1)
    expect(faceAtAngle(SEGMENT_DEGREES * 5.5)).toBe(6)
    // Whole turns change nothing, in either direction — the wheel is a wheel.
    expect(faceAtAngle(SEGMENT_DEGREES * 2.5 + 720)).toBe(3)
    expect(faceAtAngle(SEGMENT_DEGREES * 2.5 - 1080)).toBe(3)
  })
})

describe('tickerBend', () => {
  it('is fully bent on a peg, straight between them, and continuous in between', () => {
    expect(tickerBend(0)).toBeCloseTo(1, 6)
    expect(tickerBend(SEGMENT_DEGREES)).toBeCloseTo(1, 6)
    expect(tickerBend(SEGMENT_DEGREES / 2)).toBe(0)
    expect(tickerBend(PEG_SPAN)).toBeCloseTo(0, 6)
    // Rising all the way onto the peg — the blade never jumps.
    let last = 0
    for (let d = -PEG_SPAN + 0.1; d <= 0; d += 0.5) {
      const now = tickerBend(d)
      expect(now).toBeGreaterThanOrEqual(last - 1e-9)
      last = now
    }
  })
})

describe('createWheelSpin', () => {
  /**
   * The one thing the whole module is for. The store has already decided;
   * every spin has to arrive at that decision by running out of energy in the
   * right segment, from wherever the wheel happens to be sitting.
   */
  it('always comes to rest showing the value the domain decided', () => {
    const random = seeded(11)
    let angle = 137.4
    for (let i = 0; i < 120; i += 1) {
      const result = FACES[i % 6]!
      const spin = createWheelSpin({ fromAngle: angle, result, targetSeconds: 2.6, random })
      expect(faceAtAngle(spin.restAngle)).toBe(result)
      angle = spin.restAngle
    }
  })

  /**
   * The other half of honesty, and the one that is easy to cheat: a spinner
   * that sails past the answer and snaps back gets its near-misses for free
   * and they are all lies. This asserts the wheel never once enters the
   * segment *after* the one it stops in — so any moment where it looks about
   * to tip over into the next number is a moment where it genuinely was.
   */
  it('never crosses past its own answer, and never runs backwards past the flick', () => {
    const random = seeded(29)
    let angle = 0
    for (let i = 0; i < 60; i += 1) {
      const result = FACES[(i * 5) % 6]!
      const spin = createWheelSpin({ fromAngle: angle, result, targetSeconds: 2.6, random })
      const path = trajectory(spin)
      const nextBoundary = (Math.floor(spin.restAngle / SEGMENT_DEGREES) + 1) * SEGMENT_DEGREES
      expect(Math.max(...path)).toBeLessThan(nextBoundary)
      expect(Math.min(...path)).toBeGreaterThanOrEqual(angle - 1e-9)
      angle = spin.restAngle
    }
  })

  /**
   * The deceleration *is* the drama, so it is measured rather than trusted:
   * the last click has to be worlds slower than the first, and there has to
   * be a real beat of creeping between the final click and the standstill —
   * that beat is where a player watches the six coming and cannot tell
   * whether the ticker will reach it.
   */
  it('slows enough that the last click is many times the length of the first', () => {
    const random = seeded(97)
    let angle = 0
    const ratios: number[] = []
    const tails: number[] = []
    for (let i = 0; i < 40; i += 1) {
      const spin = createWheelSpin({
        fromAngle: angle,
        result: FACES[i % 6]!,
        targetSeconds: 2.6,
        random,
      })
      const clicks = spin.clickTimes
      expect(clicks.length).toBeGreaterThan(12)
      const first = clicks[1]! - clicks[0]!
      const last = clicks[clicks.length - 1]! - clicks[clicks.length - 2]!
      ratios.push(last / first)
      tails.push(spin.duration - clicks[clicks.length - 1]!)
      // And it is a ritardando, not a step: the back half of the spin is
      // slower than the front half everywhere, not only at the very end.
      const middle = clicks[Math.floor(clicks.length / 2)]! - clicks[Math.floor(clicks.length / 2) - 1]!
      expect(middle).toBeGreaterThan(first)
      expect(last).toBeGreaterThan(middle)
      angle = spin.restAngle
    }
    expect(Math.min(...ratios)).toBeGreaterThan(4)
    // Half a second, at the very least, of the wheel creeping with nothing
    // decided — on a 2.6s spin that is the closing fifth of it.
    expect(Math.min(...tails)).toBeGreaterThan(0.5)
  })

  /**
   * The ticker straining on a peg it may not get over, and being pushed back
   * off it — the part of the childhood memory that a curve cannot fake. It
   * cannot happen on every spin (the wheel would then never stop cleanly mid
   * segment), but it has to happen often enough to be a thing the game does.
   */
  it('sometimes dies against the next peg and rocks back off it', () => {
    const random = seeded(3)
    let angle = 0
    let rocked = 0
    let strained = 0
    for (let i = 0; i < 60; i += 1) {
      const spin = createWheelSpin({
        fromAngle: angle,
        result: FACES[i % 6]!,
        targetSeconds: 2.6,
        random,
      })
      const path = trajectory(spin)
      // It reached further than it ended up: the peg pushed it back.
      if (Math.max(...path) > spin.restAngle + 0.5) rocked += 1
      // And the blade was visibly loaded while that happened.
      if (path.some((a) => tickerBend(a) > 0.5 && a > spin.restAngle)) strained += 1
      angle = spin.restAngle
    }
    expect(rocked).toBeGreaterThan(6)
    expect(strained).toBeGreaterThan(6)
  })

  /**
   * Wherever it stops, a player has to be able to read it without squinting —
   * a spinner leaning exactly on a peg is the one thing about the real toy
   * nobody misses. Both ends are guaranteed by the peg rather than by taste:
   * a wheel that scrapes over one is pushed clear of it by the ticker's own
   * spring before friction can take hold, and a wheel dying against the next
   * one can only stick where the barrier's slope is gentler than friction,
   * which is within a degree of the contact edge. So the ticker always ends
   * up the better part of a peg's width inside a segment.
   */
  it('never comes to rest leaning on a boundary', () => {
    const random = seeded(41)
    let angle = 0
    for (let i = 0; i < 80; i += 1) {
      const spin = createWheelSpin({
        fromAngle: angle,
        result: FACES[i % 6]!,
        targetSeconds: 2.6,
        random,
      })
      const within = ((spin.restAngle % SEGMENT_DEGREES) + SEGMENT_DEGREES) % SEGMENT_DEGREES
      expect(Math.min(within, SEGMENT_DEGREES - within)).toBeGreaterThan(PEG_SPAN - 1.5)
      angle = spin.restAngle
    }
  })

  /**
   * Length is emergent — a flick with further round the rim to travel really
   * does take longer — but it is not allowed to wander off and hold the turn
   * up. `TEMPO.wheelSpinSeconds` is the number a reader of that file is
   * entitled to believe.
   */
  it('lands close to the length the tempo asked for', () => {
    const random = seeded(5)
    let angle = 0
    for (let i = 0; i < 40; i += 1) {
      const spin = createWheelSpin({
        fromAngle: angle,
        result: FACES[i % 6]!,
        targetSeconds: 2.6,
        random,
      })
      expect(spin.duration).toBeGreaterThan(2.6 * 0.85)
      expect(spin.duration).toBeLessThan(2.6 * 1.2)
      angle = spin.restAngle
    }
  })

  it('starts where the wheel is and ends where it says it ends', () => {
    const spin = createWheelSpin({ fromAngle: 42, result: 4, targetSeconds: 2.6, random: seeded(8) })
    expect(spin.angleAt(0)).toBeCloseTo(42, 6)
    expect(spin.angleAt(spin.duration)).toBe(spin.restAngle)
    // Past the end there is nothing left to do: a wheel at rest is at rest.
    expect(spin.angleAt(spin.duration * 2)).toBe(spin.restAngle)
  })
})
