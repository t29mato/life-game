import { describe, expect, it } from 'vitest'
import type { Board, Space, SpaceEffect } from '@domain/model/types'
import { createProjection } from './boardLayout'
import {
  approachZoom,
  arrivalZoom,
  cameraTransform,
  flythroughShots,
  focusShot,
  restPoint,
  restShot,
  restSequence,
  routeBounds,
  shotRect,
  wideShot,
  FLYTHROUGH_ZOOM,
  FOLLOW_ZOOM,
  MILESTONE_ZOOM,
  REST_ZOOM,
  RESOLVE_ZOOM,
} from './camera'

function space(id: string, x: number, y: number, next: string[] = [], effect: SpaceEffect = { type: 'none' }): Space {
  return {
    id,
    kind: 'normal',
    title: id,
    description: id,
    effect,
    next,
    layout: { x, y },
    tone: 'blue',
    icon: 'space:payday',
  }
}

function board(spaces: Space[], width: number, height: number): Board {
  const record: Record<string, Space> = {}
  for (const s of spaces) record[s.id] = s
  return {
    spaces: record,
    startSpaceId: spaces[0]?.id ?? 'a',
    retirementSpaceId: spaces[spaces.length - 1]?.id ?? 'a',
    width,
    height,
  }
}

function route(): Board {
  const spaces: Space[] = []
  for (let i = 0; i < 12; i += 1) {
    spaces.push(space(`s${i}`, i + 1, 1 + (i % 3), i < 11 ? [`s${i + 1}`] : []))
  }
  return board(spaces, 14, 5)
}

const model = route()
const projection = createProjection(model)

describe('routeBounds', () => {
  it('bounds every tile, not the wider padded viewBox', () => {
    const bounds = routeBounds(model, projection)
    const start = projection.project({ x: 1, y: 1 })
    const end = projection.project({ x: 12, y: 1 + (11 % 3) })

    expect(bounds.x).toBeCloseTo(Math.min(start.x, end.x), 5)
    // This fixture's board is declared wider and taller (14×5) than the
    // route it actually lays out (columns 1-12, rows 1-3) — exactly the
    // shape that used to read as "the map is mostly empty ground."
    expect(bounds.width).toBeLessThan(projection.viewWidth)
    expect(bounds.height).toBeLessThan(projection.viewHeight)
  })

  it('falls back to the full viewBox when the board has no spaces to bound', () => {
    const empty: Board = { ...model, spaces: {} }
    expect(routeBounds(empty, projection)).toEqual({
      x: 0,
      y: 0,
      width: projection.viewWidth,
      height: projection.viewHeight,
    })
  })
})

describe('wideShot', () => {
  it('frames every tile with a little padding around the outermost row', () => {
    const shot = wideShot(projection, model)
    const rect = shotRect(projection, shot)
    const bounds = routeBounds(model, projection)

    expect(rect.x).toBeLessThanOrEqual(bounds.x + 0.01)
    expect(rect.y).toBeLessThanOrEqual(bounds.y + 0.01)
    expect(rect.x + rect.width).toBeGreaterThanOrEqual(bounds.x + bounds.width - 0.01)
    expect(rect.y + rect.height).toBeGreaterThanOrEqual(bounds.y + bounds.height - 0.01)
  })

  it('zooms in past the viewBox when the route does not fill it — this fixture is built to have room to spare', () => {
    expect(wideShot(projection, model).zoom).toBeGreaterThan(1)
  })

  it('never zooms out past 1 — a route with nothing to trim still frames the whole viewBox at worst', () => {
    const empty: Board = { ...model, spaces: {} }
    expect(wideShot(projection, empty).zoom).toBe(1)
  })
})

describe('focusShot', () => {
  it('centres on the point it was given when there is room either side', () => {
    const at = { x: projection.viewWidth / 2, y: projection.viewHeight / 2 }
    const shot = focusShot(projection, at, 2)

    expect(shot.cx).toBeCloseTo(at.x, 5)
    expect(shot.cy).toBeCloseTo(at.y, 5)
    expect(shot.zoom).toBe(2)
  })

  /**
   * A camera that drifts past the edge of the card shows the blank behind the
   * drawing, and the board stops reading as an object on a table. So the frame
   * is pinned inside the board however far out the subject is.
   */
  it('never shows past the edge of the board, wherever the subject is', () => {
    const corners = [
      { x: -400, y: -400 },
      { x: projection.viewWidth + 400, y: -400 },
      { x: -400, y: projection.viewHeight + 400 },
      { x: projection.viewWidth + 400, y: projection.viewHeight + 400 },
    ]

    for (const at of corners) {
      for (const zoom of [1, 1.4, 2.5, 6]) {
        const rect = shotRect(projection, focusShot(projection, at, zoom))
        expect(rect.x).toBeGreaterThanOrEqual(-1e-9)
        expect(rect.y).toBeGreaterThanOrEqual(-1e-9)
        expect(rect.x + rect.width).toBeLessThanOrEqual(projection.viewWidth + 1e-9)
        expect(rect.y + rect.height).toBeLessThanOrEqual(projection.viewHeight + 1e-9)
      }
    }
  })

  it('refuses to pull back further than the whole board', () => {
    const shot = focusShot(projection, { x: 10, y: 10 }, 0.25)

    expect(shot.zoom).toBe(1)
    expect(shotRect(projection, shot).width).toBeCloseTo(projection.viewWidth, 5)
  })

  it('is pure: the same subject always frames identically', () => {
    const at = { x: 320, y: 210 }
    expect(focusShot(projection, at, 1.7)).toEqual(focusShot(projection, at, 1.7))
  })
})

