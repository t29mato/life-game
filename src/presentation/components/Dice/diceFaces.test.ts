import { describe, expect, it } from 'vitest'
import type { SpinValue } from '@domain/model/types'
import { FACE_PLACEMENTS, SETTLE_ROTATIONS, pipsFor, type CubeRotation } from './diceFaces'

const FACES: readonly SpinValue[] = [1, 2, 3, 4, 5, 6]

describe('pipsFor', () => {
  it('prints as many pips as the face is worth', () => {
    for (const face of FACES) {
      expect(pipsFor(face)).toHaveLength(face)
    }
  })

  it('never prints the same pip twice on one face', () => {
    for (const face of FACES) {
      const keys = pipsFor(face).map(([x, y]) => `${x},${y}`)
      expect(new Set(keys).size).toBe(keys.length)
    }
  })

  it('keeps every face symmetric about its centre, the way a real die is', () => {
    // The property that makes a die readable at a glance: rotate any face a
    // half turn and it is the same face. Getting this wrong is the sort of
    // thing a player notices before they can say why.
    for (const face of FACES) {
      const keys = new Set(pipsFor(face).map(([x, y]) => `${x.toFixed(3)},${y.toFixed(3)}`))
      for (const [x, y] of pipsFor(face)) {
        expect(keys).toContain(`${(1 - x).toFixed(3)},${(1 - y).toFixed(3)}`)
      }
    }
  })

  it('keeps every pip inside the face', () => {
    for (const face of FACES) {
      for (const [x, y] of pipsFor(face)) {
        expect(x).toBeGreaterThan(0)
        expect(x).toBeLessThan(1)
        expect(y).toBeGreaterThan(0)
        expect(y).toBeLessThan(1)
      }
    }
  })
})

/*
 * The cube's geometry, checked by actually rotating vectors rather than by
 * comparing angle tables against each other — the tables could agree with one
 * another and still both be wrong. The matrices below are CSS's own rotateX /
 * rotateY, in CSS's frame: x right, y down, z toward the viewer. A transform
 * written `rotateX(a) rotateY(b)` applies Ry first, then Rx, to a point in
 * the element's own space.
 */
type Vec = readonly [number, number, number]

function rotateX(deg: number, [x, y, z]: Vec): Vec {
  const t = (deg * Math.PI) / 180
  return [x, y * Math.cos(t) - z * Math.sin(t), y * Math.sin(t) + z * Math.cos(t)]
}

function rotateY(deg: number, [x, y, z]: Vec): Vec {
  const t = (deg * Math.PI) / 180
  return [x * Math.cos(t) + z * Math.sin(t), y, -x * Math.sin(t) + z * Math.cos(t)]
}

function applyRotation([rx, ry]: CubeRotation, v: Vec): Vec {
  return rotateX(rx, rotateY(ry, v))
}

/** The outward normal of `face` on the resting cube, from its placement. */
function faceNormal(face: SpinValue): Vec {
  // A face starts life in the front plane, normal out of the screen, before
  // its placement rotation carries it to its side of the cube.
  return applyRotation(FACE_PLACEMENTS[face], [0, 0, 1])
}

function round(v: Vec): Vec {
  return [Math.round(v[0]), Math.round(v[1]), Math.round(v[2])]
}

describe('cube geometry', () => {
  it('puts the six faces on six distinct sides of the cube', () => {
    const sides = new Set(FACES.map((face) => round(faceNormal(face)).join(',')))
    expect(sides.size).toBe(6)
    // And every normal is a unit vector along an axis — a cube side, not a
    // rotation that left a face on some diagonal.
    for (const face of FACES) {
      const normal = round(faceNormal(face))
      expect(Math.abs(normal[0]) + Math.abs(normal[1]) + Math.abs(normal[2])).toBe(1)
    }
  })

  it('keeps every opposite pair summing to 7, the way every physical die does', () => {
    for (const face of FACES) {
      const behind = round(faceNormal(face)).map((c) => -c)
      const opposite = FACES.find((other) => round(faceNormal(other)).join(',') === behind.join(','))
      expect(opposite, `face ${face} has no opposite`).toBeDefined()
      expect(face + opposite!).toBe(7)
    }
  })

  it('runs 1, 2, 3 counter-clockwise around their shared corner (Western handedness)', () => {
    // Circulation test: walk the three face centres (which sit along their
    // normals) around the corner they share, and take the scalar triple
    // product with the corner direction. In a right-handed frame a positive
    // sign means counter-clockwise seen from outside — but CSS's y points
    // *down*, a mirrored frame, so the sign flips: visually counter-clockwise
    // is a *negative* triple product here.
    const [n1, n2, n3] = [faceNormal(1), faceNormal(2), faceNormal(3)]
    const corner: Vec = [n1[0] + n2[0] + n3[0], n1[1] + n2[1] + n3[1], n1[2] + n2[2] + n3[2]]
    const a: Vec = [n2[0] - n1[0], n2[1] - n1[1], n2[2] - n1[2]]
    const b: Vec = [n3[0] - n2[0], n3[1] - n2[1], n3[2] - n2[2]]
    const cross: Vec = [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0],
    ]
    const triple = cross[0] * corner[0] + cross[1] * corner[1] + cross[2] * corner[2]
    expect(triple).toBeLessThan(0)
  })

  it('settles showing exactly the face it was asked to', () => {
    for (const face of FACES) {
      for (const candidate of FACES) {
        const shown = round(applyRotation(SETTLE_ROTATIONS[face], faceNormal(candidate))).join(',')
        // Only the requested face may point out of the screen at the viewer.
        if (candidate === face) {
          expect(shown, `settling on ${face}`).toBe('0,0,1')
        } else {
          expect(shown, `settling on ${face} also shows ${candidate}`).not.toBe('0,0,1')
        }
      }
    }
  })
})
