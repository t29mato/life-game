import type { Board, Space, SpaceId } from '@domain/model/types'
import { clamp, spaceAccent, type BoardProjection, type Point } from './boardLayout'

/**
 * Where the camera is pointed and how close it sits.
 *
 * A shot is expressed in board space — a point to centre on and a zoom — so the
 * rules about *what* to look at never touch pixels. `cameraTransform` is the
 * only place a shot becomes something the DOM can use.
 */
export interface CameraShot {
  readonly cx: number
  readonly cy: number
  /** 1 frames the whole board. Larger is closer; below 1 is clamped away. */
  readonly zoom: number
}

/** The rectangle of board a shot actually shows, in viewBox units. */
export interface CameraRect {
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
}

/**
 * The shot as an SVG transform on the drawing: translate, then scale about the
 * viewBox origin. Applied to a group inside a viewBox that never changes, so a
 * React re-render can never fight the camera for an attribute.
 */
export interface CameraTransform {
  readonly x: number
  readonly y: number
  readonly scale: number
}

/** The whole board in frame — used only as a passing establishing shot now. */
export const WIDE_ZOOM = 1
/** Close enough to read a tile, wide enough to see what is coming. */
export const FOLLOW_ZOOM = 1.32
/**
 * Where a player plans their next spin from. Close enough that the tiles
 * around their car are legible — the board's whole reason for existing — but
 * loose enough that a couple of tiles show in every direction, because a spin
 * is a question about what happens next and the frame ought to answer it.
 */
export const REST_ZOOM = 1.42
/** Held on the space a turn resolved on, so the player sees what happened. */
export const RESOLVE_ZOOM = 1.5
/** Arriving somewhere the game is actually about. */
export const MILESTONE_ZOOM = 1.85
/** The opening sweep, high enough to read the road ahead. */
export const FLYTHROUGH_ZOOM = 1.45

/** How many hops out from a milestone the camera starts easing in. */
const APPROACH_HOPS = 3

/**
 * The rectangle every tile actually sits in, in viewBox units — not the
 * viewBox itself, which is padded for `margin`/`marginY` and can end up
 * larger than the route on one axis than the other depending on how a
 * fork's `ensureRoom` happened to widen the serpentine partway through.
 * Scenery drawn past this box (hills, coastline, the scattered background
 * buildings) is not part of it either.
 */
export function routeBounds(board: Board, projection: BoardProjection): CameraRect {
  const points = Object.values(board.spaces).map((space) => projection.project(space.layout))
  if (points.length === 0) {
    return { x: 0, y: 0, width: projection.viewWidth, height: projection.viewHeight }
  }
  const xs = points.map((p) => p.x)
  const ys = points.map((p) => p.y)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
}

/**
 * How much slack `wideShot` leaves around the outermost row, in tile
 * widths. Kept small on purpose — the owner's own words were "bigger is
 * more fun" — just enough that a tile's icon or label never sits flush
 * against the very edge of the frame.
 */
export const WIDE_SHOT_PADDING_TILES = 0.25

/** The bounding box of `bounds` widened to also cover every point in `points`. */
function withExtraPoints(bounds: CameraRect, points: readonly Point[]): CameraRect {
  if (points.length === 0) return bounds
  const xs = [bounds.x, bounds.x + bounds.width, ...points.map((p) => p.x)]
  const ys = [bounds.y, bounds.y + bounds.height, ...points.map((p) => p.y)]
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
}