describe('cameraTransform', () => {
  /**
   * The transform is applied to a group inside a fixed viewBox, so the invariant
   * that matters is that it maps the shot's rectangle onto the whole viewBox —
   * that is what makes the subject land dead centre of the drawing.
   */
  it('maps the framed rectangle onto the whole viewBox', () => {
    const shot = focusShot(projection, { x: 400, y: 260 }, 1.9)
    const rect = shotRect(projection, shot)
    const t = cameraTransform(projection, shot)

    expect(rect.x * t.scale + t.x).toBeCloseTo(0, 5)
    expect(rect.y * t.scale + t.y).toBeCloseTo(0, 5)
    expect((rect.x + rect.width) * t.scale + t.x).toBeCloseTo(projection.viewWidth, 5)
    expect((rect.y + rect.height) * t.scale + t.y).toBeCloseTo(projection.viewHeight, 5)
  })

  it('never leaves a gap at the top or the left of the drawing', () => {
    for (const zoom of [1, 1.3, 2.2, 4]) {
      const t = cameraTransform(projection, focusShot(projection, { x: 0, y: 0 }, zoom))
      expect(t.x).toBeLessThanOrEqual(1e-9)
      expect(t.y).toBeLessThanOrEqual(1e-9)
    }
  })
})

describe('approachZoom', () => {
  it('holds the follow distance for a move that ends nowhere special', () => {
    for (let step = 0; step < 6; step += 1) {
      expect(approachZoom(step, 6, FOLLOW_ZOOM)).toBeCloseTo(FOLLOW_ZOOM, 5)
    }
  })

  it('arrives at the milestone distance on the final hop', () => {
    expect(approachZoom(5, 6, MILESTONE_ZOOM)).toBeCloseTo(MILESTONE_ZOOM, 5)
  })

  it('eases in rather than jumping, and never pulls back on the way', () => {
    const walk = [0, 1, 2, 3, 4, 5].map((step) => approachZoom(step, 6, MILESTONE_ZOOM))

    for (let i = 1; i < walk.length; i += 1) {
      expect(walk[i] as number).toBeGreaterThanOrEqual(walk[i - 1] as number)
    }
    // The ramp is short: a long move spends most of it at the follow distance.
    expect(walk[0]).toBeCloseTo(FOLLOW_ZOOM, 5)
    expect(walk[2]).toBeCloseTo(FOLLOW_ZOOM, 5)
    expect(walk[4]).toBeGreaterThan(FOLLOW_ZOOM)
  })

  it('still lands closed-in when the whole move is one hop', () => {
    expect(approachZoom(0, 1, MILESTONE_ZOOM)).toBeCloseTo(MILESTONE_ZOOM, 5)
  })

  it('falls back to the follow distance for a move with no hops', () => {
    expect(approachZoom(0, 0, MILESTONE_ZOOM)).toBe(FOLLOW_ZOOM)
  })
})

describe('arrivalZoom', () => {
  it('closes in on a milestone', () => {
    const withWedding = board([space('a', 1, 1, ['b']), space('b', 2, 1, [], { type: 'getMarried' })], 4, 3)

    expect(arrivalZoom(withWedding, 'b')).toBe(MILESTONE_ZOOM)
  })

  it('keeps its distance for an ordinary space', () => {
    expect(arrivalZoom(model, 's4')).toBe(FOLLOW_ZOOM)
  })

  it('keeps its distance for a space that is not on the board', () => {
    expect(arrivalZoom(model, 'nowhere')).toBe(FOLLOW_ZOOM)
    expect(arrivalZoom(model, undefined)).toBe(FOLLOW_ZOOM)
  })
})

