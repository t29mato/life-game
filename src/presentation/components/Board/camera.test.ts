import { describe, expect, it } from 'vitest'
import type { Board, Space, SpaceEffect } from '@domain/model/types'
import { createProjection } from './boardLayout'
import {
  approachZoom,
  arrivalZoom,
  cameraTransform,
  flythroughShots,
  focusShot,
  handoffPanSeconds,
  restPoint,
  restShot,
  restSequence,
  routeBounds,
  shotRect,
  wideShot,
  FLYTHROUGH_ZOOM,
  FOLLOW_ZOOM,
  MILESTONE_ZOOM,
  REST_DIE_CLEARANCE,
  REST_ZOOM,
  RESOLVE_ZOOM,
  WIDE_SHOT_PADDING_TILES,
  type CameraShot,
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
  it('covers the padded bounds on at least one axis rather than merely fitting inside them', () => {
    const shot = wideShot(projection, model)
    const rect = shotRect(projection, shot)
    const bounds = routeBounds(model, projection)
    const pad = projection.tileSize * WIDE_SHOT_PADDING_TILES
    const paddedWidth = bounds.width + pad * 2
    const paddedHeight = bounds.height + pad * 2

    // Never shows more than the padded route on either axis — no axis is
    // left showing the decorative filler around it.
    expect(rect.width).toBeLessThanOrEqual(paddedWidth + 0.01)
    expect(rect.height).toBeLessThanOrEqual(paddedHeight + 0.01)

    // But at least one axis is an exact cover, not just "less than" — the
    // frame is filled, not merely shrunk to be safely inside the bounds.
    const widthCovers = Math.abs(rect.width - paddedWidth) < 0.01
    const heightCovers = Math.abs(rect.height - paddedHeight) < 0.01
    expect(widthCovers || heightCovers).toBe(true)
  })

  it('crops into the route on whichever axis the frame does not cover exactly', () => {
    // This fixture's route bounds are not the same shape as the viewBox, so
    // covering one axis necessarily crops the other rather than showing it
    // in full — the deliberate trade for a bigger-looking map.
    const shot = wideShot(projection, model)
    const rect = shotRect(projection, shot)
    const bounds = routeBounds(model, projection)
    const pad = projection.tileSize * WIDE_SHOT_PADDING_TILES

    const widthCropped = rect.width < bounds.width + pad * 2 - 0.01
    const heightCropped = rect.height < bounds.height + pad * 2 - 0.01
    expect(widthCropped || heightCropped).toBe(true)
  })

  it('zooms in past the viewBox when the route does not fill it — this fixture is built to have room to spare', () => {
    expect(wideShot(projection, model).zoom).toBeGreaterThan(1)
  })

  it('never zooms out past 1 — a route with nothing to trim still frames the whole viewBox at worst', () => {
    const empty: Board = { ...model, spaces: {} }
    expect(wideShot(projection, empty).zoom).toBe(1)
  })

  /**
   * A car parks lifted off its tile and fanned clear of whoever else is
   * there — see `pointOf` in `Board.tsx` — so its actual drawn position can
   * sit outside the plain tile-centre box `routeBounds` measures. A cover
   * crop fit only to the route could crop a car parked at the outermost
   * edge out of frame entirely; `playerPoints` is the guarantee that never
   * happens. `shotRect` separately clamps to the fixed viewBox no matter
   * what `wideShot` asks for — a point past the *viewBox's own* edge is not
   * a car this game ever actually draws, so the point used here is just
   * outside the route rather than outside the world.
   */
  it('pulls the frame out to keep a player point just outside the ordinary crop in view', () => {
    const bounds = routeBounds(model, projection)
    const justOutside = { x: bounds.x + bounds.width + projection.tileSize * 2, y: bounds.y + bounds.height / 2 }

    const rect = shotRect(projection, wideShot(projection, model, [justOutside]))

    expect(rect.x).toBeLessThanOrEqual(justOutside.x + 0.01)
    expect(rect.x + rect.width).toBeGreaterThanOrEqual(justOutside.x - 0.01)
  })

  it('leaves the ordinary cover-cropped frame untouched when every player is already inside it', () => {
    const bounds = routeBounds(model, projection)
    // Dead centre of the route — comfortably inside any reasonable crop.
    const centred = { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 }

    expect(wideShot(projection, model, [centred])).toEqual(wideShot(projection, model))
  })

  it('only ever zooms out to make room for a player, never in', () => {
    const bounds = routeBounds(model, projection)
    const justOutside = { x: bounds.x + bounds.width + projection.tileSize * 2, y: bounds.y + bounds.height / 2 }

    expect(wideShot(projection, model, [justOutside]).zoom).toBeLessThan(wideShot(projection, model).zoom)
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

/**
 * A very wide desktop window and a tall phone both ask the `<svg>` itself
 * to reveal more of the fixed viewBox than the shot alone implies — see
 * `preserveAspectRatio="xMidYMid slice"` in `Board.tsx`. Without knowing
 * the live container's own shape, the camera hands over exactly the same
 * frame either way, and whichever shape asks for more gets however much of
 * the fixed viewBox's own decorative margin that extra happens to be, real
 * route or not. `containerAspect` is how the camera is told what shape it
 * is actually being drawn into, so it can zoom in to compensate instead.
 */
describe('container aspect', () => {
  const viewAspect = projection.viewWidth / projection.viewHeight
  const wideContainer = viewAspect * 3

  it('zooms in further than the shot alone asks for when the container is a very different shape', () => {
    const shot = focusShot(projection, { x: projection.viewWidth / 2, y: projection.viewHeight / 2 }, 2)

    const plain = shotRect(projection, shot)
    const wide = shotRect(projection, shot, wideContainer)

    expect(wide.width).toBeLessThan(plain.width)
    expect(wide.height).toBeLessThan(plain.height)
  })

  it('matches the default exactly when the container already is the viewBox’s own shape', () => {
    const shot = focusShot(projection, { x: 500, y: 400 }, 1.6)

    expect(shotRect(projection, shot, viewAspect)).toEqual(shotRect(projection, shot))
    expect(cameraTransform(projection, shot, viewAspect)).toEqual(cameraTransform(projection, shot))
  })

  it('tempers the wide correction, where the narrow one stays whole', () => {
    const shot = focusShot(projection, { x: 500, y: 400 }, 1.6)

    const plain = shotRect(projection, shot)
    const wide = shotRect(projection, shot, viewAspect * 2)
    const narrow = shotRect(projection, shot, viewAspect / 2)

    // A narrow phone keeps the full correction — it is what keeps tiles
    // readable on a small screen. A wide desktop keeps only a tempered
    // share, so its frame stays larger and a big screen actually shows more
    // board — see `WIDE_STRETCH_TEMPER` and the report it answers.
    expect(wide.width * wide.height).toBeGreaterThan(narrow.width * narrow.height)

    // Tempered, not absent: the wide frame is still tighter than the plain
    // one, or a very wide window would be back to revealing whatever
    // decorative margin happens to lie past the route.
    expect(wide.width).toBeLessThan(plain.width)
    expect(wide.height).toBeLessThan(plain.height)
  })

  it('still maps the framed rectangle onto the whole viewBox, whatever the container’s shape', () => {
    const shot = focusShot(projection, { x: 400, y: 260 }, 1.9)
    const rect = shotRect(projection, shot, wideContainer)
    const t = cameraTransform(projection, shot, wideContainer)

    expect(rect.x * t.scale + t.x).toBeCloseTo(0, 5)
    expect(rect.y * t.scale + t.y).toBeCloseTo(0, 5)
    expect((rect.x + rect.width) * t.scale + t.x).toBeCloseTo(projection.viewWidth, 5)
    expect((rect.y + rect.height) * t.scale + t.y).toBeCloseTo(projection.viewHeight, 5)
  })

  /**
   * `wideShot`'s own player-visibility guarantee (see the `wideShot`
   * describe block above) is checked against the *plain* frame — this
   * pins that it still holds once `shotRect` zooms in further still for a
   * container `wideShot` was never told about, which is exactly what
   * would happen if a caller forgot to pass the same `containerAspect` to
   * both.
   */
  it('keeps a player inside the frame it actually draws, not just the one wideShot planned for', () => {
    // A moderate stretch, not `wideContainer`'s extreme one — the fallback
    // this pins is about the frame `shotRect` actually draws being tighter
    // than `wideShot` alone accounted for, not about the separate, already
    // — accepted `WIDE_ZOOM` floor a large enough stretch or overshoot can
    // hit regardless of anything `containerAspect` does.
    const moderateContainer = viewAspect * 1.4
    const bounds = routeBounds(model, projection)
    const justOutside = { x: bounds.x + bounds.width + projection.tileSize * 0.5, y: bounds.y + bounds.height / 2 }

    const shot = wideShot(projection, model, [justOutside], moderateContainer)
    const rect = shotRect(projection, shot, moderateContainer)

    expect(rect.x).toBeLessThanOrEqual(justOutside.x + 0.01)
    expect(rect.x + rect.width).toBeGreaterThanOrEqual(justOutside.x - 0.01)
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

  /**
   * The reported bug, in miniature: a wide fork elsewhere left this space's
   * own row with real board on only one side of it — a serpentine folds
   * back on itself constantly, so "nearby in board-space" and "nearby along
   * the route" are not the same thing, and a rest shot that only ever
   * leaned toward the next space had no way to notice. Every other space
   * on this fixture's board sits to the west; the frame should notice and
   * lean that way too, not stay planted dead centre on a lone space with
   * nothing ahead of it and bare board on every other side.
   */
  it('pulls toward wherever the route’s own tiles actually cluster nearby, not just toward what comes next', () => {
    const lonely = space('lonely', 10, 5, [])
    const westCluster = [space('w1', 8, 4), space('w2', 8, 5), space('w3', 8, 6)]
    const clusterBoard = board([lonely, ...westCluster], 14, 10)
    const clusterProjection = createProjection(clusterBoard)
    const centre = clusterProjection.project(lonely.layout)

    const point = restPoint(clusterBoard, clusterProjection, lonely)

    expect(point.x).toBeLessThan(centre.x)
  })
})

describe('restShot', () => {
  // A board with room on every side of the tile — below-middle on purpose,
  // since the lifted aim reaches a frame's half-height *plus* the lift above
  // the tile — so the pan is never clamped and the shot is the pure lifted
  // framing.
  const roomy = board([space('mid', 15, 20, ['on']), space('on', 16, 20)], 30, 30)
  const roomyProjection = createProjection(roomy)

  it('frames the rest point at REST_ZOOM, lifted so the car clears the die pinned to screen centre', () => {
    const at = roomy.spaces['mid'] as Space
    const point = restPoint(roomy, roomyProjection, at)
    // At the default aspect nothing is cropped, so the visible height is
    // exactly the height the shot's own rect covers.
    const lift =
      shotRect(roomyProjection, { cx: point.x, cy: point.y, zoom: REST_ZOOM }).height *
      REST_DIE_CLEARANCE
    expect(restShot(roomy, roomyProjection, at)).toEqual(
      focusShot(roomyProjection, { x: point.x, y: point.y - lift }, REST_ZOOM),
    )
  })

  it('seats the car below the frame centre, not underneath the die', () => {
    const at = roomy.spaces['mid'] as Space
    const shot = restShot(roomy, roomyProjection, at)
    const unlifted = focusShot(roomyProjection, restPoint(roomy, roomyProjection, at), REST_ZOOM)
    expect(shot.cy).toBeLessThan(unlifted.cy)
  })

  it('lifts by the same slice of *screen*, not of board, when a wide container crops vertically', () => {
    const at = roomy.spaces['mid'] as Space
    const point = restPoint(roomy, roomyProjection, at)
    const viewAspect = roomyProjection.viewWidth / roomyProjection.viewHeight
    const wide = viewAspect * 2
    // `slice` fills a doubled aspect's width and crops half the shot's rect
    // off the top and bottom — the height actually on screen is the rect's
    // own height over that same factor, and the lift follows the screen.
    const rect = shotRect(roomyProjection, { cx: point.x, cy: point.y, zoom: REST_ZOOM }, wide)
    const lift = (rect.height / 2) * REST_DIE_CLEARANCE
    expect(restShot(roomy, roomyProjection, at, wide)).toEqual(
      focusShot(roomyProjection, { x: point.x, y: point.y - lift }, REST_ZOOM, wide),
    )
  })

  /**
   * The reported regression, in miniature: a tall board whose start corner a
   * squarish window's REST_ZOOM frame pins against the edge of the card,
   * where a robbed lift can leave the car under the die at the frame's
   * centre. The contract, at *every* window shape: either the lifted pan was
   * honoured — the car hangs exactly the clearance below the die — or the
   * car is at least the clearance plus its own reach from the die in some
   * direction, and the shot never spends zoom for it.
   */
  const tall = board([space('start', 4, 3, ['on']), space('on', 5, 3)], 8, 24)
  const tallProjection = createProjection(tall)
  const tallAspect = tallProjection.viewWidth / tallProjection.viewHeight

  it('keeps the car clear of the die at every window shape, at REST_ZOOM, on the board', () => {
    const at = tall.spaces['start'] as Space
    const point = restPoint(tall, tallProjection, at)
    const car = tallProjection.project(at.layout)
    let slid = false

    for (const ratio of [0.5, 0.8, 1, 1.17, 1.4, 1.7, 2, 2.5, 3]) {
      const aspect = tallAspect * ratio
      const shot = restShot(tall, tallProjection, at, aspect)
      expect(shot.zoom).toBe(REST_ZOOM)

      // What the viewer sees: the rect over the slice crop on the shorter
      // axis. The clamp owes the *seen* band to the board, not the rect.
      const rect = shotRect(tallProjection, shot, aspect)
      const crop = Math.max(1, aspect / tallAspect)
      const spread = Math.max(1, tallAspect / aspect)
      const seenHeight = rect.height / crop
      const seenTop = shot.cy - seenHeight / 2
      expect(seenTop).toBeGreaterThanOrEqual(-1e-6)
      expect(seenTop + seenHeight).toBeLessThanOrEqual(tallProjection.viewHeight + 1e-6)
      const seenWidth = rect.width / spread
      expect(shot.cx - seenWidth / 2).toBeGreaterThanOrEqual(-1e-6)
      expect(shot.cx + seenWidth / 2).toBeLessThanOrEqual(tallProjection.viewWidth + 1e-6)

      const lift = seenHeight * REST_DIE_CLEARANCE
      // Vertical honour is what matters — the car hanging the full lift (or,
      // at the bottom edge, more) below the die — however the sides clamped.
      const honoured = shot.cy <= point.y - lift + 1e-6
      const distance = Math.hypot(car.x - shot.cx, car.y - shot.cy)
      const required = lift + tallProjection.tileSize
      // A slide that runs out of board concedes the shortfall: this fixture's
      // board is deliberately narrow enough that some window shapes exhaust
      // the sideways room, and the proof of best effort is the centre parked
      // exactly at the seen band's own bound.
      const exhausted = Math.abs(shot.cx - (tallProjection.viewWidth - seenWidth / 2)) < 1e-6
      expect(honoured || exhausted || distance + 1e-6 >= required).toBe(true)

      // A slide is recognisable by the die landing well down the road of the
      // car, toward the middle of the route.
      if (shot.cx - car.x > tallProjection.tileSize * 0.9) slid = true
    }

    // The sweep must actually have crossed the pinned band the slide exists
    // for — a sweep that never slid would be vacuously green.
    expect(slid).toBe(true)
  })
})

describe('restSequence', () => {
  it('is just the rest shot when nothing needs establishing', () => {
    const at = model.spaces['s4'] as Space
    expect(restSequence(model, projection, at, false)).toEqual([restShot(model, projection, at)])
  })

  // Asked for on exactly one occasion now — the first settle of a board
  // nobody has been framed on yet — a turn handoff pans directly instead.
  it('leads with a passing wide shot before the rest shot when asked to establish', () => {
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

/**
 * The turn-handoff pan replaced a wide-shot-then-rest sequence, so its
 * pacing has to answer for the same ground that sequence covered in two
 * hops: neighbours get the ordinary considered move, a cross-board pan a
 * slower, readable sweep — bounded, because past a point a slow camera
 * stops feeling deliberate and starts holding the next turn hostage.
 */
describe('handoffPanSeconds', () => {
  const base = 0.62
  const shotAt = (cx: number, cy: number): CameraShot => ({ cx, cy, zoom: REST_ZOOM })

  it('takes exactly the base move when the pan goes nowhere', () => {
    expect(handoffPanSeconds(projection, shotAt(300, 300), shotAt(300, 300), base)).toBe(base)
  })

  it('stretches with the distance actually crossed', () => {
    const near = handoffPanSeconds(projection, shotAt(300, 300), shotAt(300 + projection.pitch, 300), base)
    const far = handoffPanSeconds(projection, shotAt(300, 300), shotAt(300 + projection.pitch * 6, 300), base)

    expect(near).toBeGreaterThan(base)
    expect(far).toBeGreaterThan(near)
  })

  it('never dips below the base, and never runs away with a cross-board pan', () => {
    const enormous = handoffPanSeconds(projection, shotAt(0, 0), shotAt(100000, 100000), base)
    const evenMore = handoffPanSeconds(projection, shotAt(0, 0), shotAt(500000, 500000), base)

    // Capped: past the ceiling, further distance buys no further seconds.
    expect(enormous).toBe(evenMore)
    expect(enormous).toBeGreaterThan(base)
    expect(enormous).toBeLessThan(base + 1)
  })

  it('measures the same pan the same in both directions', () => {
    const from = shotAt(120, 400)
    const to = shotAt(900, 180)

    expect(handoffPanSeconds(projection, from, to, base)).toBe(handoffPanSeconds(projection, to, from, base))
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