/**
 * The overview shot: `routeBounds` filling the frame rather than merely
 * fitting inside it. `Math.max` rather than `Math.min` on purpose — a
 * fork's aspect ratio essentially never matches the viewBox's, and fitting
 * the *shorter* axis (`Math.min`) left the *longer* axis showing real board
 * past the outermost tile, past the point where it read as "the map is
 * mostly empty ground" rather than as a frame. Filling the *longer* axis
 * instead means the shorter one now crops a sliver off the route at the
 * outermost edge — a deliberate trade the owner asked for: looking big
 * beats staying fully in frame.
 *
 * `playerPoints` — every current player's own car, at the exact point it is
 * actually drawn (see `pointOf` in `Board.tsx`), not just the tile-centre
 * box `routeBounds` measures — is only ever allowed to pull the frame
 * *out*, never further in. If the ordinary cover-cropped frame above
 * already holds every one of them, it is used unchanged: the common case
 * loses nothing. Only a player a cover crop would genuinely have cut out of
 * frame forces a fall back to a fit — `Math.min`, contain rather than
 * cover — of the *route and that player together*, which by construction
 * can never crop either one. A car parked in a tight corner therefore costs
 * a little of the "big" look right then; nothing else does.
 *
 * That guarantee is itself bounded by `WIDE_ZOOM`: `shotRect` never zooms
 * out past 1 regardless of what a shot asks for, and a `containerAspect`
 * far enough from the fixed viewBox's own shape already spends part of
 * that budget before this fallback gets a say (see `aspectStretch`). A
 * player far enough outside the route, on a container stretched enough,
 * can still end up beyond the frame — the same already-accepted edge the
 * empty-board case at the top of this function backs into.
 */
export function wideShot(
  projection: BoardProjection,
  board: Board,
  playerPoints: readonly Point[] = [],
  containerAspect: number = projection.viewWidth / projection.viewHeight,
): CameraShot {
  const bounds = routeBounds(board, projection)
  const pad = projection.tileSize * WIDE_SHOT_PADDING_TILES
  const padded: CameraRect = { x: bounds.x - pad, y: bounds.y - pad, width: bounds.width + pad * 2, height: bounds.height + pad * 2 }

  const routeZoom =
    padded.width <= 0 || padded.height <= 0
      ? WIDE_ZOOM
      : Math.max(WIDE_ZOOM, projection.viewWidth / padded.width, projection.viewHeight / padded.height)
  const routeCx = padded.x + padded.width / 2
  const routeCy = padded.y + padded.height / 2

  if (playerPoints.length === 0) return { cx: routeCx, cy: routeCy, zoom: routeZoom }

  // `shotRect` zooms in past `routeZoom` by however far the live container
  // strays from the fixed viewBox's own shape, so the frame it actually
  // draws is tighter than `routeZoom` alone implies — checked here against
  // that same tighter frame, or a player this fit still covers on paper
  // could be cropped away for real once the container's own shape is
  // accounted for.
  const stretch = aspectStretch(projection, containerAspect)
  const effectiveZoom = routeZoom * stretch
  const halfW = projection.viewWidth / effectiveZoom / 2
  const halfH = projection.viewHeight / effectiveZoom / 2
  const allInFrame = playerPoints.every(
    (p) => Math.abs(p.x - routeCx) <= halfW && Math.abs(p.y - routeCy) <= halfH,
  )
  if (allInFrame) return { cx: routeCx, cy: routeCy, zoom: routeZoom }

  const union = withExtraPoints(padded, playerPoints)
  // Divided by `stretch` up front so that `shotRect`'s own later multiply
  // by that same `stretch` lands back on the true containing zoom — this
  // fallback's whole guarantee is that the frame it asks for *contains*
  // the union, and zooming in any further than that (unchecked) would
  // break exactly the guarantee it exists for.
  const zoom =
    union.width <= 0 || union.height <= 0
      ? WIDE_ZOOM
      : Math.max(
          WIDE_ZOOM,
          Math.min(projection.viewWidth / union.width, projection.viewHeight / union.height) / stretch,
        )
  return { cx: union.x + union.width / 2, cy: union.y + union.height / 2, zoom }
}

