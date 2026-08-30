import type { SpinValue } from '@domain/model/types'

/**
 * Where the pips sit on each face, in the die's own unit square.
 *
 * A die's faces are not a font — they are six fixed arrangements everybody
 * already knows by sight, and getting one wrong is the sort of thing a player
 * notices before they can say why. So they are written out once, as data, and
 * checked by a test rather than trusted to a loop.
 *
 * Three columns and three rows, at a quarter, a half and three quarters of
 * the face. Every layout is symmetric about the centre, which is what makes a
 * die read as a die at any size.
 */
const LOW = 0.26
const MID = 0.5
const HIGH = 0.74

export type PipPoint = readonly [x: number, y: number]

const TOP_LEFT: PipPoint = [LOW, LOW]
const TOP_RIGHT: PipPoint = [HIGH, LOW]
const MID_LEFT: PipPoint = [LOW, MID]
const CENTRE: PipPoint = [MID, MID]
const MID_RIGHT: PipPoint = [HIGH, MID]
const BOTTOM_LEFT: PipPoint = [LOW, HIGH]
const BOTTOM_RIGHT: PipPoint = [HIGH, HIGH]

const PIP_LAYOUTS: Readonly<Record<SpinValue, readonly PipPoint[]>> = {
  1: [CENTRE],
  2: [TOP_LEFT, BOTTOM_RIGHT],
  3: [TOP_LEFT, CENTRE, BOTTOM_RIGHT],
  4: [TOP_LEFT, TOP_RIGHT, BOTTOM_LEFT, BOTTOM_RIGHT],
  5: [TOP_LEFT, TOP_RIGHT, CENTRE, BOTTOM_LEFT, BOTTOM_RIGHT],
  6: [TOP_LEFT, MID_LEFT, BOTTOM_LEFT, TOP_RIGHT, MID_RIGHT, BOTTOM_RIGHT],
}

/** The pips printed on `face`, in the die's own unit square. */
export function pipsFor(face: SpinValue): readonly PipPoint[] {
  return PIP_LAYOUTS[face]
}

/**
 * A rotation in CSS's own convention: `rotateX(rx)` then `rotateY(ry)`, in
 * degrees, in CSS's coordinate frame — x right, y *down*, z toward the viewer.
 */
export type CubeRotation = readonly [rx: number, ry: number]

/**
 * Where each face sits on the cube, as the rotation that carries the front
 * plane onto it (each face is then pushed out along its own z by half the
 * cube's depth). Not a free choice: a real die keeps 1 opposite 6, 2 opposite
 * 5 and 3 opposite 4 — every pair sums to 7 — and runs 1, 2, 3
 * counter-clockwise around their shared corner, the Western handedness every
 * mass-produced die uses. Players know both facts by sight without being able
 * to name either, so the arrangement is data checked by a test, not something
 * rederived wherever a face is drawn.
 */
export const FACE_PLACEMENTS: Readonly<Record<SpinValue, CubeRotation>> = {
  1: [0, 0], // front
  2: [90, 0], // top
  3: [0, -90], // left
  4: [0, 90], // right
  5: [-90, 0], // bottom
  6: [0, 180], // back
}

/**
 * The whole-cube rotation that brings each face around to point at the
 * viewer. Inverse of the placement above — and, like it, verified by a test
 * that actually rotates the face normals rather than trusting anyone's head
 * for 3D angle signs: rotating the cube by `SETTLE_ROTATIONS[n]` must leave
 * face n's normal pointing out of the screen.
 */
export const SETTLE_ROTATIONS: Readonly<Record<SpinValue, CubeRotation>> = {
  1: [0, 0],
  2: [-90, 0],
  3: [0, 90],
  4: [0, -90],
  5: [90, 0],
  6: [0, 180],
}