describe('restPoint', () => {
  it('sits dead centre on a space with nothing after it', () => {
    const dead = space('dead', 6, 2)
    expect(restPoint(model, projection, dead)).toEqual(projection.project(dead.layout))
  })

  it('leans toward the next space rather than sitting dead centre on the car', () => {
    const at = model.spaces['s4'] as Space
    const centre = projection.project(at.layout)
    const next = model.spaces[at.next[0] as string] as Space
    const nextPoint = projection.project(next.layout)
    const point = restPoint(model, projection, at)

    // Strictly between the two: closer to the car than to the next space,
    // since this is a nudge toward what's ahead, not a second camera pointed
    // down the road.
    expect(point.x).toBeGreaterThan(centre.x)
    expect(point.x).toBeLessThan(nextPoint.x)
  })

  it('leans toward the average of every branch at a fork, favouring none of them', () => {
    const fork = board([space('f', 1, 2, ['up', 'down']), space('up', 2, 1), space('down', 2, 3)], 4, 5)
    const forkProjection = createProjection(fork)
    const at = fork.spaces['f'] as Space
    const centre = forkProjection.project(at.layout)
    const point = restPoint(fork, forkProjection, at)

    // The two branches sit symmetrically above and below the fork, so the
    // lean moves the frame sideways without favouring either one vertically.
    expect(point.y).toBeCloseTo(centre.y, 5)
    expect(point.x).toBeGreaterThan(centre.x)
  })

  it('is pure: the same space always leans the same way', () => {
    const at = model.spaces['s4'] as Space
    expect(restPoint(model, projection, at)).toEqual(restPoint(model, projection, at))
  })
})

describe('restShot', () => {
  it('frames the rest point at REST_ZOOM', () => {
    const at = model.spaces['s4'] as Space
    expect(restShot(model, projection, at)).toEqual(
      focusShot(projection, restPoint(model, projection, at), REST_ZOOM),
    )
  })
})

describe('restSequence', () => {
  it('is just the rest shot when nothing needs establishing', () => {
    const at = model.spaces['s4'] as Space
    expect(restSequence(model, projection, at, false)).toEqual([restShot(model, projection, at)])
  })

  it('leads with a passing wide shot before the rest shot when a new player is handed the table', () => {
    const at = model.spaces['s4'] as Space
    expect(restSequence(model, projection, at, true)).toEqual([
      wideShot(projection, model),
      restShot(model, projection, at),
    ])
  })

  it('falls back to the wide shot when there is no space to rest on', () => {
    expect(restSequence(model, projection, undefined, false)).toEqual([wideShot(projection, model)])
    expect(restSequence(model, projection, undefined, true)).toEqual([
      wideShot(projection, model),
      wideShot(projection, model),
    ])
  })
})

describe('flythroughShots', () => {
  it('starts at the start and ends framing the whole board', () => {
    const shots = flythroughShots(model, projection)
    const first = shots[0]
    const last = shots[shots.length - 1]
    const start = projection.project({ x: 1, y: 1 })

    expect(first?.cx).toBeCloseTo(focusShot(projection, start, FLYTHROUGH_ZOOM).cx, 5)
    expect(last).toEqual(wideShot(projection, model))
  })

  it('sweeps forward along the route without doubling back', () => {
    const shots = flythroughShots(model, projection).slice(0, -1)

    for (let i = 1; i < shots.length; i += 1) {
      expect((shots[i] as { cx: number }).cx).toBeGreaterThanOrEqual((shots[i - 1] as { cx: number }).cx)
    }
  })

  it('is deterministic', () => {
    expect(flythroughShots(model, projection)).toEqual(flythroughShots(model, projection))
  })

  it('reaches the far end of the route, not just the first few spaces', () => {
    const shots = flythroughShots(model, projection)
    const end = projection.project({ x: 12, y: 1 + (11 % 3) })
    const penultimate = shots[shots.length - 2]

    expect(penultimate?.cx).toBeCloseTo(focusShot(projection, end, FLYTHROUGH_ZOOM).cx, 5)
  })

  it('asks for no more stops than the route has spaces', () => {
    const stubby = board([space('a', 1, 1, ['b']), space('b', 2, 1)], 5, 3)
    const shots = flythroughShots(stubby, createProjection(stubby), 8)

    // Two spaces, plus the wide shot it always settles on.
    expect(shots).toHaveLength(3)
  })

  it('degrades to a single wide shot when the board has no start space', () => {
    const empty: Board = { ...model, spaces: {}, startSpaceId: 'gone' }

    expect(flythroughShots(empty, projection)).toEqual([wideShot(projection, empty)])
  })

  it('does not loop forever on a route that circles back on itself', () => {
    const loop = board(
      [space('a', 1, 1, ['b']), space('b', 2, 1, ['c']), space('c', 3, 1, ['a'])],
      5,
      3,
    )

    expect(flythroughShots(loop, createProjection(loop))).toHaveLength(4)
  })
})

describe('the distances themselves', () => {
  it('gets closer the more the moment matters', () => {
    expect(FOLLOW_ZOOM).toBeGreaterThan(1)
    expect(REST_ZOOM).toBeGreaterThan(FOLLOW_ZOOM)
    expect(RESOLVE_ZOOM).toBeGreaterThan(REST_ZOOM)
    expect(MILESTONE_ZOOM).toBeGreaterThan(RESOLVE_ZOOM)
  })
})