/**
 * Frames `at` as closely as `zoom` allows without ever showing past the edge of
 * the board — a camera that drifts off the card breaks the illusion that the
 * board is an object rather than a picture.
 *
 * `containerAspect` has to be threaded all the way through here rather than
 * left to `cameraTransform`'s own default: this function's whole job is
 * clamping `at` against the frame's actual edges, and the frame `shotRect`
 * draws once `cameraTransform` applies its own stretch is a different,
 * usually tighter, rectangle than the one this function would clamp
 * against on the default alone. A clamp computed against the wrong
 * rectangle does not fail loudly — it just quietly overrides whatever
 * `at` asked for with wherever *that* rectangle's edge happened to be.
 */
export function focusShot(
  projection: BoardProjection,
  at: Point,
  zoom: number,
  containerAspect: number = projection.viewWidth / projection.viewHeight,
): CameraShot {
  const rect = shotRect(projection, { cx: at.x, cy: at.y, zoom }, containerAspect)
  return { cx: rect.x + rect.width / 2, cy: rect.y + rect.height / 2, zoom: Math.max(WIDE_ZOOM, zoom) }
}

/**
 * How much further than `shot.zoom` alone to zoom in, because the live
 * container the board is actually drawn into is some other shape than the
 * fixed viewBox's own. The `<svg>` itself already crops or reveals more of
 * that fixed viewBox to fill whatever shape the container is — see
 * `preserveAspectRatio="xMidYMid slice"` on the drawing itself — but that
 * crop happens on the *board's own decorative canvas*, not on the route:
 * a wide desktop window and a tall phone both reveal exactly as much of the
 * fixed viewBox as their own shape calls for, whether or not the route
 * actually reaches that far. A serpentine route only fills a *wide* frame
 * by accident, when several of its rows happen to line up under it — most
 * of the extra a very wide window asks for is bare board, not more route.
 * Zooming in by how far the container's own shape strays from the fixed
 * viewBox's — in *either* direction, a narrow phone included — keeps the
 * frame close to what the fixed viewBox itself was already shaped for,
 * rather than stretching it to fit whatever shape a window happens to be.
 */
function aspectStretch(projection: BoardProjection, containerAspect: number): number {
  const viewAspect = projection.viewWidth / projection.viewHeight
  return Math.max(containerAspect / viewAspect, viewAspect / containerAspect)
}

/** The board the shot shows, clamped inside the viewBox. */
export function shotRect(
  projection: BoardProjection,
  shot: CameraShot,
  containerAspect: number = projection.viewWidth / projection.viewHeight,
): CameraRect {
  const zoom = Math.max(WIDE_ZOOM, shot.zoom) * aspectStretch(projection, containerAspect)
  const width = projection.viewWidth / zoom
  const height = projection.viewHeight / zoom
  return {
    x: clamp(shot.cx - width / 2, 0, projection.viewWidth - width),
    y: clamp(shot.cy - height / 2, 0, projection.viewHeight - height),
    width,
    height,
  }
}

export function cameraTransform(
  projection: BoardProjection,
  shot: CameraShot,
  containerAspect: number = projection.viewWidth / projection.viewHeight,
): CameraTransform {
  const zoom = Math.max(WIDE_ZOOM, shot.zoom) * aspectStretch(projection, containerAspect)
  const rect = shotRect(projection, shot, containerAspect)
  // Subtracted rather than negated so the wide shot is a clean `translate(0 0)`
  // and not the negative zero that would otherwise be written into the DOM.
  return { x: 0 - rect.x * zoom, y: 0 - rect.y * zoom, scale: zoom }
}

function smoothstep(t: number): number {
  const clamped = clamp(t, 0, 1)
  return clamped * clamped * (3 - 2 * clamped)
}

/**
 * How close the camera sits on the `step`-th of `total` hops of one move.
 *
 * When the move ends somewhere that matters the last few hops ease in, so the
 * arrival is felt a beat before it happens rather than announced after it. A
 * move that ends on an ordinary space never leaves the follow distance, and the
 * ramp is the same curve whether the move is two hops or ten.
 */
