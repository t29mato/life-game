import type { Board, Space, SpaceId, SpaceTone } from '@domain/model/types'

export interface Point {
  readonly x: number
  readonly y: number
}

/**
 * How far apart two connected spaces sit horizontally in the rendered viewBox.
 * Everything else — tile size, road widths, pawn size — is derived from this,
 * so the board keeps its proportions no matter what coordinate scale the domain
 * used.
 */
const VIEW_PITCH = 76

/**
 * Rows are drawn further apart than columns are.
 *
 * The domain puts a fork's two lanes exactly one unit above and below their
 * trunk row. On a square grid that leaves two stretches of road a single pitch
 * apart, and a road wide enough to look like a road then merges with its
 * neighbour into one fat band — the work lane and the risky road, which sit on
 * adjacent rows over the same columns, are the pair that gives it away.
 * Stretching the vertical axis buys that gap back without touching the domain's
 * topology, and costs nothing but a taller viewBox.
 */
const ROW_RATIO = 1.5

/** Fraction of the pitch a tile occupies. The rest is road showing around it. */
const TILE_RATIO = 0.71

/**
 * The camera's rake: the fraction of a raised object's real height that shows
 * as rise on screen. 0 would be a plan view — a floor plan — and 1 an
 * elevation. At this value a slab of board stock presents a side wall about a
 * fifth of its own face, which is what a thick piece of printed card looks like
 * from a chair.
 *
 * The projection stays **affine**: the depth axis is drawn at full length (an
 * oblique camera, not a perspective one). A perspective camera would foreshorten
 * the far rows, and since the domain puts a fork's two lanes exactly one row
 * apart, their roads — drawn as strokes of a fixed width — would merge into a
 * single band at the back of the board. Depth is carried by extrusion, contact
 * shadows and draw order instead, none of which cost a layout invariant.
 */
const RAKE = 0.55

/** How thick a slab of board stock is, as a fraction of the pitch. */
const SLAB_RATIO = 0.3

/**
 * How much taller than an ordinary space each kind of stop is cut.
 *
 * Milestones are the five moments the whole game is about, so they stand
 * highest; a forced stop is next, because a player has to see it coming to plan
 * a spin; payday is a shade proud of the board so its gilt edge catches light.
 */
const ACCENT_HEIGHT: Readonly<Record<SpaceAccent, number>> = {
  milestone: 2.15,
  stop: 1.45,
  payday: 1.25,
  plain: 1,
}

/** How much wider than an ordinary space a milestone tile is printed. */
const MILESTONE_SCALE = 1.12

/** Road widths, as fractions of the pitch: tarmac, white edging, dark kerb. */
const ROAD_RATIO = 1
const ROAD_EDGE_RATIO = 1.11
const ROAD_CASING_RATIO = 1.19

/** Blank viewBox units kept left and right of the board, for hills and coast. */
const VIEW_MARGIN = VIEW_PITCH

export function clamp(value: number, min: number, max: number): number {
  const lo = Math.min(min, max)
  const hi = Math.max(min, max)
  return Math.min(Math.max(value, lo), hi)
}

function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

/** Median gap between connected spaces, in whatever units the board uses. */
function unitPitch(board: Board): number {
  const distances: number[] = []
  for (const space of Object.values(board.spaces)) {
    for (const nextId of space.next) {
      const next = board.spaces[nextId]
      if (!next) continue
      const gap = distance(space.layout, next.layout)
      if (gap > 0) distances.push(gap)
    }
  }

  if (distances.length === 0) return 1

  distances.sort((a, b) => a - b)
  const mid = Math.floor(distances.length / 2)
  const upper = distances[mid] as number
  return distances.length % 2 === 0 ? ((distances[mid - 1] as number) + upper) / 2 : upper
}

export interface BoardProjection {
  /** SVG viewBox dimensions the board should be drawn into. */
  readonly viewWidth: number
  readonly viewHeight: number
  /** Distance between two spaces one column apart, in viewBox units. */
  readonly pitch: number
  /** Distance between two spaces one row apart. Larger than `pitch`. */
  readonly rowPitch: number
  readonly tileSize: number
  /** Width of the tarmac, of its white edging, and of the kerb beneath both. */
  readonly roadWidth: number
  readonly roadEdgeWidth: number
  readonly roadCasingWidth: number
  /** Blank viewBox units kept left and right of the board. */
  readonly margin: number
  /** Blank viewBox units kept above and below it. */
  readonly marginY: number
  /** Board units → viewBox units, per axis. */
  readonly scale: number
  readonly scaleY: number
  /** The camera's rake, 0 (plan view) to 1 (elevation). See `RAKE`. */
  readonly rake: number
  /**
   * Height of the side wall an ordinary tile shows beneath its printed face,
   * in viewBox units. Already raked, so it can be subtracted from a `y`
   * directly — no consumer ever multiplies by the rake itself.
   */
  readonly tileDepth: number
  /**
   * Where a space meets the board. This is the ground plane: captions, road,
   * terrain, scenery and shadows all live here.
   */
  project(point: Point): Point
  /** The same point raised `depth` viewBox units off the board, toward the eye. */
  lift(point: Point, depth: number): Point
}

/**
 * Maps the domain's abstract board coordinates into viewBox units.
 *
 * The domain deliberately lays the board out in tile-pitch units — the real
 * board is about 23 units wide — because where tiles sit relative to each other
 * is a design decision and how big they are drawn is not. This is the seam
 * between the two, and the only place that decides how much room the drawing
 * gets for terrain.
 *
 * `project` answers where a space touches the board; `lift` raises a point off
 * it by the height of whatever stands there. Between them they are the whole
 * camera, and they are pure — the same board projects to the same numbers on
 * every render, on every machine.
 */
