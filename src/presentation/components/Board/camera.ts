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
  /**
   * How far this shot is allowed to reach past the edge of the board's own
   * card, as a fraction of the frame it shows — see `FOLLOW_SLACK`, which is
   * the only value anything actually asks for. Absent (the default) is the
   * old behaviour exactly: the frame stays wholly on the card.
   *
   * It rides on the shot rather than being a parameter of the clamp because
   * a shot is re-clamped after it is chosen — `userZoomedShot` magnifies it
   * and `cameraTransform` clamps again at the new zoom — and a permission
   * that did not travel with the shot would be silently revoked on the way
   * to the DOM.
   */
  readonly slack?: number
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

/* ── the player's own zoom ─────────────────────────────────────────────────
   Everything above is the camera deciding for itself what the moment calls
   for. This is the one dial the *player* holds, and it deliberately sits on
   top of all of it rather than beside it: a magnification applied to
   whichever shot the camera would have taken anyway, so a player who has
   zoomed in still gets the rest shot's lean down the road, the approach's
   ease into a milestone, and the handoff pan to the next car — only closer.
   A second, independent camera would have had to re-answer every one of
   those questions, and would have answered them worse. */

/** No magnification at all — exactly the framing every shot above was designed to produce. */
export const USER_ZOOM_FIT = 1

/**
 * As close as the player may pull the map in, as a multiple of the shot's
 * own zoom. Four is roughly two tiles across a phone's width at the rest
 * shot — close enough to read a caption with a thumb over the screen, and
 * short of the point where the board's card stock and the road's own strokes
 * (drawn for a map, not for an inspection) start to look thin.
 */
export const USER_ZOOM_MAX = 4

/**
 * What one press of the + or − button is worth. A ratio rather than an
 * addition, because zoom is felt multiplicatively: the same press has to
 * read as the same size of change whether the map is at fit or already
 * halfway in. Chosen so the whole range is six presses — few enough that
 * reaching the far end is not a chore, coarse enough that a press is
 * visibly worth pressing.
 */
export const USER_ZOOM_STEP = 1.32

/**
 * How near fit a stepped-down zoom has to land before it is taken to *be*
 * fit. Float noise alone (1.32 / 1.32 is not exactly 1) would otherwise
 * leave the map a hair inside fit with the zoom-out button still lit and
 * nothing left to give, and a player stepping all the way back out is
 * asking for the default framing, not for 100.3%.
 */
const USER_ZOOM_FIT_SNAP = 1.04

/** The player's zoom, held inside the range the map is actually drawn for. */
export function clampUserZoom(zoom: number): number {
  // A pinch whose two fingers land on the same pixel divides by zero and
  // hands us a NaN, which `clamp` would pass straight through and the
  // transform would then write into the DOM as the string "NaN" — a blank
  // board. Read as "no zoom asked for" instead; an infinity is just the far
  // end of the range and clamps there like any other number.
  if (Number.isNaN(zoom)) return USER_ZOOM_FIT
  return clamp(zoom, USER_ZOOM_FIT, USER_ZOOM_MAX)
}

/** One press of the zoom controls: `direction` is +1 to close in, -1 to pull back. */
export function stepUserZoom(zoom: number, direction: number): number {
  const stepped = clampUserZoom(zoom * (direction >= 0 ? USER_ZOOM_STEP : 1 / USER_ZOOM_STEP))
  return stepped <= USER_ZOOM_FIT * USER_ZOOM_FIT_SNAP ? USER_ZOOM_FIT : stepped
}

/**
 * `shot`, magnified by however far the player has zoomed in.
 *
 * At fit it returns the shot itself, untouched and by identity — the
 * default framing is not "the zoom feature happening to be set to 1", it is
 * the same object the camera has always handed to `cameraTransform`, and
 * every existing test that asserts an exact transform is still asserting
 * against exactly that.
 */
export function userZoomedShot(shot: CameraShot, userZoom: number): CameraShot {
  const zoom = clampUserZoom(userZoom)
  return zoom === USER_ZOOM_FIT ? shot : { ...shot, zoom: shot.zoom * zoom }
}

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

/* ── keeping the car in shot ───────────────────────────────────────────────
   The band the active car is promised, and the one permission the camera
   needs to be able to keep that promise. */