export function approachZoom(step: number, total: number, arrivalZoom: number): number {
  if (total <= 0) return FOLLOW_ZOOM
  const hopsLeft = total - 1 - step
  return FOLLOW_ZOOM + (arrivalZoom - FOLLOW_ZOOM) * smoothstep(1 - hopsLeft / APPROACH_HOPS)
}

/** How close the camera ends a move that lands on `spaceId`. */
export function arrivalZoom(board: Board, spaceId: SpaceId | undefined): number {
  const space = spaceId === undefined ? undefined : board.spaces[spaceId]
  if (!space) return FOLLOW_ZOOM
  return spaceAccent(space) === 'milestone' ? MILESTONE_ZOOM : FOLLOW_ZOOM
}

/**
 * How far the rest frame leans toward what comes next, 0 (dead centre on the
 * car) to 1 (centred on the next space instead). Kept well short of 1: this is
 * a nudge that trades a little of the space behind the car for a little more
 * of the space ahead of it, not a second camera pointed down the road.
 */
const REST_LEAD = 0.32

/**
 * How far the rest frame's own tight zoom is worth trusting to also fall
 * on real board — see `localDensityCentre`. A serpentine only fills a
 * frame this size by luck; nudging toward wherever tiles genuinely are
 * nearby is worth a little of the "dead centre on the car" a spin's
 * question about what's ahead already gave up some of. Kept short of
 * `REST_LEAD` itself — this is a correction for bad luck, not the frame's
 * main reason for pointing anywhere.
 */
const DENSITY_PULL = 0.3
/** How far out "nearby" reaches when weighing which way tiles actually are, in tile widths. */
const DENSITY_RADIUS_TILES = 4.5

/**
 * The centre of every space within a short reach of `space`, in whichever
 * direction the route's own tiles actually continue — not necessarily the
 * direction a fixed lean or a dead-centre frame would have guessed.
 *
 * A serpentine route folds back on itself constantly; the tiles nearest a
 * given space, in board-space distance, are not reliably "the next few
 * spaces down the route" — a parallel lane two rows over can sit closer
 * than the space three hops ahead. That is exactly the point here: this
 * asks what is actually nearby to look at, not what the route graph says
 * comes next.
 */
function localDensityCentre(board: Board, projection: BoardProjection, space: Space): Point {
  const at = projection.project(space.layout)
  const radius = projection.tileSize * DENSITY_RADIUS_TILES
  const nearby = Object.values(board.spaces)
    .map((candidate) => projection.project(candidate.layout))
    .filter((point) => Math.hypot(point.x - at.x, point.y - at.y) <= radius)
  if (nearby.length === 0) return at
  return {
    x: nearby.reduce((sum, point) => sum + point.x, 0) / nearby.length,
    y: nearby.reduce((sum, point) => sum + point.y, 0) / nearby.length,
  }
}

/**
 * Where the rest shot centres: the active player's own tile, nudged toward
 * whatever space comes after it, and toward wherever the route's own tiles
 * actually cluster nearby.
 *
 * A player at rest is about to spin, and a spin is a question about what's
 * ahead — so the frame leans that way rather than sitting dead centre on the
 * car, which is what let a tightly zoomed rest shot feel like it was hiding
 * the very thing a player needs to see to plan a move. A fork leans toward the
 * average of every branch rather than picking one, since which branch the
 * player takes is exactly what the spin decides. The density pull is what
 * keeps that same tight zoom from just as often pointing at whatever bare
 * board a wide fork elsewhere happened to leave beside this stretch of route
 * — see `localDensityCentre`.
 */
