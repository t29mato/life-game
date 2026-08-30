import { describe, expect, it } from 'vitest'
import type { Board, Space, SpaceTone } from '@domain/model/types'
import {
  boardLanes,
  capitalSkylineFor,
  clamp,
  coastline,
  createProjection,
  districtBySpace,
  editionSceneryKind,
  fanSlot,
  forkPockets,
  pawnSlot,
  ridges,
  roundedPolyline,
  routeStrands,
  scatterScenery,
  sceneryExtent,
  slabMetrics,
  spaceAccent,
  spaceCaption,
  terrainRegions,
  type BoardProjection,
  type Point,
  type SpaceAccent,
} from './boardLayout'

function space(id: string, x: number, y: number, next: string[] = [], tone: SpaceTone = 'blue'): Space {
  return {
    id,
    kind: 'normal',
    title: id,
    description: id,
    effect: { type: 'none' },
    next,
    layout: { x, y },
    tone,
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

/**
 * A miniature of the real board's shape: a start that forks, two lanes that
 * rejoin on a tile which immediately forks again, two more lanes, and a run to
 * the end. Everything that reads the route's structure is exercised against
 * this rather than against the game's own content, so a change to the game's
 * spaces cannot quietly rewrite what these tests mean.
 */
function forkedSpaces(): Space[] {
  return [
    space('a', 1, 2, ['b1', 'c1'], 'slate'),
    space('b1', 2, 1, ['b2'], 'blue'),
    space('b2', 3, 1, ['b3'], 'blue'),
    space('b3', 4, 1, ['f'], 'blue'),
    space('c1', 2, 3, ['c2'], 'orange'),
    space('c2', 3, 3, ['c3'], 'orange'),
    space('c3', 4, 3, ['f'], 'orange'),
    space('f', 5, 2, ['g1', 'h1'], 'gold'),
    space('g1', 6, 1, ['g2'], 'orange'),
    space('g2', 7, 1, ['g3'], 'orange'),
    space('g3', 8, 1, ['z'], 'orange'),
    space('h1', 6, 3, ['h2'], 'green'),
    space('h2', 7, 3, ['h3'], 'green'),
    space('h3', 8, 3, ['z'], 'green'),
    space('z', 9, 2, ['z2'], 'slate'),
    space('z2', 10, 2, ['end'], 'slate'),
    space('end', 11, 2, [], 'gold'),
  ]
}

function forkedBoard(): Board {
  return board(forkedSpaces(), 12, 5)
}

function tilePoints(model: Board, projection: BoardProjection): Point[] {
  return Object.values(model.spaces).map((s) => projection.project(s.layout))
}

function distanceToSegment(point: Point, a: Point, b: Point): number {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const lengthSquared = dx * dx + dy * dy
  if (lengthSquared === 0) return Math.hypot(point.x - a.x, point.y - a.y)
  const t = clamp(((point.x - a.x) * dx + (point.y - a.y) * dy) / lengthSquared, 0, 1)
  return Math.hypot(point.x - (a.x + dx * t), point.y - (a.y + dy * t))
}

function routeSegments(model: Board, projection: BoardProjection): [Point, Point][] {
  const segments: [Point, Point][] = []
  for (const s of Object.values(model.spaces)) {
    for (const nextId of s.next) {
      const next = model.spaces[nextId]
      if (!next) continue
      segments.push([projection.project(s.layout), projection.project(next.layout)])
    }
  }
  return segments
}

describe('clamp', () => {
  it('returns the value when inside the range', () => {
    expect(clamp(5, 0, 10)).toBe(5)
  })

  it('clamps to the minimum', () => {
    expect(clamp(-5, 0, 10)).toBe(0)
  })

  it('clamps to the maximum', () => {
    expect(clamp(50, 0, 10)).toBe(10)
  })

  it('handles an inverted min/max by treating the smaller as the floor', () => {
    expect(clamp(5, 10, 0)).toBe(5)
  })
})

describe('createProjection', () => {
  /**
   * The domain places spaces in abstract units — the real board is only ~23
   * units wide — so the projection is what turns those into a viewBox big
   * enough to draw in. Getting this wrong collapses all 68 tiles into a few
   * pixels at the origin, which is exactly the bug these tests pin down.
   */
  it('scales a one-unit board grid up to a drawable viewBox', () => {
    const b = board([space('a', 1, 1, ['b']), space('b', 2, 1)], 17, 15)
    const projection = createProjection(b)

    expect(projection.viewWidth).toBeGreaterThan(500)
    expect(projection.viewHeight).toBeGreaterThan(500)
    expect(projection.tileSize).toBeGreaterThan(20)
  })

  it('places adjacent spaces exactly one tile pitch apart', () => {
    const b = board([space('a', 1, 1, ['b']), space('b', 2, 1)], 17, 15)
    const projection = createProjection(b)

    const a = projection.project({ x: 1, y: 1 })
    const next = projection.project({ x: 2, y: 1 })

    expect(next.x - a.x).toBeCloseTo(projection.pitch, 5)
    expect(next.y - a.y).toBeCloseTo(0, 5)
  })

  it('places spaces one row apart exactly one row pitch apart', () => {
    const b = board([space('a', 1, 1, ['b']), space('b', 2, 1)], 17, 15)
    const projection = createProjection(b)

    const a = projection.project({ x: 1, y: 1 })
    const below = projection.project({ x: 1, y: 2 })

    expect(below.y - a.y).toBeCloseTo(projection.rowPitch, 5)
    expect(below.x - a.x).toBeCloseTo(0, 5)
  })

  /**
   * A fork's two lanes sit one row above and below their trunk. If the road is
   * as wide as the rows are far apart, those parallel stretches merge into one
   * fat band and the board stops reading as a route. The vertical stretch
   * exists to buy this gap, so the gap is what gets pinned.
   */
  it('keeps two lanes one row apart from touching, road and all', () => {
    const projection = createProjection(forkedBoard())

    expect(projection.rowPitch - projection.roadCasingWidth).toBeGreaterThan(
      projection.tileSize * 0.3,
    )
  })

  it('draws the road wider than the tiles printed on it', () => {
    const projection = createProjection(forkedBoard())

    expect(projection.roadWidth).toBeGreaterThan(projection.tileSize)
    expect(projection.roadEdgeWidth).toBeGreaterThan(projection.roadWidth)
    expect(projection.roadCasingWidth).toBeGreaterThan(projection.roadEdgeWidth)
  })

  it('leaves tiles smaller than the pitch so they never touch', () => {
    const b = board([space('a', 1, 1, ['b']), space('b', 2, 1)], 17, 15)
    const projection = createProjection(b)

    expect(projection.tileSize).toBeLessThan(projection.pitch)
  })

  /**
   * The projection stretches the vertical axis, but it must stretch it evenly:
   * one board unit has to be the same distance everywhere on the board or the
   * domain's serpentine stops lining up with itself.
   */
  it('gives every board unit the same size along each axis', () => {
    const b = board([space('a', 1, 1, ['b']), space('b', 2, 1)], 20, 10)
    const projection = createProjection(b)

    const columns = [0, 1, 2, 3].map((x) => projection.project({ x, y: 0 }).x)
    const rows = [0, 1, 2, 3].map((y) => projection.project({ x: 0, y }).y)

    expect(columns[1]! - columns[0]!).toBeCloseTo(columns[3]! - columns[2]!, 5)
    expect(rows[1]! - rows[0]!).toBeCloseTo(rows[3]! - rows[2]!, 5)
  })

  /**
   * Tiles are drawn centred on their point, milestones are drawn larger still,
   * and captions hang below them. Without a margin the outermost of those spill
   * past the viewBox and are silently clipped — which is exactly what happened
   * to the "RETIRE" caption on the bottom row.
   */
  it('leaves room around the board for oversized tiles and their captions', () => {
    const b = board([space('a', 1, 1, ['b']), space('b', 2, 1)], 20, 10)
    const projection = createProjection(b)

    expect(projection.margin).toBeGreaterThanOrEqual(projection.tileSize)
    expect(projection.marginY).toBeGreaterThanOrEqual(projection.tileSize)
  })

  it('keeps a space on the outer edge fully inside the viewBox', () => {
    // A board whose last space sits exactly on the declared bounds.
    const b = board([space('a', 1, 1, ['b']), space('b', 2, 1), space('edge', 6, 4)], 6, 4)
    const projection = createProjection(b)
    const at = projection.project({ x: 6, y: 4 })

    expect(at.x + projection.tileSize / 2).toBeLessThanOrEqual(projection.viewWidth)
    expect(at.y + projection.tileSize / 2 + projection.marginY / 2).toBeLessThanOrEqual(
      projection.viewHeight,
    )
  })

  it('produces the same layout whatever unit scale the domain happens to use', () => {
    // The same board expressed in units of 1 and units of 100 must render identically.
    const small = createProjection(board([space('a', 1, 1, ['b']), space('b', 2, 1)], 17, 15))
    const large = createProjection(
      board([space('a', 100, 100, ['b']), space('b', 200, 100)], 1700, 1500),
    )

    expect(large.viewWidth).toBeCloseTo(small.viewWidth, 5)
    expect(large.tileSize).toBeCloseTo(small.tileSize, 5)

    const smallStep = small.project({ x: 2, y: 1 }).x - small.project({ x: 1, y: 1 }).x
    const largeStep = large.project({ x: 200, y: 100 }).x - large.project({ x: 100, y: 100 }).x
    expect(largeStep).toBeCloseTo(smallStep, 5)
  })

  it('projects every space of a realistic board inside the viewBox', () => {
    const spaces: Space[] = []
    for (let i = 0; i < 16; i += 1) {
      spaces.push(space(`s${i}`, i + 1, 1 + (i % 3), i < 15 ? [`s${i + 1}`] : []))
    }
    const projection = createProjection(board(spaces, 18, 6))

    for (const s of spaces) {
      const point = projection.project(s.layout)
      expect(point.x).toBeGreaterThanOrEqual(0)
      expect(point.x).toBeLessThanOrEqual(projection.viewWidth)
      expect(point.y).toBeGreaterThanOrEqual(0)
      expect(point.y).toBeLessThanOrEqual(projection.viewHeight)
    }
  })

  it('falls back to a sane projection when no spaces are connected', () => {
    const projection = createProjection(board([space('a', 1, 1)], 10, 10))

    expect(projection.pitch).toBeGreaterThan(0)
    expect(projection.tileSize).toBeGreaterThan(0)
    expect(Number.isFinite(projection.viewWidth)).toBe(true)
  })

  it('ignores edges that point at spaces which do not exist', () => {
    const projection = createProjection(board([space('a', 1, 1, ['ghost'])], 10, 10))

    expect(Number.isFinite(projection.viewWidth)).toBe(true)
    expect(projection.viewWidth).toBeGreaterThan(0)
  })

  /**
   * The board is drawn from a chair rather than from directly overhead, so a
   * space is a slab standing on the map: `project` says where it stands and
   * `lift` says how far off the map its printed face is. The two of them are
   * the whole camera, and both have to be pure — a projection that answered
   * differently on a second call would tear the board apart across renders.
   */
  it('rakes the camera enough for a tile to show a side wall, but not so far it becomes an elevation', () => {
    const projection = createProjection(forkedBoard())

    expect(projection.rake).toBeGreaterThan(0)
    expect(projection.rake).toBeLessThan(1)
    expect(projection.tileDepth).toBeGreaterThan(2)
    expect(projection.tileDepth).toBeLessThan(projection.tileSize / 2)
  })

  it('raises a face straight up the screen, never sideways', () => {
    const projection = createProjection(forkedBoard())
    const at = projection.project({ x: 3, y: 1 })
    const face = projection.lift(at, projection.tileDepth)

    expect(face.x).toBe(at.x)
    expect(at.y - face.y).toBeCloseTo(projection.tileDepth, 5)
  })

  it('lifts nothing when nothing stands there', () => {
    const projection = createProjection(forkedBoard())
    const at = projection.project({ x: 3, y: 1 })

    expect(projection.lift(at, 0)).toEqual(at)
  })

  it('is pure: projecting and lifting the same point twice gives the same answer', () => {
    const projection = createProjection(forkedBoard())
    const point = { x: 4.5, y: 2 }

    expect(projection.project(point)).toEqual(projection.project(point))
    expect(projection.lift(projection.project(point), 17)).toEqual(
      projection.lift(projection.project(point), 17),
    )
  })

  it('is deterministic: two projections of the same board agree everywhere', () => {
    const model = forkedBoard()
    const first = createProjection(model)
    const second = createProjection(model)

    expect(second.viewWidth).toBe(first.viewWidth)
    expect(second.viewHeight).toBe(first.viewHeight)
    expect(second.tileDepth).toBe(first.tileDepth)
    for (const s of Object.values(model.spaces)) {
      expect(second.project(s.layout)).toEqual(first.project(s.layout))
    }
  })

  /**
   * Raising every face by its own thickness moves the whole board up the
   * screen. The margin has to absorb that or the top row is quietly clipped.
   */
  it('leaves room above the board for the tallest slab it will ever draw', () => {
    const model = forkedBoard()
    const projection = createProjection(model)
    const tallest = slabMetrics(projection, 'milestone')
    const topmost = Math.min(...tilePoints(model, projection).map((point) => point.y))

    expect(topmost - tallest.depth - tallest.half).toBeGreaterThan(0)
  })
})

describe('slabMetrics', () => {
  const projection = createProjection(forkedBoard())
  const accents: readonly SpaceAccent[] = ['milestone', 'stop', 'payday', 'plain']

  /**
   * Height is the board's grammar for importance. A player looking for
   * somewhere worth aiming a spin at reads the silhouette before they read a
   * colour or an icon, so the ordering below is the feature, not a detail.
   */
  it('cuts a milestone taller than every other kind of space', () => {
    const milestone = slabMetrics(projection, 'milestone').depth

    for (const accent of accents) {
      if (accent === 'milestone') continue
      expect(milestone).toBeGreaterThan(slabMetrics(projection, accent).depth)
    }
  })

  it('cuts a forced stop proud of an ordinary space', () => {
    expect(slabMetrics(projection, 'stop').depth).toBeGreaterThan(
      slabMetrics(projection, 'plain').depth,
    )
  })

  it('prints a milestone wider than an ordinary space, and the rest the same', () => {
    expect(slabMetrics(projection, 'milestone').size).toBeGreaterThan(projection.tileSize)
    for (const accent of ['stop', 'payday', 'plain'] as const) {
      expect(slabMetrics(projection, accent).size).toBe(projection.tileSize)
    }
  })

  it('gives every slab a face, a corner radius and a wall', () => {
    for (const accent of accents) {
      const slab = slabMetrics(projection, accent)
      expect(slab.half).toBeCloseTo(slab.size / 2, 10)
      expect(slab.radius).toBeGreaterThan(0)
      expect(slab.radius).toBeLessThan(slab.half)
      expect(slab.depth).toBeGreaterThan(0)
    }
  })

  it('is pure', () => {
    for (const accent of accents) {
      expect(slabMetrics(projection, accent)).toEqual(slabMetrics(projection, accent))
    }
  })

  /**
   * Two slabs that overlap would hide each other's icon, and a taller one would
   * hide the face of whatever stands behind it. Checked against the drawn
   * extent — face plus wall — of every pair of spaces on the board, so the
   * guarantee survives any rearrangement the domain makes.
   */
  it('never lets two spaces collide, wall and all', () => {
    const model = forkedBoard()
    const drawn = Object.values(model.spaces).map((s) => {
      const at = createProjection(model).project(s.layout)
      const slab = slabMetrics(createProjection(model), spaceAccent(s))
      const face = createProjection(model).lift(at, slab.depth)
      return {
        id: s.id,
        left: face.x - slab.half,
        right: face.x + slab.half,
        // Top of the raised face down to the foot of the wall on the board.
        top: face.y - slab.half,
        bottom: at.y + slab.half,
      }
    })

    for (let i = 0; i < drawn.length; i += 1) {
      for (let j = i + 1; j < drawn.length; j += 1) {
        const a = drawn[i] as (typeof drawn)[number]
        const b = drawn[j] as (typeof drawn)[number]
        const overlaps =
          a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom
        expect(overlaps, `${a.id} overlaps ${b.id}`).toBe(false)
      }
    }
  })
})

describe('pawnSlot', () => {
  /**
   * Several players can share a space, and a car is far wider than it is deep.
   * Parking them in echelon — each a step further down the board than the last
   * — is what keeps every car's roofline and every passenger countable, and is
   * also what lets the board be drawn back to front.
   */
  it('parks a lone player dead centre', () => {
    expect(pawnSlot(0, 1)).toEqual({ x: 0, y: 0 })
    expect(pawnSlot(0, 0)).toEqual({ x: 0, y: 0 })
  })

  it('never parks two players on the same row, so none is hidden behind another', () => {
    for (let count = 2; count <= 6; count += 1) {
      const rows = Array.from({ length: count }, (_, index) => pawnSlot(index, count).y)
      expect(new Set(rows).size).toBe(count)
    }
  })

  it('spreads them evenly and symmetrically about the tile centre', () => {
    for (let count = 2; count <= 6; count += 1) {
      const slots = Array.from({ length: count }, (_, index) => pawnSlot(index, count))
      const sumY = slots.reduce((total, slot) => total + slot.y, 0)
      const sumX = slots.reduce((total, slot) => total + slot.x, 0)

      expect(sumY).toBeCloseTo(0, 10)
      expect(sumX).toBeCloseTo(0, 10)
    }
  })

  it('keeps every slot inside one tile of the centre', () => {
    for (let count = 2; count <= 6; count += 1) {
      for (let index = 0; index < count; index += 1) {
        const slot = pawnSlot(index, count)
        expect(Math.abs(slot.x)).toBeLessThanOrEqual(1)
        expect(Math.abs(slot.y)).toBeLessThanOrEqual(1)
      }
    }
  })

  it('orders the fan by player, so a car never swaps places with a rival', () => {
    for (let count = 2; count <= 6; count += 1) {
      for (let index = 1; index < count; index += 1) {
        expect(pawnSlot(index, count).y).toBeGreaterThan(pawnSlot(index - 1, count).y)
      }
    }
  })

  it('is pure', () => {
    expect(pawnSlot(2, 4)).toEqual(pawnSlot(2, 4))
  })
})

describe('fanSlot', () => {
  /**
   * The reported bug, reproduced: two players stopped on the same space and
   * their cars overlapped so completely they read as one. The board fanned
   * every car out against the *whole table* rather than the players actually
   * sharing that tile — reserving a bay for every one of a four-player game's
   * seats even when only two of them were ever on this space together, which
   * left that pair in two of the four tightly-packed *middle* bays instead of
   * the two most-separated ones.
   *
   * These assert on `fanSlot`'s own numbers, not on anything rendered: jsdom
   * performs no layout, so a pixel or bounding-box assertion here would only
   * ever prove that *some* number was written to the DOM, never that it was
   * far enough from its neighbour's to read as a separate car. The geometry
   * this function returns — how far apart two co-parked cars actually are —
   * is the whole fix, so it is what gets pinned.
   */
  it('gives two players sharing a space the two most-separated bays, however many others are in the game', () => {
    // Four players in the game; only the middle two (by seat) share a tile.
    // The old behaviour fanned against all four seats and parked this exact
    // pair — the two *interior* bays — almost on top of each other.
    const spaces = [undefined, 'shared', 'shared', undefined]

    expect(fanSlot(spaces, 1, 'shared')).toEqual(pawnSlot(0, 2))
    expect(fanSlot(spaces, 2, 'shared')).toEqual(pawnSlot(1, 2))
    expect(fanSlot(spaces, 1, 'shared')).not.toEqual(fanSlot(spaces, 2, 'shared'))
  })

  it('never gives two players sharing a space the same slot, at any table size', () => {
    for (let seats = 2; seats <= 4; seats += 1) {
      for (let sharing = 2; sharing <= seats; sharing += 1) {
        const spaces = Array.from({ length: seats }, (_, index) =>
          index < sharing ? 'shared' : `elsewhere-${index}`,
        )
        const slots = spaces.map((spaceId, index) => fanSlot(spaces, index, spaceId))

        const key = (slot: Point): string => `${slot.x},${slot.y}`
        const shared = slots.slice(0, sharing).map(key)
        expect(new Set(shared).size).toBe(sharing)
      }
    }
  })

  it('parks a player dead centre when nobody else is on their space, no matter how crowded the game is', () => {
    const spaces = ['alone', 'busy', 'busy', 'busy']

    expect(fanSlot(spaces, 0, 'alone')).toEqual({ x: 0, y: 0 })
  })

  it('counts a player as present at the space it is asked about even if their own record disagrees', () => {
    // A car mid-hop is still fanned against whoever is already parked at the
    // space it is approaching, before the store has recorded it as arrived.
    const spaces = ['start', 'target', 'target']

    // Player 0's own record still says "start", but asked about "target" it
    // is counted alongside the two players actually parked there — three
    // occupants total, itself ranked first by seat.
    expect(fanSlot(spaces, 0, 'target')).toEqual(pawnSlot(0, 3))
  })

  it('ranks co-occupants by seat, never by arrival order', () => {
    const spaces = ['shared', 'shared', 'shared']

    // Whichever order the array is read in, seat 0 is always the earliest
    // rank and seat 2 always the latest.
    expect(fanSlot(spaces, 0, 'shared')).toEqual(pawnSlot(0, 3))
    expect(fanSlot(spaces, 2, 'shared')).toEqual(pawnSlot(2, 3))
  })

  it('parks everyone dead centre when nobody has a space to fan against', () => {
    expect(fanSlot([undefined, undefined], 0, undefined)).toEqual({ x: 0, y: 0 })
  })
})

describe('roundedPolyline', () => {
  it('starts and ends on the points it was given', () => {
    const path = roundedPolyline(
      [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
      ],
      20,
    )

    expect(path.startsWith('M 0 0')).toBe(true)
    expect(path.endsWith('L 100 100')).toBe(true)
  })

  it('rounds a corner instead of mitring it', () => {
    const corner = roundedPolyline(
      [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
      ],
      20,
    )

    expect(corner).toContain('Q 100 0')
  })

  it('never rounds by more than half the shortest leg', () => {
    // A 10-unit leg with a 40-unit radius would otherwise overshoot the corner.
    const path = roundedPolyline(
      [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 200 },
      ],
      40,
    )

    expect(path).toContain('L 5 0')
  })

  it('degrades to a plain line for two points', () => {
    expect(roundedPolyline([{ x: 1, y: 2 }, { x: 3, y: 4 }], 10)).toBe('M 1 2 L 3 4')
  })

  it('returns nothing for a single point', () => {
    expect(roundedPolyline([{ x: 1, y: 2 }], 10)).toBe('')
  })
})

describe('boardLanes', () => {
  /**
   * The domain builds the route out of named lanes — college, main street, the
   * fast track — but hands over only a graph. Recovering those lanes from the
   * graph alone is what lets the map give each stretch of the journey its own
   * country without this layer knowing a single space by name.
   */
  it('splits the route where it forks and where it merges', () => {
    const lanes = boardLanes(forkedBoard())

    expect(lanes.map((lane) => lane.spaceIds)).toEqual([
      ['a'],
      ['b1', 'b2', 'b3'],
      ['c1', 'c2', 'c3'],
      ['f'],
      ['g1', 'g2', 'g3'],
      ['h1', 'h2', 'h3'],
      ['z', 'z2', 'end'],
    ])
  })

  it('orders lanes by how far into the journey they start', () => {
    const lanes = boardLanes(forkedBoard())
    const progress = lanes.map((lane) => lane.progress)

    expect(progress[0]).toBe(0)
    expect([...progress].sort((a, b) => a - b)).toEqual(progress)
    for (const value of progress) expect(value).toBeLessThanOrEqual(1)
  })

  it('puts the coast where the journey ends and open country where it starts', () => {
    const lanes = boardLanes(forkedBoard())

    expect(lanes[0]?.district).toBe('meadow')
    expect(lanes[lanes.length - 1]?.district).toBe('shore')
  })

  it('reads a lane’s country from the tone the domain gave it', () => {
    const lanes = boardLanes(forkedBoard())
    const byHead = new Map(lanes.map((lane) => [lane.spaceIds[0], lane.district]))

    expect(byHead.get('b1')).toBe('campus')
    expect(byHead.get('h1')).toBe('farmland')
  })

  /**
   * The game paints both the first job and the career fast track orange, so
   * tone alone cannot tell a yard from a glass tower. How far into the journey
   * the lane sits can.
   */
  it('turns an early orange lane into workshops and a late one into towers', () => {
    const lanes = boardLanes(forkedBoard())
    const byHead = new Map(lanes.map((lane) => [lane.spaceIds[0], lane.district]))

    expect(byHead.get('c1')).toBe('works')
    expect(byHead.get('g1')).toBe('towers')
  })

  /**
   * A junction is one tile long. Giving it a country of its own would drop a
   * lone patch of somewhere else into the middle of a district, so it takes the
   * one the road arrives from.
   */
  it('lets a one-tile junction belong to the district feeding it', () => {
    const lanes = boardLanes(forkedBoard())
    const byHead = new Map(lanes.map((lane) => [lane.spaceIds[0], lane.district]))

    expect(byHead.get('f')).toBe(byHead.get('b1'))
  })

  it('covers every space exactly once', () => {
    const model = forkedBoard()
    const ids = boardLanes(model).flatMap((lane) => lane.spaceIds)

    expect([...ids].sort()).toEqual(Object.keys(model.spaces).sort())
  })

  it('survives a board with no route at all', () => {
    const lanes = boardLanes(board([space('lonely', 1, 1)], 3, 3))

    expect(lanes).toHaveLength(1)
    expect(lanes[0]?.spaceIds).toEqual(['lonely'])
  })

  it('maps every space to its lane’s district', () => {
    const model = forkedBoard()
    const districts = districtBySpace(boardLanes(model))

    expect(districts.size).toBe(Object.keys(model.spaces).length)
    expect(districts.get('b3')).toBe('campus')
  })
})

describe('terrainRegions', () => {
  const model = forkedBoard()
  const projection = createProjection(model)
  const lanes = boardLanes(model)

  it('draws one patch of ground per lane', () => {
    const regions = terrainRegions(model, projection, lanes)

    expect(regions).toHaveLength(lanes.length)
    expect(regions.map((region) => region.district)).toEqual(lanes.map((lane) => lane.district))
  })

  it('is deterministic: the same board draws the same ground every time', () => {
    expect(terrainRegions(model, projection, lanes)).toEqual(
      terrainRegions(model, projection, lanes),
    )
  })

  it('closes every patch so it can be filled', () => {
    for (const region of terrainRegions(model, projection, lanes)) {
      expect(region.path.startsWith('M ')).toBe(true)
      expect(region.path.endsWith('Z')).toBe(true)
    }
  })

  /**
   * Neighbouring rows have to meet, or the ground between two lanes of a fork
   * shows the bare base colour as a stripe down the middle of the map.
   */
  it('grows each patch far enough to meet the row above and below', () => {
    const regions = terrainRegions(model, projection, lanes)
    const numbers = (path: string): number[] =>
      path.match(/-?\d+(\.\d+)?/g)?.map(Number) ?? []

    const lane = lanes.find((entry) => entry.spaceIds[0] === 'b1')
    const region = regions.find((entry) => entry.id === lane?.id)
    const ys = (numbers(region?.path ?? '') ?? []).filter((_, index) => index % 2 === 1)
    const rowY = projection.project({ x: 2, y: 1 }).y

    expect(Math.max(...ys) - rowY).toBeGreaterThan(projection.rowPitch / 2)
    expect(rowY - Math.min(...ys)).toBeGreaterThan(projection.rowPitch / 2)
  })
})

describe('coastline', () => {
  const model = forkedBoard()
  const projection = createProjection(model)

  it('is deterministic: the same board grows the same coast every time', () => {
    const first = coastline(model, projection)
    const second = coastline(model, projection)

    expect(second.waterPath).toBe(first.waterPath)
    expect(second.foamPath).toBe(first.foamPath)
  })

  /**
   * The water is derived from where the road is, not placed by hand, so the one
   * thing that has to hold for any board is that it can never lap up against a
   * tile a player needs to read.
   */
  it('never comes within a row of any tile', () => {
    const water = coastline(model, projection)
    const tiles = tilePoints(model, projection)

    for (let x = 0; x <= projection.viewWidth; x += projection.pitch / 4) {
      const at = { x, y: water.waterline(x) }
      for (const tile of tiles) {
        expect(Math.hypot(at.x - tile.x, at.y - tile.y)).toBeGreaterThan(projection.rowPitch * 0.75)
      }
    }
  })

  it('leaves every tile on dry land', () => {
    const water = coastline(model, projection)

    for (const tile of tilePoints(model, projection)) {
      expect(water.waterline(tile.x)).toBeGreaterThan(tile.y + projection.tileSize)
    }
  })

  it('opens into the empty ground below the last row', () => {
    const water = coastline(model, projection)
    const lowest = Math.max(...tilePoints(model, projection).map((point) => point.y))

    expect(water.waterline(projection.viewWidth * 0.5)).toBeLessThan(projection.viewHeight)
    expect(water.waterline(projection.viewWidth * 0.5)).toBeGreaterThan(lowest)
  })

  it('stacks sand above the shallows above the deep', () => {
    const water = coastline(model, projection)

    expect(water.beachPath).not.toBe(water.shallowPath)
    expect(water.shallowPath).not.toBe(water.waterPath)
    for (const path of [water.beachPath, water.shallowPath, water.waterPath]) {
      expect(path.endsWith('Z')).toBe(true)
    }
  })
})

describe('forkPockets', () => {
  const model = forkedBoard()
  const projection = createProjection(model)

  it('finds the courtyard each fork encloses', () => {
    const pockets = forkPockets(model, projection)

    expect(pockets.map((pocket) => pocket.id)).toEqual(['pocket-a', 'pocket-f'])
  })

  it('keeps every courtyard clear of every tile', () => {
    const pad = projection.tileSize * 0.5

    for (const pocket of forkPockets(model, projection)) {
      for (const tile of tilePoints(model, projection)) {
        const nx = (tile.x - pocket.centre.x) / (pocket.rx + pad)
        const ny = (tile.y - pocket.centre.y) / (pocket.ry + pad)
        expect(nx * nx + ny * ny).toBeGreaterThan(1)
      }
    }
  })

  it('alternates what fills them so three forks do not read as a motif', () => {
    const kinds = forkPockets(model, projection).map((pocket) => pocket.kind)

    expect(kinds).toEqual(['pond', 'grove'])
  })

  it('skips a fork whose branches rejoin too soon to leave any room', () => {
    const tight = board(
      [
        space('a', 1, 2, ['b', 'c']),
        space('b', 2, 1, ['d']),
        space('c', 2, 3, ['d']),
        space('d', 3, 2, []),
      ],
      5,
      5,
    )

    expect(forkPockets(tight, createProjection(tight))).toHaveLength(0)
  })
})

describe('ridges', () => {
  const model = forkedBoard()
  const projection = createProjection(model)

  it('draws two ranges, one behind the other', () => {
    expect(ridges(model, projection)).toHaveLength(2)
  })

  it('keeps every hill above the topmost stretch of road', () => {
    const topmost = Math.min(...tilePoints(model, projection).map((point) => point.y))

    for (const ridge of ridges(model, projection)) {
      const ys = (ridge.litPath.match(/-?\d+(\.\d+)?/g) ?? [])
        .map(Number)
        .filter((_, index) => index % 2 === 1)
      expect(Math.max(...ys)).toBeLessThan(topmost - projection.roadCasingWidth / 2)
    }
  })

  it('sets the further range back behind the nearer one', () => {
    const [far, near] = ridges(model, projection)
    const lowest = (path: string): number =>
      Math.max(
        ...(path.match(/-?\d+(\.\d+)?/g) ?? []).map(Number).filter((_, index) => index % 2 === 1),
      )

    expect(lowest(far?.litPath ?? '')).toBeLessThan(lowest(near?.litPath ?? ''))
  })

  it('draws nothing when the board leaves no sky to put them in', () => {
    const flush = board([space('a', 0, 0, ['b']), space('b', 1, 0)], 2, 1)
    const projectionAtEdge = createProjection(flush)
    const squashed: BoardProjection = { ...projectionAtEdge, marginY: 0, project: (point) => point }

    expect(ridges(flush, squashed)).toHaveLength(0)
  })
})

describe('routeStrands', () => {
  const model = forkedBoard()
  const projection = createProjection(model)
  const lanes = boardLanes(model)

  /**
   * The road is drawn as continuous ribbons rather than one line per edge, so
   * the thing that could silently go missing is an edge — most likely one of
   * the diagonals in and out of a fork, which is exactly where a gap would be
   * most obvious.
   */
  it('covers every connection on the board', () => {
    const drawn = new Set<string>()
    for (const strand of routeStrands(model, projection, lanes)) {
      for (let i = 0; i < strand.points.length - 1; i += 1) {
        const from = strand.points[i] as Point
        const to = strand.points[i + 1] as Point
        drawn.add(`${from.x},${from.y}->${to.x},${to.y}`)
      }
    }

    for (const [from, to] of routeSegments(model, projection)) {
      expect(drawn.has(`${from.x},${from.y}->${to.x},${to.y}`)).toBe(true)
    }
  })

  it('runs each strand from the junction it leaves to the one it rejoins', () => {
    const strands = routeStrands(model, projection, lanes)
    const campus = strands.find((strand) => strand.id.includes('lane-b1'))

    expect(campus?.points).toHaveLength(5)
    expect(campus?.path.startsWith('M ')).toBe(true)
  })

  it('draws a lane with no way in or out as just itself', () => {
    const lonely = board([space('only', 1, 1)], 3, 3)
    const strands = routeStrands(lonely, createProjection(lonely), boardLanes(lonely))

    expect(strands).toHaveLength(1)
    expect(strands[0]?.points).toHaveLength(1)
  })
})

describe('scatterScenery', () => {
  /**
   * The townscape is what makes the board read as a place, but not one piece of
   * it may sit where it would obscure the route or a tile a player has to read.
   * Everything here is a property of the layout, checked geometrically, rather
   * than a screenshot someone has to eyeball.
   */
  const model = forkedBoard()
  const projection = createProjection(model)

  it('is deterministic: the same board scatters the same scenery every time', () => {
    expect(scatterScenery(model, projection)).toEqual(scatterScenery(model, projection))
  })

  it('never places a piece on top of a tile', () => {
    for (const piece of scatterScenery(model, projection)) {
      for (const s of Object.values(model.spaces)) {
        const tile = projection.project(s.layout)
        const clearance = projection.tileSize * (spaceCaption(s) ? 1.5 : 0.82)
        expect(Math.hypot(piece.x - tile.x, piece.y - tile.y)).toBeGreaterThanOrEqual(clearance)
      }
    }
  })

  /**
   * Clearing the tiles is not enough on its own: a lane whose spaces are spread
   * out leaves stretches of open road between them, and a tree in the middle of
   * one is just as bad as a tree on a tile.
   */
  it('never places a land piece on the road between two tiles', () => {
    const segments = routeSegments(model, projection)
    const clearance = projection.roadCasingWidth / 2

    for (const piece of scatterScenery(model, projection)) {
      if (piece.kind === 'boat') continue
      for (const [a, b] of segments) {
        expect(distanceToSegment(piece, a, b)).toBeGreaterThan(clearance)
      }
    }
  })

  it('keeps every piece inside the viewBox', () => {
    for (const piece of scatterScenery(model, projection)) {
      expect(piece.x).toBeGreaterThanOrEqual(0)
      expect(piece.x).toBeLessThanOrEqual(projection.viewWidth)
      expect(piece.y).toBeGreaterThanOrEqual(0)
      expect(piece.y).toBeLessThanOrEqual(projection.viewHeight)
    }
  })

  it('builds on land and sails on water, never the other way round', () => {
    const water = coastline(model, projection)

    for (const piece of scatterScenery(model, projection)) {
      const afloat = piece.y > water.waterline(piece.x)
      expect(afloat).toBe(piece.kind === 'boat')
    }
  })

  it('builds each district out of its own kind of thing', () => {
    const byDistrict = new Map<string, Set<string>>()
    for (const piece of scatterScenery(model, projection)) {
      const seen = byDistrict.get(piece.district) ?? new Set<string>()
      seen.add(piece.kind)
      byDistrict.set(piece.district, seen)
    }

    expect([...(byDistrict.get('campus') ?? [])].sort()).not.toEqual(
      [...(byDistrict.get('towers') ?? [])].sort(),
    )
  })

  it('produces a mix of kinds rather than one repeated piece', () => {
    const kinds = new Set(scatterScenery(model, projection).map((piece) => piece.kind))
    expect(kinds.size).toBeGreaterThan(1)
  })

  it('scales its output to the board size instead of a fixed count', () => {
    const tiny = board([space('a', 1, 1, ['b']), space('b', 2, 1)], 4, 3)
    const large = board(
      Array.from({ length: 20 }, (_, i) =>
        space(`s${i}`, (i % 10) + 1, Math.floor(i / 10) * 3 + 1, i < 19 ? [`s${i + 1}`] : []),
      ),
      14,
      10,
    )

    expect(scatterScenery(large, createProjection(large)).length).toBeGreaterThan(
      scatterScenery(tiny, createProjection(tiny)).length,
    )
  })

  /**
   * One country, one capital — see `capitalSkylineFor`. Everything the
   * ordinary scatter already has to prove (never on a tile, never on the
   * road, always inside the viewBox) applies just as much to the guaranteed
   * skyline pieces as to the sixty incidental ones — and the anchor piece,
   * placed first, must always land.
   */
  describe('the capital skyline', () => {
    it.each(['usa', 'japan', 'france', 'india', 'bolivia'] as const)(
      'places %s’s skyline, anchor first, clear of every tile and every road',
      (editionId) => {
        const pieces = scatterScenery(model, projection, editionId)
        const landmarks = pieces.filter((piece) => piece.kind.startsWith('landmark-'))
        const skyline = capitalSkylineFor(editionId)
        expect(landmarks.length).toBeGreaterThanOrEqual(1)
        expect(landmarks.length).toBeLessThanOrEqual(skyline.length)
        expect(landmarks[0]?.kind).toBe(skyline[0])
        // Every placed piece is from this capital's skyline, none twice.
        const kinds = landmarks.map((piece) => piece.kind)
        expect(new Set(kinds).size).toBe(kinds.length)
        for (const kind of kinds) expect(skyline).toContain(kind)

        const segments = routeSegments(model, projection)
        const roadClearance = projection.roadCasingWidth / 2
        for (const landmark of landmarks) {
          for (const s of Object.values(model.spaces)) {
            const tile = projection.project(s.layout)
            const clearance = projection.tileSize * (spaceCaption(s) ? 1.5 : 0.82)
            expect(Math.hypot(landmark.x - tile.x, landmark.y - tile.y)).toBeGreaterThanOrEqual(clearance)
          }
          for (const [a, b] of segments) {
            expect(distanceToSegment(landmark, a, b)).toBeGreaterThan(roadClearance)
          }
          expect(landmark.x).toBeGreaterThanOrEqual(0)
          expect(landmark.x).toBeLessThanOrEqual(projection.viewWidth)
          expect(landmark.y).toBeGreaterThanOrEqual(0)
          expect(landmark.y).toBeLessThanOrEqual(projection.viewHeight)
        }
      },
    )

    it.each(['usa', 'japan', 'france', 'india', 'bolivia'] as const)(
      'never lets two of %s’s skyline pieces stand on top of each other',
      (editionId) => {
        const landmarks = scatterScenery(model, projection, editionId).filter((piece) =>
          piece.kind.startsWith('landmark-'),
        )
        for (let i = 0; i < landmarks.length; i += 1) {
          for (let j = i + 1; j < landmarks.length; j += 1) {
            const a = landmarks[i]!
            const b = landmarks[j]!
            const reach =
              projection.tileSize * (sceneryExtent(a.kind).side + sceneryExtent(b.kind).side)
            const apart =
              Math.abs(a.x - b.x) >= reach || Math.abs(a.y - b.y) >= projection.rowPitch * 1.5
            expect(apart, `${a.kind} crowds ${b.kind}`).toBe(true)
          }
        }
      },
    )

    it('places no landmark at all for an edition with no capital of its own', () => {
      const pieces = scatterScenery(model, projection, 'some-future-edition')
      expect(pieces.some((piece) => piece.kind.startsWith('landmark-'))).toBe(false)
    })

    it('lets a caller force a single specific landmark regardless of edition — comparing two candidates', () => {
      // How two candidates for one country get compared before one ships:
      // the override drops the whole skyline for just the piece named.
      const pieces = scatterScenery(model, projection, 'usa', 'landmark-japan-fuji')
      const landmarks = pieces.filter((piece) => piece.kind.startsWith('landmark-'))
      expect(landmarks).toHaveLength(1)
      expect(landmarks[0]?.kind).toBe('landmark-japan-fuji')
    })
  })

  /**
   * The capital's building stock — see `editionSceneryKind`. Districts say
   * what stands where; the edition says what it looks like. Asserted on the
   * scatter's actual output, not just the mapping, so a leak of a generic
   * kind past the mapping would show up here.
   */
  describe('the capital’s building stock', () => {
    it('raises Haussmann blocks in Paris where other capitals raise glass', () => {
      const kinds = new Set(scatterScenery(model, projection, 'france').map((piece) => piece.kind))
      expect(kinds.has('mansard')).toBe(true)
      expect(kinds.has('block')).toBe(false)
      expect(kinds.has('tower')).toBe(false)
    })

    it('holds Washington to its height limit', () => {
      const kinds = new Set(scatterScenery(model, projection, 'usa').map((piece) => piece.kind))
      expect(kinds.has('tower')).toBe(false)
    })

    it('lets Tokyo keep its towers', () => {
      const kinds = new Set(scatterScenery(model, projection, 'japan').map((piece) => piece.kind))
      expect(kinds.has('tower')).toBe(true)
    })
  })
})

describe('capitalSkylineFor', () => {
  it('anchors every edition’s skyline on its capital’s most recognisable piece', () => {
    expect(capitalSkylineFor('usa')[0]).toBe('landmark-usa-capitol')
    expect(capitalSkylineFor('japan')[0]).toBe('landmark-japan-tower')
    expect(capitalSkylineFor('france')[0]).toBe('landmark-france-eiffel')
    expect(capitalSkylineFor('india')[0]).toBe('landmark-india-gate')
    expect(capitalSkylineFor('bolivia')[0]).toBe('landmark-bolivia-peak')
  })

  it('gives every edition more than one piece to place', () => {
    for (const editionId of ['usa', 'japan', 'france', 'india', 'bolivia']) {
      expect(capitalSkylineFor(editionId).length).toBeGreaterThan(1)
    }
  })

  it('has no opinion about an edition it does not recognise', () => {
    expect(capitalSkylineFor('atlantis')).toEqual([])
    expect(capitalSkylineFor(undefined)).toEqual([])
  })
})

describe('editionSceneryKind', () => {
  it('swaps Washington’s towers for blocks and its houses for brick rowhouses', () => {
    expect(editionSceneryKind('usa', 'tower')).toBe('block')
    expect(editionSceneryKind('usa', 'house')).toBe('rowhouse')
  })

  it('swaps Paris’s towers and blocks for mansard-roofed Haussmann blocks', () => {
    expect(editionSceneryKind('france', 'tower')).toBe('mansard')
    expect(editionSceneryKind('france', 'block')).toBe('mansard')
  })

  it('keeps New Delhi and La Paz low without touching their homes', () => {
    expect(editionSceneryKind('india', 'tower')).toBe('block')
    expect(editionSceneryKind('bolivia', 'tower')).toBe('block')
    expect(editionSceneryKind('india', 'house')).toBe('house')
    expect(editionSceneryKind('bolivia', 'house')).toBe('house')
  })

  it('leaves Tokyo — and any edition it does not recognise — alone', () => {
    expect(editionSceneryKind('japan', 'tower')).toBe('tower')
    expect(editionSceneryKind(undefined, 'tower')).toBe('tower')
    expect(editionSceneryKind('atlantis', 'house')).toBe('house')
  })
})