/**
 * The slice of the frame the active car is held inside — dead centre is 0.5,
 * and these are how far either way it is allowed to drift before the camera
 * is doing its job badly. Straight from the playtest: "keep the pawn within
 * 40–60% of the viewport" (issue #25).
 */
export const FOLLOW_BAND_MIN = 0.4
export const FOLLOW_BAND_MAX = 0.6

/**
 * How far a following shot may reach past the board's own card, as a
 * fraction of the frame it shows.
 *
 * This is not a taste number — it is exactly what the band above costs, and
 * the arithmetic is short enough to state. Write the frame's width `w` and
 * the car's distance from the board's edge `c`. Clamped flush to the card
 * the frame's centre can get no nearer the edge than `w/2`, so the car lands
 * at `c/w` of the frame: a car on the outermost tile of a ten-wide board sits
 * at about 11% — pinned to the very edge of the screen, which is precisely
 * what was reported. Let the centre reach `s·w` further out and the car lands
 * at `c/w + s` instead, so `s = 0.4` puts *every* point on the card inside
 * `[0.4, 0.6]`: at or past `0.1w` from the edge the frame simply centres on
 * the car (`f = 0.5`), and closer in than that it degrades to no worse than
 * `0.4`, never past it.
 *
 * What it costs is a strip of off-board ground in shot when the car is right
 * at the edge of the map. That used to be reason enough not to do it — "a
 * camera that drifts off the card breaks the illusion that the board is an
 * object" — so the ground under the board is drawn out past the card's own
 * edge to meet it (see `.landscape` in `Board.tsx`). The illusion the old
 * clamp protected is kept; the pinned car it cost is not.
 */
export const FOLLOW_SLACK = FOLLOW_BAND_MIN

/**
 * Where `point` lands inside the frame `shot` actually puts on screen, as a
 * fraction of that frame on each axis: 0.5 is dead centre, 0 and 1 its edges,
 * and outside 0–1 is off screen entirely.
 *
 * Measured against the *visible* band rather than `shotRect`'s full rect,
 * for the same reason that rect's own clamp is: `preserveAspectRatio="xMidYMid
 * slice"` shows only the middle of it on whichever axis the container is not
 * the fixed viewBox's own shape, and a promise about "the viewport" has to be
 * a promise about the part a player can actually see.
 */
export function framePosition(
  projection: BoardProjection,
  shot: CameraShot,
  point: Point,
  containerAspect: number = projection.viewWidth / projection.viewHeight,
): Point {
  const rect = shotRect(projection, shot, containerAspect)
  const seen = seenSpan(projection, rect, containerAspect)
  const cx = rect.x + rect.width / 2
  const cy = rect.y + rect.height / 2
  return {
    x: (point.x - (cx - seen.x / 2)) / seen.x,
    y: (point.y - (cy - seen.y / 2)) / seen.y,
  }
}

/**
 * How much of `rect` is actually on screen, in viewBox units — the `slice`
 * crop applied to whichever axis the container is not shaped for. Everything
 * that reasons about where something sits *on screen* has to work in these
 * numbers rather than the rect's own.
 */
function seenSpan(projection: BoardProjection, rect: CameraRect, containerAspect: number): Point {
  const viewAspect = projection.viewWidth / projection.viewHeight
  return {
    x: containerAspect >= viewAspect ? rect.width : (rect.width * containerAspect) / viewAspect,
    y: containerAspect >= viewAspect ? (rect.height * viewAspect) / containerAspect : rect.height,
  }
}

/** Whether `point` sits inside the band the active car is promised. */
export function framesPoint(
  projection: BoardProjection,
  shot: CameraShot,
  point: Point,
  containerAspect: number = projection.viewWidth / projection.viewHeight,
): boolean {
  const at = framePosition(projection, shot, point, containerAspect)
  const inside = (v: number): boolean => v >= FOLLOW_BAND_MIN - EPSILON && v <= FOLLOW_BAND_MAX + EPSILON
  return inside(at.x) && inside(at.y)
}

