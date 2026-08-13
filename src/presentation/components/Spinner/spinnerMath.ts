import type { SpinValue } from '@domain/model/types'

/** The spinner is always drawn with 10 equal wedges. */
export const WEDGE_COUNT = 10

/** Degrees a single wedge spans. */
export const WEDGE_ANGLE = 360 / WEDGE_COUNT

/**
 * Angle (clockwise, degrees, wedge 1 centred at 0/12-o'clock) of the centre
 * of wedge `n` in the wheel's own, un-rotated coordinate space.
 */
export function wedgeCenterAngle(n: SpinValue): number {
  return (n - 1) * WEDGE_ANGLE
}

/**
 * The exact final rotation (clockwise, degrees) to apply to the wheel so
 * that wedge `result`'s centre lands under the fixed pointer at the top.
 *
 * Always spins clockwise through `turns` full rotations first, so the wheel
 * visibly spins even when the result is wedge 1. Pure and deterministic —
 * the same result always yields the same rotation, which is what the
 * component animates *to*.
 */
export function landingRotation(result: SpinValue, turns = 6): number {
  const wedgeAngle = wedgeCenterAngle(result)
  const remainder = (360 - wedgeAngle) % 360
  return turns * 360 + remainder
}