export function createProjection(board: Board): BoardProjection {
  const scale = VIEW_PITCH / unitPitch(board)
  const rowPitch = VIEW_PITCH * ROW_RATIO
  const scaleY = scale * ROW_RATIO
  const tileDepth = VIEW_PITCH * SLAB_RATIO * RAKE

  return {
    viewWidth: board.width * scale + VIEW_MARGIN * 2,
    // The extra headroom is where the tallest slab's raised face goes: a
    // milestone on the top row is drawn a good way above the point it stands on.
    viewHeight: board.height * scaleY + rowPitch * 2,
    pitch: VIEW_PITCH,
    rowPitch,
    tileSize: VIEW_PITCH * TILE_RATIO,
    roadWidth: VIEW_PITCH * ROAD_RATIO,
    roadEdgeWidth: VIEW_PITCH * ROAD_EDGE_RATIO,
    roadCasingWidth: VIEW_PITCH * ROAD_CASING_RATIO,
    margin: VIEW_MARGIN,
    marginY: rowPitch,
    scale,
    scaleY,
    rake: RAKE,
    tileDepth,
    project: (point) => ({ x: point.x * scale + VIEW_MARGIN, y: point.y * scaleY + rowPitch }),
    lift: (point, depth) => ({ x: point.x, y: point.y - depth }),
  }
}

/**
 * How grand a space is drawn. Milestones are the five moments the whole game
 * is about, so they win over every other treatment a space might qualify for —
 * the wedding tile is a milestone first and a forced stop second.
 */
export type SpaceAccent = 'milestone' | 'payday' | 'stop' | 'plain'

export function spaceAccent(space: Space): SpaceAccent {
  switch (space.effect.type) {
    case 'graduate':
    case 'getMarried':
    case 'haveChildren':
    case 'buyHouse':
    case 'retire':
      return 'milestone'
    default:
      break
  }
  if (space.kind === 'payday') return 'payday'
  if (space.kind === 'stop') return 'stop'
  return 'plain'
}

/**
 * A space as a physical object: a slab of board stock of a given face size,
 * cut to a height that says what kind of stop it is.
 */
export interface SlabMetrics {
  /** Width and height of the printed face. */
  readonly size: number
  readonly half: number
  readonly radius: number
  /** Height of the side wall showing beneath the face, in viewBox units. */
  readonly depth: number
}

/**
 * How thick and how wide a space is cut.
 *
 * Height is the board's own grammar for importance: a player scanning for
 * somewhere to aim a spin can read a milestone, a forced stop and an ordinary
 * space apart by silhouette alone, before any colour or icon is resolved. Pure
 * so the same accent always cuts the same slab.
 */
export function slabMetrics(projection: BoardProjection, accent: SpaceAccent): SlabMetrics {
  const size = projection.tileSize * (accent === 'milestone' ? MILESTONE_SCALE : 1)
  return {
    size,
    half: size / 2,
    radius: size * 0.26,
    depth: projection.tileDepth * ACCENT_HEIGHT[accent],
  }
}

/**
 * The short word printed on the board beside a space, or `null` for the many
 * ordinary spaces that carry only their illustration. Kept to a single short
 * word wherever possible: at board scale anything longer stops being readable.
 */
export function spaceCaption(space: Space): string | null {
  switch (space.effect.type) {
    case 'graduate':
      return 'GRADUATE'
    case 'getMarried':
      return 'MARRIED'
    case 'haveChildren':
      return 'BABY'
    case 'buyHouse':
      return 'NEW HOME'
    case 'retire':
      return 'RETIRE'
    default:
      break
  }
  if (space.kind === 'start') return 'START'
  if (space.kind === 'payday') return 'PAYDAY'
  if (space.kind === 'stop') return 'STOP'
  return null
}

export type CaptionSide = 'above' | 'below'

/**
 * Picks the side of a tile its caption can be printed on without landing on a
 * neighbouring tile. The board's rows sit a whole row pitch apart inside a
 * fork, so a caption only ever has one clear side there — and sometimes
 * neither.
 */
export function captionSide(
  at: Point,
  others: readonly Point[],
  pitch: number,
  rowPitch: number,
  prefer: CaptionSide,
  halfWidth: number,
): CaptionSide | null {
  /** Half a caption plus half a tile: closer than this and the two overlap. */
  const reach = halfWidth + pitch * 0.42

  const blocked = (side: CaptionSide): boolean => {
    const sign = side === 'below' ? 1 : -1
    return others.some((other) => {
      const dy = (other.y - at.y) * sign
      return Math.abs(other.x - at.x) < reach && dy > rowPitch * 0.4 && dy < rowPitch * 1.6
    })
  }

  const fallback: CaptionSide = prefer === 'below' ? 'above' : 'below'
  if (!blocked(prefer)) return prefer
  if (!blocked(fallback)) return fallback
  return null
}

/* ── deterministic noise ─────────────────────────────────────────────────── */

