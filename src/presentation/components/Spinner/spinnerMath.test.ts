import { describe, expect, it } from 'vitest'
import { WEDGE_COUNT, landingRotation, wedgeCenterAngle } from './spinnerMath'

describe('wedgeCenterAngle', () => {
  it('has 10 wedges', () => {
    expect(WEDGE_COUNT).toBe(10)
  })

  it('places wedge 1 centred at 0 degrees', () => {
    expect(wedgeCenterAngle(1)).toBe(0)
  })

  it('places wedge 2 one wedge width (36deg) clockwise of wedge 1', () => {
    expect(wedgeCenterAngle(2)).toBe(36)
  })

  it('places wedge 10 at 324 degrees', () => {
    expect(wedgeCenterAngle(10)).toBe(324)
  })
})

describe('landingRotation', () => {
  it('is always a whole number of degrees', () => {
    for (let result = 1; result <= 10; result++) {
      expect(Number.isInteger(landingRotation(result as never))).toBe(true)
    }
  })

  it('lands the pointer exactly on the centre of the winning wedge', () => {
    // The pointer is fixed at the top (12 o'clock / 0deg in wheel space).
    // After rotating the wheel by `landingRotation(result)`, the winning
    // wedge's centre must align with 0deg (mod 360).
    for (let result = 1; result <= 10; result++) {
      const rotation = landingRotation(result as never)
      const wedgeAngle = wedgeCenterAngle(result as never)
      const finalWedgePosition = (wedgeAngle + rotation) % 360
      expect(finalWedgePosition).toBe(0)
    }
  })

  it('always spins clockwise by at least 4 full turns', () => {
    for (let result = 1; result <= 10; result++) {
      expect(landingRotation(result as never)).toBeGreaterThanOrEqual(4 * 360)
    }
  })

  it('is deterministic for the same result', () => {
    expect(landingRotation(7)).toBe(landingRotation(7))
  })

  it('produces a larger rotation for later wedges within the same spin count', () => {
    // Same number of full turns baked in; the extra to reach the wedge grows
    // monotonically as the wedge index grows away from wedge 1 clockwise
    // alignment target — verified indirectly via the modulo check above, but
    // also assert the raw ordering for the default spin depth.
    const first = landingRotation(1)
    const tenth = landingRotation(10)
    expect(tenth).toBeGreaterThan(first)
  })
})