export function restPoint(board: Board, projection: BoardProjection, space: Space): Point {
  const at = projection.project(space.layout)
  const nexts = space.next
    .map((id) => board.spaces[id])
    .filter((next): next is Space => next !== undefined)
  if (nexts.length === 0) {
    const density = localDensityCentre(board, projection, space)
    return { x: at.x + (density.x - at.x) * DENSITY_PULL, y: at.y + (density.y - at.y) * DENSITY_PULL }
  }

  const ahead = projection.project({
    x: nexts.reduce((sum, next) => sum + next.layout.x, 0) / nexts.length,
    y: nexts.reduce((sum, next) => sum + next.layout.y, 0) / nexts.length,
  })
  const leaned = { x: at.x + (ahead.x - at.x) * REST_LEAD, y: at.y + (ahead.y - at.y) * REST_LEAD }
  const density = localDensityCentre(board, projection, space)
  return { x: leaned.x + (density.x - leaned.x) * DENSITY_PULL, y: leaned.y + (density.y - leaned.y) * DENSITY_PULL }
}

/** The shot a player plans their next spin from: `space`, at `REST_ZOOM`, leaning toward the road ahead. */
export function restShot(
  board: Board,
  projection: BoardProjection,
  space: Space,
  containerAspect: number = projection.viewWidth / projection.viewHeight,
): CameraShot {
  return focusShot(projection, restPoint(board, projection, space), REST_ZOOM, containerAspect)
}

/**
 * The shots the camera plays through to settle at rest.
 *
 * Ordinarily that is just the rest shot itself — a small adjustment from
 * wherever the camera already was. But the first moment a *new* player is
 * handed the table, a rest shot alone would just zoom them straight in on
 * wherever their car already sits, with no sense of where that is in the
 * board as a whole. `establishing` asks for a brief passing wide shot first,
 * so the player sees the whole route for a beat before the camera commits to
 * their corner of it — the one moment this game spends its zoom budget on
 * orientation instead of legibility.
 */
export function restSequence(
  board: Board,
  projection: BoardProjection,
  space: Space | undefined,
  establishing: boolean,
  playerPoints: readonly Point[] = [],
  containerAspect: number = projection.viewWidth / projection.viewHeight,
): readonly CameraShot[] {
  const rest = space
    ? restShot(board, projection, space, containerAspect)
    : wideShot(projection, board, playerPoints, containerAspect)
  return establishing ? [wideShot(projection, board, playerPoints, containerAspect), rest] : [rest]
}

/**
 * The opening sweep: the camera runs the length of the route before the first
 * spin, so a player sees the life ahead of them — the fork out of school, the
 * wedding, the houses, the coast at the end — instead of meeting it a tile at a
 * time.
 *
 * It walks the board's own graph rather than a hand-written list of landmarks,
 * always taking the first branch, so a longer or shorter board sweeps its own
 * route without this file knowing anything about it. It always ends on the wide
 * shot, which is where play begins.
 */
export function flythroughShots(
  board: Board,
  projection: BoardProjection,
  stops = 6,
  playerPoints: readonly Point[] = [],
  containerAspect: number = projection.viewWidth / projection.viewHeight,
): readonly CameraShot[] {
  const route: Point[] = []
  const seen = new Set<SpaceId>()
  let id: SpaceId | undefined = board.startSpaceId

  while (id !== undefined && !seen.has(id)) {
    const space: Space | undefined = board.spaces[id]
    if (!space) break
    seen.add(id)
    route.push(projection.project(space.layout))
    id = space.next[0]
  }

  if (route.length === 0) return [wideShot(projection, board, playerPoints, containerAspect)]

  const wanted = Math.max(1, Math.min(stops, route.length))
  const shots: CameraShot[] = []
  for (let i = 0; i < wanted; i += 1) {
    // Evenly spaced along the route, always including both ends.
    const at = route[wanted === 1 ? 0 : Math.round((i * (route.length - 1)) / (wanted - 1))] as Point
    shots.push(focusShot(projection, at, FLYTHROUGH_ZOOM, containerAspect))
  }
  shots.push(wideShot(projection, board, playerPoints, containerAspect))
  return shots
}