/**
 * Frames `at` as closely as `zoom` allows without showing more of the world
 * past the edge of the board than `slack` allows — a camera that drifts off
 * the card breaks the illusion that the board is an object rather than a
 * picture, and `slack` is how much of that illusion a shot is willing to
 * spend to keep the car in frame (see `FOLLOW_SLACK`; the default spends
 * none).
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
  slack = 0,
): CameraShot {
  // Written into the shot rather than passed alongside it: the shot this
  // returns is clamped again downstream (magnified, then turned into a
  // transform), and a permission left behind here would be revoked there.
  const asked: CameraShot = { cx: at.x, cy: at.y, zoom, ...(slack > 0 ? { slack } : {}) }
  const rect = shotRect(projection, asked, containerAspect)
  return {
    cx: rect.x + rect.width / 2,
    cy: rect.y + rect.height / 2,
    zoom: Math.max(WIDE_ZOOM, zoom),
    ...(slack > 0 ? { slack } : {}),
  }
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
 * actually reaches that far. Zooming in by how far the container's own
 * shape strays from the fixed viewBox's keeps the frame close to what the
 * fixed viewBox itself was already shaped for, rather than stretching it to
 * fit whatever shape a window happens to be.
 *
 * The two directions are not treated alike. A *narrow* phone gets the full
 * correction: its extra reveal really is decorative margin past the route's
 * sides, and the correction is also what keeps the tiles readable on a
 * small screen at all. A *wide* desktop window gets only a tempered share
 * of it (`WIDE_STRETCH_TEMPER`): these boards are taller than they are
 * wide, so a wide window's extra reveal is whole extra *rows* — real route,
 * exactly what a player on a large screen expects to see more of — and the
 * full correction compounded with the slice crop until a desktop rest shot
 * showed barely a row and read as "the camera is pressed against the map"
 * (the owner's own report).
 */
function aspectStretch(projection: BoardProjection, containerAspect: number): number {
  const viewAspect = projection.viewWidth / projection.viewHeight
  const ratio = containerAspect / viewAspect
  return ratio >= 1 ? Math.pow(ratio, WIDE_STRETCH_TEMPER) : 1 / ratio
}

/**
 * How much of the wide-container correction above is actually applied, as an
 * exponent on the aspect ratio's excess: 1 is the full correction, 0 none.
 */
const WIDE_STRETCH_TEMPER = 0.35

/**
 * The board the shot shows, clamped so that what the *viewer* sees stays
 * inside the viewBox.
 *
 * The rect maps onto the whole fixed viewBox (see `cameraTransform`), but
 * the `xMidYMid slice` drawing shows only the middle band of that viewBox
 * on whichever axis the container is shorter than it — so only the middle
 * band of this rect is ever on screen. The clamp bounds *that band*, not
 * the rect: a rect overhanging the board's edge is fine as long as the
 * overhang is entirely inside the invisible crop, and — the half that
 * actually bites — the board's own top and bottom rows could never reach a
 * wide container's visible band at all if the rect itself were pinned flush
 * to the edge.
 */