/** A tiny deterministic PRNG so the same board always draws the same scene. */
function mulberry32(seed: number): () => number {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** A stable 32-bit hash of a string, so a lane's id can seed its own shape. */
function hash(text: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

/**
 * Smooth noise that repeats exactly once per unit of `t`, so it can be walked
 * around a closed outline without a seam where the ends meet. Three harmonics
 * is enough to read as "hand-drawn" rather than "sine wave", and stays in
 * roughly −1..1.
 */
function loopNoise(seed: number): (t: number) => number {
  const rng = mulberry32(seed)
  const p1 = rng() * Math.PI * 2
  const p2 = rng() * Math.PI * 2
  const p3 = rng() * Math.PI * 2
  return (t) =>
    0.54 * Math.sin(2 * Math.PI * 2 * t + p1) +
    0.31 * Math.sin(2 * Math.PI * 3 * t + p2) +
    0.15 * Math.sin(2 * Math.PI * 5 * t + p3)
}

/* ── path helpers ────────────────────────────────────────────────────────── */

function round(value: number): number {
  return Math.round(value * 100) / 100
}

/** A closed path through `points`, smoothed by curving through their midpoints. */
function closedSmoothPath(points: readonly Point[]): string {
  if (points.length < 3) return ''
  const first = points[0] as Point
  const last = points[points.length - 1] as Point
  const startX = (last.x + first.x) / 2
  const startY = (last.y + first.y) / 2
  const parts = [`M ${round(startX)} ${round(startY)}`]
  for (let i = 0; i < points.length; i += 1) {
    const current = points[i] as Point
    const next = points[(i + 1) % points.length] as Point
    parts.push(
      `Q ${round(current.x)} ${round(current.y)} ${round((current.x + next.x) / 2)} ${round(
        (current.y + next.y) / 2,
      )}`,
    )
  }
  parts.push('Z')
  return parts.join(' ')
}

/** An open path through `points`, smoothed the same way. */
function openSmoothPath(points: readonly Point[]): string {
  if (points.length === 0) return ''
  const first = points[0] as Point
  if (points.length < 3) {
    const end = points[points.length - 1] as Point
    return `M ${round(first.x)} ${round(first.y)} L ${round(end.x)} ${round(end.y)}`
  }
  const parts = [`M ${round(first.x)} ${round(first.y)}`]
  for (let i = 1; i < points.length - 1; i += 1) {
    const current = points[i] as Point
    const next = points[i + 1] as Point
    parts.push(
      `Q ${round(current.x)} ${round(current.y)} ${round((current.x + next.x) / 2)} ${round(
        (current.y + next.y) / 2,
      )}`,
    )
  }
  const end = points[points.length - 1] as Point
  parts.push(`L ${round(end.x)} ${round(end.y)}`)
  return parts.join(' ')
}

/**
 * A blob: an ellipse of radii `rx`/`ry` whose outline wanders in and out by up
 * to `wobble` of its radius. Everything organic on the board — ponds, hilltops,
 * the ground under a district — is one of these, so nothing on the map has a
 * machined edge.
 */
function blobPath(
  centre: Point,
  rx: number,
  ry: number,
  seed: number,
  wobble = 0.14,
  samples = 22,
): string {
  const noise = loopNoise(seed)
  const points: Point[] = []
  for (let i = 0; i < samples; i += 1) {
    const t = i / samples
    const angle = t * Math.PI * 2
    const r = 1 + noise(t) * wobble
    points.push({ x: centre.x + Math.cos(angle) * rx * r, y: centre.y + Math.sin(angle) * ry * r })
  }
  return closedSmoothPath(points)
}

interface Rect {
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
}

/**
 * The same idea for a long, thin area: walk the rectangle's perimeter at even
 * spacing, push each sample out along its normal by a little noise, and smooth
 * the result. Walking the perimeter rather than sweeping an angle keeps the
 * detail even on a region twenty times wider than it is tall — which is what a
 * lane of this board is.
 */
function rectBlobPath(rect: Rect, seed: number, wobble: number, spacing: number): string {
  const perimeter = 2 * (rect.width + rect.height)
  const samples = Math.round(clamp(perimeter / spacing, 16, 120))
  const noise = loopNoise(seed)
  const points: Point[] = []

  for (let i = 0; i < samples; i += 1) {
    const t = i / samples
    let along = t * perimeter
    let px = rect.x
    let py = rect.y
    let nx = 0
    let ny = -1

    if (along < rect.width) {
      px = rect.x + along
    } else if ((along -= rect.width) < rect.height) {
      px = rect.x + rect.width
      py = rect.y + along
      nx = 1
      ny = 0
    } else if ((along -= rect.height) < rect.width) {
      px = rect.x + rect.width - along
      py = rect.y + rect.height
      nx = 0
      ny = 1
    } else {
      along -= rect.width
      py = rect.y + rect.height - along
      nx = -1
      ny = 0
    }

    const push = noise(t) * wobble
    points.push({ x: px + nx * push, y: py + ny * push })
  }

  return closedSmoothPath(points)
}

/**
 * A polyline with its corners rounded off. The route uses it so a lane leaving
 * or rejoining the trunk sweeps away like a slip road instead of turning a
 * mitred corner.
 */
export function roundedPolyline(points: readonly Point[], radius: number): string {
  if (points.length < 2) return ''
  const first = points[0] as Point
  const parts = [`M ${round(first.x)} ${round(first.y)}`]

  for (let i = 1; i < points.length - 1; i += 1) {
    const previous = points[i - 1] as Point
    const current = points[i] as Point
    const next = points[i + 1] as Point
    const back = distance(previous, current)
    const forward = distance(current, next)
    if (back === 0 || forward === 0) continue

    const r = Math.min(radius, back / 2, forward / 2)
    const enter = {
      x: current.x + ((previous.x - current.x) / back) * r,
      y: current.y + ((previous.y - current.y) / back) * r,
    }
    const exit = {
      x: current.x + ((next.x - current.x) / forward) * r,
      y: current.y + ((next.y - current.y) / forward) * r,
    }
    parts.push(`L ${round(enter.x)} ${round(enter.y)}`)
    parts.push(`Q ${round(current.x)} ${round(current.y)} ${round(exit.x)} ${round(exit.y)}`)
  }

  const last = points[points.length - 1] as Point
  parts.push(`L ${round(last.x)} ${round(last.y)}`)
  return parts.join(' ')
}

function distanceToSegment(point: Point, a: Point, b: Point): number {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const lengthSquared = dx * dx + dy * dy
  if (lengthSquared === 0) return distance(point, a)
  const t = clamp(((point.x - a.x) * dx + (point.y - a.y) * dy) / lengthSquared, 0, 1)
  return distance(point, { x: a.x + dx * t, y: a.y + dy * t })
}

/* ── lanes ───────────────────────────────────────────────────────────────── */

/**
 * The kind of ground a stretch of the journey runs through. One per lane, and
 * every one of them is decided by the board's own data — never by naming a
 * space — so a lane added to the domain lands somewhere sensible on its own.
 */
export type District =
  | 'meadow'
  | 'campus'
  | 'works'
  | 'downtown'
  | 'suburb'
  | 'towers'
  | 'uplands'
  | 'farmland'
  | 'shore'

export interface BoardLane {
  readonly id: string
  readonly spaceIds: readonly SpaceId[]
  readonly district: District
  /** 0 at the start of the journey, 1 at the furthest space from it. */
  readonly progress: number
}

interface Wiring {
  readonly inbound: Map<SpaceId, SpaceId[]>
  readonly depth: Map<SpaceId, number>
}

function wiringOf(board: Board): Wiring {
  const inbound = new Map<SpaceId, SpaceId[]>()
  for (const space of Object.values(board.spaces)) {
    for (const nextId of space.next) {
      if (!board.spaces[nextId]) continue
      const list = inbound.get(nextId)
      if (list) list.push(space.id)
      else inbound.set(nextId, [space.id])
    }
  }

  const depth = new Map<SpaceId, number>()
  const queue: SpaceId[] = []
  if (board.spaces[board.startSpaceId]) {
    depth.set(board.startSpaceId, 0)
    queue.push(board.startSpaceId)
  }
  for (let head = 0; head < queue.length; head += 1) {
    const id = queue[head] as SpaceId
    const space = board.spaces[id]
    if (!space) continue
    const next = (depth.get(id) ?? 0) + 1
    for (const nextId of space.next) {
      if (!board.spaces[nextId] || depth.has(nextId)) continue
      depth.set(nextId, next)
      queue.push(nextId)
    }
  }
  return { inbound, depth }
}

function modalTone(spaces: readonly Space[]): SpaceTone {
  const counts = new Map<SpaceTone, number>()
  for (const space of spaces) counts.set(space.tone, (counts.get(space.tone) ?? 0) + 1)
  let best: SpaceTone = spaces[0]?.tone ?? 'slate'
  let bestCount = 0
  for (const [tone, count] of counts) {
    if (count > bestCount) {
      best = tone
      bestCount = count
    }
  }
  return best
}

/**
 * A lane's ground, from its colour and how far into the journey it is.
 *
 * The domain already tints each lane — college is blue, the family lane purple,
 * the safe street green — so the tone is a ready-made signal for what kind of
 * place a stretch of road runs through. Only orange is ambiguous, because the
 * game uses it for both the first job and the career fast track; how far along
 * the journey the lane sits tells those two apart.
 */
function districtForTone(tone: SpaceTone, progress: number): District {
  switch (tone) {
    case 'blue':
      return 'campus'
    case 'purple':
      return 'suburb'
    case 'green':
      return 'farmland'
    case 'pink':
      return 'uplands'
    case 'orange':
      return progress < 0.5 ? 'works' : 'towers'
    default:
      return 'downtown'
  }
}

/**
 * Splits the route into the lanes the domain built it from, using nothing but
 * the graph: a lane runs from a space the route can only be entered at, along
 * single successors, until the route forks or another lane merges in.
 *
 * That recovers "college", "main street", "the fast track" and the rest without
 * this layer knowing any of their names.
 */
export function boardLanes(board: Board): readonly BoardLane[] {
  const spaces = Object.values(board.spaces)
  const { inbound, depth } = wiringOf(board)
  const order = new Map<SpaceId, number>()
  spaces.forEach((space, index) => order.set(space.id, index))
  const maxDepth = Math.max(1, ...depth.values())

  const isHead = (space: Space): boolean => {
    const from = inbound.get(space.id) ?? []
    if (from.length !== 1) return true
    const only = board.spaces[from[0] as SpaceId]
    return !only || only.next.length !== 1
  }

  const chains: Space[][] = []
  for (const space of spaces) {
    if (!isHead(space)) continue
    const chain: Space[] = [space]
    const seen = new Set<SpaceId>([space.id])
    let current = space
    for (;;) {
      if (current.next.length !== 1) break
      const nextId = current.next[0] as SpaceId
      const next = board.spaces[nextId]
      if (!next || seen.has(nextId)) break
      if ((inbound.get(nextId) ?? []).length !== 1) break
      chain.push(next)
      seen.add(nextId)
      current = next
    }
    chains.push(chain)
  }

  chains.sort((a, b) => {
    const headA = a[0] as Space
    const headB = b[0] as Space
    const byDepth = (depth.get(headA.id) ?? 0) - (depth.get(headB.id) ?? 0)
    if (byDepth !== 0) return byDepth
    return (order.get(headA.id) ?? 0) - (order.get(headB.id) ?? 0)
  })

  const lanes: BoardLane[] = []
  const districtOf = new Map<SpaceId, District>()

  for (const chain of chains) {
    const head = chain[0] as Space
    const ids = chain.map((space) => space.id)
    const progress = (depth.get(head.id) ?? 0) / maxDepth

    let district: District
    if (ids.includes(board.retirementSpaceId)) {
      // Wherever the journey ends is where the land runs out.
      district = 'shore'
    } else if (ids.includes(board.startSpaceId)) {
      district = 'meadow'
    } else if (chain.length === 1) {
      // A junction is one tile long and has no character of its own, so it
      // belongs to whichever district the road arrives from.
      const from = (inbound.get(head.id) ?? [])
        .map((id) => districtOf.get(id))
        .find((value): value is District => value !== undefined)
      district = from ?? districtForTone(modalTone(chain), progress)
    } else {
      district = districtForTone(modalTone(chain), progress)
    }

    for (const id of ids) districtOf.set(id, district)
    lanes.push({ id: `lane-${head.id}`, spaceIds: ids, district, progress })
  }

  return lanes
}

/** Every space's district, for anything that needs to look one up by position. */
export function districtBySpace(lanes: readonly BoardLane[]): Map<SpaceId, District> {
  const map = new Map<SpaceId, District>()
  for (const lane of lanes) for (const id of lane.spaceIds) map.set(id, lane.district)
  return map
}

/* ── terrain ─────────────────────────────────────────────────────────────── */

export interface TerrainRegion {
  readonly id: string
  readonly district: District
  readonly path: string
}

/**
 * The ground each lane runs through, as one soft-edged patch per lane.
 *
 * A patch is the lane's own bounding box, grown until neighbouring rows meet,
 * with a wandering outline. Drawn in route order they overlap into continuous
 * country: the campus green gives way to the works, the works to downtown, and
 * so on down the journey — so where a player is on the board is legible from
 * the colour of the ground before a single tile is read.
 */
export function terrainRegions(
  board: Board,
  projection: BoardProjection,
  lanes: readonly BoardLane[],
): readonly TerrainRegion[] {
  const padX = projection.pitch * 0.66
  const padY = projection.rowPitch * 0.54

  return lanes.map((lane) => {
    const points = lane.spaceIds
      .map((id) => board.spaces[id])
      .filter((space): space is Space => space !== undefined)
      .map((space) => projection.project(space.layout))

    const xs = points.map((point) => point.x)
    const ys = points.map((point) => point.y)
    const x = Math.min(...xs) - padX
    const y = Math.min(...ys) - padY
    const rect: Rect = {
      x,
      y,
      width: Math.max(...xs) + padX - x,
      height: Math.max(...ys) + padY - y,
    }

    return {
      id: lane.id,
      district: lane.district,
      path: rectBlobPath(rect, hash(lane.id), projection.rowPitch * 0.13, projection.pitch * 0.62),
    }
  })
}

/* ── the coast ───────────────────────────────────────────────────────────── */

/**
 * How steeply the shoreline climbs away from land as it leaves it, and how far
 * below the lowest road it sits directly underneath it. Together they set the
 * closest the water can ever come to a tile: `CLEARANCE / (1 + DECAY)`.
 */
const COAST_DECAY = 0.7
const COAST_CLEARANCE = 1.35

export interface Coastline {
  /** Deep water, shallows, and the sand between the shallows and the grass. */
  readonly waterPath: string
  readonly shallowPath: string
  readonly beachPath: string
  /** The waterline itself, for a stroke of foam. */
  readonly foamPath: string
  /** The y the water starts at, for a given x. */
  waterline(x: number): number
}

/**
 * Where the land runs out.
 *
 * The board's own occupancy decides it: the water sits a fixed distance below
 * the lowest piece of road, and climbs back up as it moves away from it. That
 * puts a wide bay under the empty bottom-right of the board and leaves the run
 * down to retirement on a headland reaching into it — without a single
 * hand-placed coordinate, and with a guaranteed clearance from every tile.
 */
export function coastline(board: Board, projection: BoardProjection): Coastline {
  const points = Object.values(board.spaces).map((space) => projection.project(space.layout))
  const clearance = projection.rowPitch * COAST_CLEARANCE
  const swell = loopNoise(hash(`coast-${board.width}x${board.height}`))
  const swellDepth = projection.rowPitch * 0.16

  const waterline = (x: number): number => {
    let lowest = -Infinity
    for (const point of points) lowest = Math.max(lowest, point.y - COAST_DECAY * Math.abs(point.x - x))
    if (lowest === -Infinity) return projection.viewHeight * 0.72
    // The swell only ever pushes the water away from the land, so the clearance
    // below is a floor and not an average.
    return lowest + clearance + swellDepth * (0.5 + 0.5 * swell(x / projection.viewWidth))
  }

  const step = projection.pitch * 0.4
  const samples: Point[] = []
  for (let x = -step; x <= projection.viewWidth + step; x += step) {
    samples.push({ x, y: waterline(x) })
  }

  const bottom = projection.viewHeight + projection.rowPitch
  const band = (offset: number): string => {
    const shifted = samples.map((point) => ({ x: point.x, y: point.y + offset }))
    const first = shifted[0] as Point
    const last = shifted[shifted.length - 1] as Point
    return `${openSmoothPath(shifted)} L ${round(last.x)} ${bottom} L ${round(
      first.x,
    )} ${bottom} Z`
  }

  return {
    waterPath: band(projection.rowPitch * 0.26),
    shallowPath: band(0),
    beachPath: band(-projection.rowPitch * 0.3),
    foamPath: openSmoothPath(samples),
    waterline,
  }
}

/* ── the open ground a fork encloses ─────────────────────────────────────── */

export type PocketKind = 'pond' | 'grove'

export interface ForkPocket {
  readonly id: string
  readonly kind: PocketKind
  readonly centre: Point
  readonly rx: number
  readonly ry: number
  readonly path: string
  /** A stable 0–1, for varying whatever is drawn inside it. */
  readonly seed: number
}

/**
 * Every fork on this board sends two lanes around a rectangle of empty trunk
 * row and rejoins them on the far side, which leaves three generous, guaranteed
 * clear courtyards in the middle of the map. They are the one place a real
 * feature can sit — a park with a pond, a stand of trees — instead of the
 * scatter of small stuff that has to fit between roads.
 */
export function forkPockets(board: Board, projection: BoardProjection): readonly ForkPocket[] {
  const pockets: ForkPocket[] = []
  const spaces = Object.values(board.spaces)
  const { inbound } = wiringOf(board)

  for (const fork of spaces) {
    if (fork.next.length < 2) continue

    // Follow one branch until the road it is on is joined by another: that is
    // where the two lanes come back together, and the far side of the pocket.
    let walker = board.spaces[fork.next[0] as SpaceId]
    const seen = new Set<SpaceId>([fork.id])
    while (
      walker &&
      walker.next.length === 1 &&
      (inbound.get(walker.id) ?? []).length < 2 &&
      !seen.has(walker.id)
    ) {
      seen.add(walker.id)
      walker = board.spaces[walker.next[0] as SpaceId]
    }
    if (!walker || walker.layout.y !== fork.layout.y) continue

    const from = projection.project(fork.layout)
    const to = projection.project(walker.layout)
    const gap = Math.abs(to.x - from.x) - projection.pitch * 1.5
    if (gap < projection.pitch) continue

    const index = pockets.length
    pockets.push({
      id: `pocket-${fork.id}`,
      // Alternating keeps the three of them from reading as a repeated motif.
      kind: index % 2 === 0 ? 'pond' : 'grove',
      centre: { x: (from.x + to.x) / 2, y: from.y },
      rx: gap / 2,
      ry: projection.rowPitch * 0.34,
      path: blobPath(
        { x: (from.x + to.x) / 2, y: from.y },
        gap / 2,
        projection.rowPitch * 0.34,
        hash(`pocket-${fork.id}`),
        0.1,
        28,
      ),
      seed: (hash(fork.id) % 1000) / 1000,
    })
  }

  return pockets
}

/* ── hills along the top edge ────────────────────────────────────────────── */

export interface Ridge {
  readonly id: string
  /** The whole silhouette, and the sunlit left flank of each peak. */
  readonly path: string
  readonly litPath: string
}

/**
 * Two ranges of low hills along the strip above the topmost road, far enough
 * back to read as distance. Their base is the highest the road ever reaches, so
 * they can never crowd it however the domain rearranges its rows.
 */
export function ridges(board: Board, projection: BoardProjection): readonly Ridge[] {
  const points = Object.values(board.spaces).map((space) => projection.project(space.layout))
  const topmost = points.length > 0 ? Math.min(...points.map((point) => point.y)) : projection.marginY
  const base = topmost - projection.roadCasingWidth / 2 - projection.rowPitch * 0.12
  if (base <= 0) return []

  const build = (id: string, seed: number, height: number, lift: number): Ridge => {
    const rng = mulberry32(seed)
    // `base` is as low as any hill may come; the further range sits back above it.
    const bottom = base - lift
    const peaks: Point[] = []
    const count = Math.max(3, Math.round(projection.viewWidth / (projection.pitch * 2.4)))
    const stride = projection.viewWidth / count
    for (let i = -1; i <= count + 1; i += 1) {
      peaks.push({
        x: i * stride + stride * (0.3 + rng() * 0.4),
        y: bottom - height * (0.55 + rng() * 0.45),
      })
    }

    const parts = [`M ${round(-stride)} ${round(bottom)}`]
    const lit: string[] = []
    for (const peak of peaks) {
      const foot = Math.max(projection.pitch * 0.5, stride * 0.62)
      parts.push(
        `Q ${round(peak.x - foot * 0.5)} ${round(peak.y)} ${round(peak.x)} ${round(peak.y)}`,
        `Q ${round(peak.x + foot * 0.5)} ${round(peak.y)} ${round(peak.x + foot)} ${round(bottom)}`,
      )
      lit.push(
        `M ${round(peak.x)} ${round(peak.y)} Q ${round(peak.x - foot * 0.5)} ${round(
          peak.y,
        )} ${round(peak.x - foot)} ${round(bottom)} L ${round(peak.x)} ${round(bottom)} Z`,
      )
    }
    parts.push(
      `L ${round(projection.viewWidth + stride)} ${round(bottom)}`,
      `L ${round(projection.viewWidth + stride)} ${round(bottom + projection.rowPitch)}`,
      `L ${round(-stride)} ${round(bottom + projection.rowPitch)}`,
      'Z',
    )

    return { id, path: parts.join(' '), litPath: lit.join(' ') }
  }

  return [
    build('ridge-far', hash(`ridge-far-${board.width}`), base * 0.62, base * 0.26),
    build('ridge-near', hash(`ridge-near-${board.width}`), base * 0.46, 0),
  ]
}

/* ── the route, as road ──────────────────────────────────────────────────── */

export interface RouteStrand {
  readonly id: string
  readonly path: string
  /** The tile centres the strand runs through, in order. */
  readonly points: readonly Point[]
}

/**
 * The route as a handful of continuous ribbons rather than one line per edge.
 *
 * Each lane is drawn from the junction it leaves, through its own tiles, to the
 * junction it rejoins, with the corners rounded — which is what makes a fork
 * sweep apart like a slip road instead of meeting at a mitre. Drawing whole
 * strands also means the three passes that build the road (kerb, white edging,
 * tarmac) can each be laid down complete, so no strand's outline is ever
 * printed across its neighbour's surface.
 */
export function routeStrands(
  board: Board,
  projection: BoardProjection,
  lanes: readonly BoardLane[],
): readonly RouteStrand[] {
  const { inbound } = wiringOf(board)

  return lanes.flatMap((lane) => {
    const chain = lane.spaceIds
      .map((id) => board.spaces[id])
      .filter((space): space is Space => space !== undefined)
    if (chain.length === 0) return []

    const head = chain[0] as Space
    const tail = chain[chain.length - 1] as Space
    const before = (inbound.get(head.id) ?? [])
      .map((id) => board.spaces[id])
      .filter((space): space is Space => space !== undefined)
    const after = tail.next
      .map((id) => board.spaces[id])
      .filter((space): space is Space => space !== undefined)

    // A lane with several ways in or out becomes one strand per approach, so
    // every branch of a junction gets its own rounded sweep.
    const entries: (Space | null)[] = before.length > 0 ? before : [null]
    const exits: (Space | null)[] = after.length > 0 ? after : [null]

    return entries.flatMap((entry) =>
      exits.map((exit) => {
        const points = [...(entry ? [entry] : []), ...chain, ...(exit ? [exit] : [])].map((space) =>
          projection.project(space.layout),
        )
        return {
          id: `${entry?.id ?? 'in'}>${lane.id}>${exit?.id ?? 'out'}`,
          path: roundedPolyline(points, projection.pitch * 0.62),
          points,
        }
      }),
    )
  })
}

/** Every straight run of route, for anything that has to keep clear of it. */
function routeSegments(board: Board, projection: BoardProjection): readonly (readonly [Point, Point])[] {
  const segments: (readonly [Point, Point])[] = []
  for (const space of Object.values(board.spaces)) {
    const from = projection.project(space.layout)
    for (const nextId of space.next) {
      const next = board.spaces[nextId]
      if (!next) continue
      segments.push([from, projection.project(next.layout)])
    }
  }
  return segments
}

/* ── scenery ─────────────────────────────────────────────────────────────── */

export type SceneryKind =
  | 'tree'
  | 'pine'
  | 'shrub'
  | 'house'
  | 'block'
  | 'tower'
  | 'works'
  | 'school'
  | 'field'
  | 'rock'
  | 'boat'

export interface SceneryPiece {
  readonly id: string
  readonly kind: SceneryKind
  readonly district: District
  readonly x: number
  readonly y: number
  /** A stable 0–1 used to vary size/rotation without another RNG call. */
  readonly seed: number
}

/** What grows or gets built in each district, and how thickly. */
const DISTRICT_SCENERY: Readonly<
  Record<District, { kinds: readonly SceneryKind[]; density: number }>
> = {
  meadow: { kinds: ['tree', 'shrub', 'tree', 'pine'], density: 0.34 },
  campus: { kinds: ['tree', 'school', 'tree', 'shrub'], density: 0.46 },
  works: { kinds: ['works', 'block', 'works', 'tree'], density: 0.48 },
  downtown: { kinds: ['block', 'block', 'tower', 'tree'], density: 0.6 },
  suburb: { kinds: ['house', 'house', 'tree', 'shrub'], density: 0.54 },
  towers: { kinds: ['tower', 'tower', 'block', 'tree'], density: 0.54 },
  uplands: { kinds: ['rock', 'pine', 'rock', 'shrub'], density: 0.44 },
  farmland: { kinds: ['field', 'field', 'tree', 'shrub'], density: 0.46 },
  shore: { kinds: ['pine', 'rock', 'shrub', 'tree'], density: 0.34 },
}

/** Kinds that look wrong on their own and are placed as a block of two or three. */
const CLUSTERED: readonly SceneryKind[] = ['house', 'block', 'tower', 'works', 'field']

/**
 * How far a piece reaches above the ground it stands on and to either side of
 * it, in tiles — the box `Scenery` will actually paint.
 *
 * The anchor is at the foot of a piece, so a tower is drawn a whole tile above
 * where it is placed. Clearing only the anchor is what lets a skyscraper stand
 * politely beside one road and lean across the one on the row above, so what
 * gets cleared is this whole extent.
 */
export function sceneryExtent(kind: SceneryKind): { readonly up: number; readonly side: number } {
  switch (kind) {
    case 'tree':
      return { up: 0.48, side: 0.4 }
    case 'pine':
      return { up: 0.7, side: 0.32 }
    case 'shrub':
      return { up: 0.2, side: 0.28 }
    case 'house':
      return { up: 0.48, side: 0.4 }
    case 'block':
      return { up: 0.74, side: 0.3 }
    case 'tower':
      return { up: 1.16, side: 0.26 }
    case 'works':
      return { up: 1.0, side: 0.44 }
    case 'school':
      return { up: 1.26, side: 0.48 }
    case 'field':
      return { up: 0.28, side: 0.54 }
    case 'rock':
      return { up: 0.38, side: 0.36 }
    default:
      return { up: 0.4, side: 0.48 }
  }
}

/**
 * How far a piece has to stay from a tile, and from a captioned tile.
 *
 * A tile is now a slab standing off the board rather than a print on it, so it
 * covers ground above the point it stands on as well as around it. Both figures
 * carry that extra height.
 */
const TILE_CLEARANCE = 0.95
const CAPTION_CLEARANCE = 1.55

/**
 * Fills the open ground with the buildings, trees and fields of whichever
 * district it belongs to.
 *
 * The scatter is a plain grid search over the board's bounds, seeded from the
 * board's own dimensions, so it never needs a random source, is identical on
 * every render, and settles instantly rather than animating in as the layout
 * changes. Nothing is placed until its whole painted extent has been proved
 * clear of every tile, of every stretch of road, of the courtyards the forks
 * enclose, and of the viewBox edge — the guarantee that lets the density be
 * turned up without anything ever landing where a player has to read.
 *
 * Where the first choice will not fit, a smaller neighbour from the same
 * district is tried before giving up, so a tight gap gets a hedge rather than a
 * hole.
 */
export function scatterScenery(board: Board, projection: BoardProjection): readonly SceneryPiece[] {
  const spaces = Object.values(board.spaces)
  const lanes = boardLanes(board)
  const districts = districtBySpace(lanes)
  const water = coastline(board, projection)
  const segments = routeSegments(board, projection)
  const pockets = forkPockets(board, projection)

  const tiles = spaces.map((space) => ({
    at: projection.project(space.layout),
    district: districts.get(space.id) ?? 'meadow',
    clearance: projection.tileSize * (spaceCaption(space) ? CAPTION_CLEARANCE : TILE_CLEARANCE),
  }))

  const roadHalf = projection.roadCasingWidth / 2
  const cell = projection.pitch * 0.56
  const rng = mulberry32(Math.round(board.width * 1000 + board.height))

  /** The district a point belongs to, or `null` if nothing may stand there. */
  const groundAt = (x: number, y: number): District | null => {
    let nearest: District | null = null
    let nearestGap = Infinity
    for (const tile of tiles) {
      const gap = Math.hypot(x - tile.at.x, y - tile.at.y)
      if (gap < tile.clearance) return null
      if (gap < nearestGap) {
        nearestGap = gap
        nearest = tile.district
      }
    }
    return nearest
  }

  const fits = (x: number, y: number, kind: SceneryKind): boolean => {
    const extent = sceneryExtent(kind)
    const side = projection.tileSize * extent.side
    const up = projection.tileSize * extent.up
    if (x - side < 0 || x + side > projection.viewWidth) return false
    if (y - up < 0 || y + side > projection.viewHeight) return false

    for (const top of [0, up / 2, up]) {
      const at = { x, y: y - top }
      for (const [a, b] of segments) {
        if (distanceToSegment(at, a, b) < roadHalf + side) return false
      }
      for (const pocket of pockets) {
        const nx = (at.x - pocket.centre.x) / (pocket.rx + side)
        const ny = (at.y - pocket.centre.y) / (pocket.ry + side)
        if (nx * nx + ny * ny < 1) return false
      }
      if (at.y > water.waterline(at.x)) return false
    }
    return true
  }

  const pieces: SceneryPiece[] = []
  const place = (x: number, y: number, district: District, pick: number, seed: number): boolean => {
    const plan = DISTRICT_SCENERY[district]
    const first = plan.kinds[Math.floor(pick * plan.kinds.length)] as SceneryKind
    const smallestFirst = [...plan.kinds].sort((a, b) => sceneryExtent(a).up - sceneryExtent(b).up)
    for (const kind of [first, ...smallestFirst]) {
      if (!fits(x, y, kind)) continue
      pieces.push({ id: `scenery-${pieces.length}`, kind, district, x, y, seed })
      return true
    }
    return false
  }

  for (let gy = cell * 0.5; gy < projection.viewHeight; gy += cell) {
    for (let gx = cell * 0.5; gx < projection.viewWidth; gx += cell) {
      const roll = rng()
      const jx = clamp(gx + (rng() - 0.5) * cell * 0.7, 0, projection.viewWidth)
      const jy = clamp(gy + (rng() - 0.5) * cell * 0.7, 0, projection.viewHeight)
      const pick = rng()
      const seed = rng()
      const spread = rng()

      // Out at sea only the odd boat, and never one moored on the sand.
      if (jy > water.waterline(jx)) {
        const extent = sceneryExtent('boat')
        const side = projection.tileSize * extent.side
        const afloat = jy > water.waterline(jx) + projection.rowPitch * 0.5
        const inside =
          jx - side > 0 &&
          jx + side < projection.viewWidth &&
          jy + side < projection.viewHeight &&
          jy - projection.tileSize * extent.up > 0
        if (roll < 0.06 && afloat && inside) {
          pieces.push({
            id: `scenery-${pieces.length}`,
            kind: 'boat',
            district: 'shore',
            x: jx,
            y: jy,
            seed,
          })
        }
        continue
      }

      const district = groundAt(jx, jy)
      if (!district) continue
      const plan = DISTRICT_SCENERY[district]
      if (roll > plan.density) continue
      if (!place(jx, jy, district, pick, seed)) continue

      // Buildings look planted rather than dropped when they come in twos and
      // threes, so a kept cell tries to bring a neighbour or two with it.
      const planted = pieces[pieces.length - 1]
      if (!planted || !CLUSTERED.includes(planted.kind)) continue
      const mates = spread < 0.35 ? 2 : 1
      for (let n = 0; n < mates; n += 1) {
        const angle = (spread + n * 0.41) * Math.PI * 2
        const reach = cell * (0.5 + spread * 0.5)
        const nx = jx + Math.cos(angle) * reach
        const ny = jy + Math.sin(angle) * reach * 0.7
        if (groundAt(nx, ny) !== district) continue
        if (!fits(nx, ny, planted.kind)) continue
        pieces.push({
          id: `scenery-${pieces.length}`,
          kind: planted.kind,
          district,
          x: nx,
          y: ny,
          seed: (seed + 0.37 * (n + 1)) % 1,
        })
      }
    }
  }

  return pieces
}

/**
 * Lays `count` cars out in a unit echelon and returns the `index`-th one's
 * offset from the tile centre — each one parked a step further down the board
 * than the last, and a little further along it, so every car keeps its own
 * roofline and its own passengers clear of the one in front, and because no
 * two share a row the board can be drawn back to front without anything
 * vanishing behind anything else.
 *
 * Pure layout arithmetic only: what `index` and `count` *mean* — which
 * players, and how many of them — is entirely the caller's decision. See
 * `fanSlot`, which is where a space's actual occupants become these two
 * numbers.
 */
export function pawnSlot(index: number, count: number): Point {
  if (count <= 1) return { x: 0, y: 0 }
  const half = (count - 1) / 2
  const step = (index - half) / half
  // Both axes, normalised to ±1. How far a step actually reaches on each is the
  // view's decision, because it depends on how long a car is drawn — and a car
  // needs far more room sideways than it does front to back.
  return { x: step, y: step }
}

/**
 * Where a player's car parks, fanned out against only the rivals actually
 * sharing this space — never the whole table.
 *
 * A game has up to four players, but any one space rarely holds all of them:
 * most of the time it is two, occasionally three. Fanning against the full
 * roster reserves a bay for every player in the game whether or not they are
 * anywhere near this tile, which leaves the two or three who really are
 * sharing it almost stacked on top of each other — the tighter the group
 * actually parked here, the more of the spread was wasted on empty bays. This
 * fans against the space's real occupants instead, so two players sharing a
 * tile always get the two *most separated* slots the tile has, regardless of
 * how many other players are elsewhere on the board.
 *
 * A car's rank within that smaller group still comes from its fixed seat at
 * the table — `playerSpaces`' own order — never from arrival order, so where
 * a car sits is predictable rather than packed. It moves only when the group
 * it is *actually parked with* gains or loses a member, which is the one
 * moment a shove sideways reads as the row making room rather than as the
 * token wandering on its own.
 *
 * `playerIndex` is always counted as present at `targetSpaceId`, whether or
 * not `playerSpaces[playerIndex]` agrees — that lets a car mid-hop ask for its
 * slot at a space it hasn't officially arrived at yet, fanned against whoever
 * is already parked there.
 */
export function fanSlot(
  playerSpaces: readonly (SpaceId | undefined)[],
  playerIndex: number,
  targetSpaceId: SpaceId | undefined,
): Point {
  if (!targetSpaceId) return { x: 0, y: 0 }
  const occupants: number[] = []
  playerSpaces.forEach((spaceId, index) => {
    if (index === playerIndex || spaceId === targetSpaceId) occupants.push(index)
  })
  const rank = occupants.indexOf(playerIndex)
  return pawnSlot(rank < 0 ? 0 : rank, occupants.length)
}