export function shotRect(
  projection: BoardProjection,
  shot: CameraShot,
  containerAspect: number = projection.viewWidth / projection.viewHeight,
): CameraRect {
  const zoom = Math.max(WIDE_ZOOM, shot.zoom) * aspectStretch(projection, containerAspect)
  const width = projection.viewWidth / zoom
  const height = projection.viewHeight / zoom
  const viewAspect = projection.viewWidth / projection.viewHeight
  const seenWidth = containerAspect >= viewAspect ? width : (width * containerAspect) / viewAspect
  const seenHeight = containerAspect >= viewAspect ? (height * viewAspect) / containerAspect : height
  // The shot's own permission to overhang, in the units the clamp works in.
  // Zero for every shot that does not ask, which is the clamp exactly as it
  // has always been.
  const slack = shot.slack ?? 0
  const cx = clamp(shot.cx, seenWidth / 2 - seenWidth * slack, projection.viewWidth - seenWidth / 2 + seenWidth * slack)
  const cy = clamp(shot.cy, seenHeight / 2 - seenHeight * slack, projection.viewHeight - seenHeight / 2 + seenHeight * slack)
  return { x: cx - width / 2, y: cy - height / 2, width, height }
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

/**
 * Forgiveness for float noise in the framing geometry, in viewBox units —
 * far below a pixel at any zoom, far above what the arithmetic can drift.
 */
const EPSILON = 1e-6

/**
 * The shot a player plans their next spin from: `space`, at `REST_ZOOM`,
 * leaning toward the road ahead, and framed so the car itself lands inside
 * the band the camera promises it (`FOLLOW_BAND_MIN`/`MAX`).
 *
 * There used to be a great deal more to this function, and it is worth
 * saying what went and why, because what went was a workaround for something
 * that is no longer true. The die used to be glued to the exact centre of
 * the screen, so a rest shot aimed at the car parked the car underneath the
 * die's own felt mat; the answer was to lift the frame by a fixed fraction
 * of the visible height (`REST_DIE_CLEARANCE`, 22%), plus a second rescue
 * for the case where the board's top edge pinned the frame and handed the
 * centre back to the car anyway. Both are gone with their premise: the die
 * has moved off the centre into its own tray (issue #23), and the lift they
 * were built around is exactly what seated the car at ~72% of the viewport —
 * the other half of the same playtest's complaint that the camera does not
 * hold the car (issue #25). The clamp that made the corner rescue necessary
 * is answered properly now too, by `FOLLOW_SLACK` rather than by sliding
 * sideways along the board.
 */
export function restShot(
  board: Board,
  projection: BoardProjection,
  space: Space,
  containerAspect: number = projection.viewWidth / projection.viewHeight,
): CameraShot {
  const aim = restPoint(board, projection, space)
  const car = projection.project(space.layout)

  /* The lean toward the road ahead is a nudge; where the car sits on screen
     is a promise. They only conflict on a frame narrow enough that a lean
     measured in board units is a large share of the screen — a tall phone
     window spends a fifth of its visible width on what is barely a third of
     a tile — so the lean gives back exactly as much as the band needs and
     not a unit more. Measured against the frame the *unleaned* aim would
     draw, so the cap can't chase its own tail as the aim moves. */
  const rect = shotRect(projection, { cx: car.x, cy: car.y, zoom: REST_ZOOM, slack: FOLLOW_SLACK }, containerAspect)
  const seen = seenSpan(projection, rect, containerAspect)
  const reach = FOLLOW_BAND_MAX - 0.5
  const led = {
    x: car.x + clamp(aim.x - car.x, -seen.x * reach, seen.x * reach),
    y: car.y + clamp(aim.y - car.y, -seen.y * reach, seen.y * reach),
  }
  return focusShot(projection, led, REST_ZOOM, containerAspect, FOLLOW_SLACK)
}

/**
 * The shots the camera plays through to settle at rest.
 *
 * Ordinarily that is just the rest shot itself — a small adjustment from
 * wherever the camera already was. `establishing` asks for a brief passing
 * wide shot first, so the player sees the whole route for a beat before the
 * camera commits to their corner of it — the one moment this game spends its
 * zoom budget on orientation instead of legibility.
 *
 * It used to play on every turn handoff, and that was the reported problem:
 * between two players the camera visibly fell back to the centre of the map
 * before finding the next one, which read as the camera losing its place
 * rather than as orientation. A handoff now pans straight from one player to
 * the other — see `handoffPanSeconds` for its pacing — and `establishing` is
 * kept for the one moment nobody has been framed yet: a game just loaded,
 * where the camera genuinely has no place to lose.
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

/** Extra seconds a handoff pan takes per tile of ground it crosses. */
const PAN_SECONDS_PER_TILE = 0.05
/** The most a long pan may stretch past its base — a ceiling, not a target. */
const PAN_STRETCH_MAX_SECONDS = 0.7

/**
 * Seconds a turn-handoff pan takes: `base` — the ordinary considered camera
 * move — for players parked beside each other, stretching with the distance
 * actually crossed so a pan over the whole board reads as travel rather than
 * as a whip. Capped, because past a point a slower camera stops feeling
 * deliberate and starts holding the next player's turn hostage.
 *
 * Measured between shot centres in board space, not screen pixels: the pan
 * replaces what used to be a wide-shot-then-rest sequence, and its pacing has
 * to answer for the same ground that sequence covered in two hops.
 */
export function handoffPanSeconds(
  projection: BoardProjection,
  from: CameraShot,
  to: CameraShot,
  base: number,
): number {
  const tiles = Math.hypot(to.cx - from.cx, to.cy - from.cy) / projection.pitch
  return clamp(base + tiles * PAN_SECONDS_PER_TILE, base, base + PAN_STRETCH_MAX_SECONDS)
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
