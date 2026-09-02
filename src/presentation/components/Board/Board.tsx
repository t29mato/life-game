import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactElement,
} from 'react'
import { animate, useMotionValue, type AnimationPlaybackControls } from 'framer-motion'
import type { Board as BoardModel, Difficulty, GamePhase, Player, Space, SpaceId } from '@domain/model/types'
import { editionFor } from '@domain/edition/registry'
import { estimateNetWorth } from '@domain/rules/scoring'
import { GameIconGlyph } from '../../icons/GameIcon'
import { Pawn, type PawnHandle, type PawnPoint } from '../Pawn/Pawn'
import { describeCar } from '../Pawn/passengers'
import { wealthTier } from '../Pawn/wealthTier'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'
import {
  boardLanes,
  captionSide,
  clamp,
  coastline,
  createProjection,
  fanSlot,
  forkPockets,
  ridges,
  routeStrands,
  scatterScenery,
  slabMetrics,
  spaceAccent,
  spaceCaption,
  terrainRegions,
  type BoardLane,
  type BoardProjection,
  type CaptionSide,
  type Point,
  type SpaceAccent,
} from './boardLayout'
import {
  approachZoom,
  arrivalZoom,
  cameraTransform,
  clampUserZoom,
  flythroughShots,
  focusShot,
  handoffPanSeconds,
  restSequence,
  stepUserZoom,
  userZoomedShot,
  wideShot,
  RESOLVE_ZOOM,
  USER_ZOOM_FIT,
  type CameraShot,
  type CameraTransform,
} from './camera'
import { Pocket, Scenery } from './Scenery'
import { TilePopover } from './TilePopover'
import { ZoomControls } from './ZoomControls'
import styles from './Board.module.css'

export interface BoardProps {
  readonly board: BoardModel
  readonly players: readonly Player[]
  readonly currentPlayerIndex: number
  readonly phase: GamePhase
  readonly movementPath: readonly SpaceId[]
  /**
   * Hops still owed *after* `movementPath` ends — the length of the store's
   * `pendingPath`. Only the counter reads it: a leg cut short at a swept-past
   * tile must not make the countdown say the move is nearly over when three
   * more tiles are still coming.
   */
  readonly pendingHops?: number
  /** Fired once the active pawn has hopped through the whole `movementPath`. */
  readonly onMovementComplete: () => void
  /**
   * How many spaces the mover still has to travel, reported as each hop
   * lands and `null` once the move is over. Driven from in here because this
   * is the only place that knows when a hop has actually finished.
   */
  readonly onSpacesLeftChange?: (spacesLeft: number | null) => void
  /** Sweeps the camera along the route once before the first turn. */
  readonly introFlythrough?: boolean
  /**
   * The first space of the road the opening fork's roll just settled on, or
   * null while no fork choice is live. The board lights that whole road up
   * and shades the one not taken — see the fork-light layer below — because
   * the dock naming the road in words was not enough: a player glancing at
   * the board saw two branches and no sign of which one their roll had just
   * picked. `App` withholds it until the die has visibly landed, the same
   * spoiler rule `movementPath` already obeys.
   */
  readonly chosenExitId?: SpaceId | null
  /** Which country's map pigments to paint the terrain in — see `.frame`'s `[data-edition]` overrides. */
  readonly editionId?: string
  /**
   * How unkind this game is. It reaches the board for one reason only: what a
   * loan costs to settle depends on it, and that cost is part of the live net
   * worth each car's wealth tier is banded from — the same reason
   * `rankPlayers` takes it. Omitted means priced at `normal`.
   */
  readonly difficulty?: Difficulty
}

/**
 * Car length and how far apart parked cars sit, both as fractions of a tile,
 * indexed by how many players are in the game.
 *
 * A single car is drawn longer than its space — the toy overhangs the
 * board, and that is what makes it read as a physical object sitting on the
 * tile rather than as an icon printed inside it. Cars used to shrink hard
 * with every extra player so a full stack could be squeezed onto one space;
 * now that a shared tile is allowed to spill over (see the spreads below),
 * they give up far less of their size — a wealth-tier change or a new child
 * in the back has to stay legible at the board's normal zoom even at a full
 * table, and a car two-thirds of a tile long could not promise that.
 */
const PAWN_SCALE: readonly number[] = [1.15, 1.15, 1.08, 0.98, 0.9]

/**
 * The echelon reaches further sideways than it does back, because a car is
 * much longer than it is deep — the sideways step is what keeps the bonnet,
 * the driver and the headlamp of a covered car in view, which has to survive
 * the active player's car being laid over the top of the pile.
 *
 * The step back matters just as much, though: two cars offset only sideways
 * still have their bodies overlapping through most of their width, and it is
 * the back step that lifts one roofline clear of the other so a stack of cars
 * reads as several roofs in a row rather than one wide smear.
 *
 * These used to be capped so the outermost slot plus half a car still landed
 * near the tarmac — cars sharing a tile were squeezed until the whole stack
 * stayed contained. That constraint has been deliberately dropped: cars
 * parked together may now overhang past the road edge and onto a
 * neighbouring tile, because every roofline, driver and plate staying
 * readable matters more than the pile staying inside its printed bounds.
 * The steps are still finite for a reason — the fan must read as one row of
 * parked cars, not as tokens scattered off their space.
 */
const SLOT_SPREAD_X: readonly number[] = [0, 0, 0.62, 0.7, 0.8]
const SLOT_SPREAD_Y: readonly number[] = [0, 0, 0.5, 0.58, 0.72]

/**
 * Seconds a camera move takes: a considered one between turns, a brisk one that
 * has to keep up with a hopping car, and one leg of the opening sweep.
 */
const CAMERA_SECONDS = 0.62
const FOLLOW_SECONDS = 0.34
const FLYTHROUGH_SECONDS = 0.9
const CAMERA_EASE: readonly [number, number, number, number] = [0.16, 1, 0.3, 1]

/** How far a pointer may drift from where it went down and still count as a tap on the tile under it, not a pan past it. */
const TAP_THRESHOLD_PX = 6

/**
 * Seconds a zoom takes. Much shorter than a camera move: a press of + is a
 * direct manipulation, and anything long enough to read as travel reads as
 * lag instead. Long enough only that the map is seen to move rather than to
 * cut.
 */
const ZOOM_SECONDS = 0.18

/**
 * How much zoom a pixel of wheel travel is worth, as an exponent — a
 * notch of a typical mouse wheel (100px) is about a fifth of the way in,
 * a trackpad's finer deltas accumulate smoothly to the same place.
 */
const WHEEL_ZOOM_PER_PIXEL = 0.0018

/** What a line of wheel delta is worth in pixels, for the browsers that report `deltaMode: 1`. */
const WHEEL_LINE_PIXELS = 16

/**
 * Whether the page behind the board has anything to scroll.
 *
 * A wheel over the map is ambiguous in a way a button never is: on the two
 * locked layouts (`.shell` at phone and wide-desktop widths sets a hard
 * height and `overflow: hidden`) there is no page scroll for it to mean, so
 * taking it for zoom costs nothing. In the fallback layout — whatever odd
 * window size neither of those blocks answers — the page *does* scroll, and
 * a map that swallowed the wheel there would trap a player halfway down
 * their own screen. So a plain wheel zooms only where scrolling is not on
 * offer; `ctrlKey` (a trackpad pinch, or a held ctrl) is the browser's own
 * unambiguous zoom gesture and is always taken.
 */
function pageCanScroll(): boolean {
  const doc = document.documentElement
  return doc.scrollHeight > doc.clientHeight + 1
}

/** The distance between the first two live pointers, or null while fewer than two are down. */
function pinchSpread(pointers: ReadonlyMap<number, Point>): number | null {
  const [first, second] = [...pointers.values()]
  if (!first || !second) return null
  return Math.hypot(second.x - first.x, second.y - first.y)
}

interface TileView {
  readonly space: Space
  /** Where the slab stands on the board. */
  readonly at: Point
  /** Centre of its printed face, raised off the board by its own thickness. */
  readonly face: Point
  readonly accent: SpaceAccent
  readonly caption: string | null
  readonly captionAt: CaptionSide | null
  readonly size: number
  readonly half: number
  readonly radius: number
  readonly depth: number
}

/**
 * Where a car parks: the point its space stands on, nudged into the player's
 * own slot and then raised onto the tile's face — cars sit on top of the board
 * stock, not beside it.
 */
function pointOf(
  board: BoardModel,
  projection: BoardProjection,
  spaceId: SpaceId | undefined,
  offset: Point,
): PawnPoint {
  const space = spaceId ? board.spaces[spaceId] : undefined
  const at = projection.project(space ? space.layout : { x: board.width / 2, y: board.height / 2 })
  const depth = space ? slabMetrics(projection, spaceAccent(space)).depth : projection.tileDepth
  const face = projection.lift(at, depth)
  return { x: face.x + offset.x, y: face.y + offset.y }
}

/** A band across the bottom of a tile that follows its two lower corners. */
function bottomBandPath(half: number, radius: number, height: number): string {
  const top = half - height
  return [
    `M ${-half} ${top}`,
    `H ${half}`,
    `V ${half - radius}`,
    `A ${radius} ${radius} 0 0 1 ${half - radius} ${half}`,
    `H ${-half + radius}`,
    `A ${radius} ${radius} 0 0 1 ${-half} ${half - radius}`,
    'Z',
  ].join(' ')
}

/** A four-pointed sparkle, used to mark a space as worth money. */
function sparklePath(cx: number, cy: number, r: number): string {
  const w = r * 0.22
  return [
    `M ${cx} ${cy - r}`,
    `Q ${cx + w} ${cy - w} ${cx + r} ${cy}`,
    `Q ${cx + w} ${cy + w} ${cx} ${cy + r}`,
    `Q ${cx - w} ${cy + w} ${cx - r} ${cy}`,
    `Q ${cx - w} ${cy - w} ${cx} ${cy - r}`,
    'Z',
  ].join(' ')
}

/** Four corner brackets, framing the space the active player is standing on. */
function bracketPath(half: number, arm: number): string {
  return [
    `M ${-half} ${-half + arm} V ${-half} H ${-half + arm}`,
    `M ${half - arm} ${-half} H ${half} V ${-half + arm}`,
    `M ${half} ${half - arm} V ${half} H ${half - arm}`,
    `M ${-half + arm} ${half} H ${-half} V ${half - arm}`,
  ].join(' ')
}

/**
 * The side wall of a slab: the face's rounded outline dropped by `depth` and
 * closed back onto itself, so what shows beneath a tile is the cut edge of the
 * card it is printed on rather than a rectangle behind it.
 */
function slabWallPath(half: number, radius: number, depth: number): string {
  return [
    `M ${-half} ${-half + radius}`,
    `V ${half - radius + depth}`,
    `A ${radius} ${radius} 0 0 0 ${-half + radius} ${half + depth}`,
    `H ${half - radius}`,
    `A ${radius} ${radius} 0 0 0 ${half} ${half - radius + depth}`,
    `V ${-half + radius}`,
    'Z',
  ].join(' ')
}

/** Renders the whole board: the country it crosses, the road, and every car. */
export function Board({
  board,
  players,
  currentPlayerIndex,
  phase,
  movementPath,
  pendingHops = 0,
  onMovementComplete,
  onSpacesLeftChange,
  introFlythrough = false,
  chosenExitId = null,
  editionId,
  difficulty,
}: BoardProps): ReactElement {
  const rawId = useId()
  const uid = useMemo(() => rawId.replace(/:/g, ''), [rawId])
  const reduceMotion = usePrefersReducedMotion()
  const projection = useMemo(() => createProjection(board), [board])
  const spaces = useMemo(() => Object.values(board.spaces), [board])
  /* Resolved here for the cars' wealth tiers: the banding is priced against
     this edition's own economy, never a hardcoded dollar figure. */
  const edition = useMemo(() => editionFor(editionId), [editionId])

  const captionSize = projection.tileSize * 0.34

  /* The whole landscape is a pure function of the board and the projection, so
     it is built once and never rebuilt as players move around on top of it. */
  const lanes = useMemo(() => boardLanes(board), [board])
  const regions = useMemo(() => terrainRegions(board, projection, lanes), [board, projection, lanes])
  const coast = useMemo(() => coastline(board, projection), [board, projection])
  const pockets = useMemo(() => forkPockets(board, projection), [board, projection])
  const hills = useMemo(() => ridges(board, projection), [board, projection])
  /* Painted back to front, like the cars: a skyline piece standing high on
     the map draws behind the streets below it, and a building never paints
     over the foot of one standing in front of it. `scatterScenery` returns
     placement order (the guaranteed skyline first), which is not depth. */
  const scenery = useMemo(
    () => [...scatterScenery(board, projection, editionId)].sort((a, b) => a.y - b.y),
    [board, projection, editionId],
  )
  const strands = useMemo(() => routeStrands(board, projection, lanes), [board, projection, lanes])

  const tiles = useMemo<readonly TileView[]>(() => {
    const points = spaces.map((space) => projection.project(space.layout))
    return spaces.map((space, index) => {
      const at = points[index] ?? { x: 0, y: 0 }
      const accent = spaceAccent(space)
      const caption = spaceCaption(space)
      const { size, half, radius, depth } = slabMetrics(projection, accent)
      const prefer: CaptionSide = accent === 'milestone' ? 'below' : 'above'
      return {
        space,
        at,
        face: projection.lift(at, depth),
        accent,
        caption,
        captionAt: caption
          ? captionSide(
              at,
              points.filter((_, other) => other !== index),
              projection.pitch,
              projection.rowPitch,
              prefer,
              // Must match the plate drawn below, or a caption is judged to fit
              // somewhere it visibly does not.
              (caption.length * captionSize * 0.62 + captionSize) / 2,
            )
          : null,
        size,
        half,
        radius,
        depth,
      }
    })
  }, [spaces, projection, captionSize])

  const activePlayer = players[currentPlayerIndex] as Player | undefined
  const activeSpaceId = activePlayer?.spaceId
  const pawnRefs = useRef<Map<string, PawnHandle>>(new Map())
  const movingRef = useRef(false)
  const surfaceRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  /**
   * The live shape of the card the board is actually drawn into — read
   * imperatively, not `useState`, since it only ever feeds the camera math
   * inside an effect or a callback, never JSX, and a resize should not by
   * itself force a re-render of several thousand tiles. `useLayoutEffect`
   * measures once before the very first paint, same tick as the DOM
   * mounts, so the opening shot below is never computed against a stale
   * guess; `ResizeObserver` keeps it current after that.
   */
  const containerAspectRef = useRef(projection.viewWidth / projection.viewHeight)
  useLayoutEffect(() => {
    const el = surfaceRef.current
    if (!el) return
    const apply = (width: number, height: number): void => {
      if (width > 0 && height > 0) containerAspectRef.current = width / height
    }
    const rect = el.getBoundingClientRect()
    apply(rect.width, rect.height)
    // jsdom (tests) has no `ResizeObserver` at all — the initial measurement
    // above is all a test environment either has or needs.
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) apply(entry.contentRect.width, entry.contentRect.height)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  /**
   * The space each pawn is drawn resting on — distinct from `player.spaceId`
   * for as long as that player's own move is outstanding.
   *
   * `spin` commits a move atomically in the store: the instant `phase` turns
   * `moving`, `player.spaceId` already holds the *destination*. `movementPath`
   * is what actually gets animated, and `App` withholds it from this
   * component until the wheel has visibly stopped spinning, roughly 1.5s
   * later. Reading `player.spaceId` straight into a pawn's `restPosition`
   * during that gap teleported the car to its destination immediately — the
   * settle effect in `Pawn`, built to re-centre a parked car when a rival's
   * arrival changes its bay, has no way to tell that apart from a legitimate
   * settle — and left `hopThrough` to run a no-op hop from a token already
   * there.
   *
   * The fix: freeze the *mover's own* visual space for the whole of `moving`
   * — covering both the withheld gap and the hop itself — at wherever it was
   * the moment the phase changed, and only let it catch up to the real
   * `player.spaceId` once the phase moves on, by which point `hopThrough` has
   * already driven the token there itself, so no jump is visible. Every other
   * player's spot tracks `player.spaceId` on every render exactly as before,
   * so a rival's fan slot still reacts the instant its own occupancy actually
   * changes.
   *
   * `passingEvent` is frozen for the same reason and it matters more there.
   * A move is walked one leg at a time now, so a car showing a swept-past
   * tile's card is parked *on that tile*, several hops short of where
   * `player.spaceId` already says it ends up — thawing here would teleport it
   * to the destination the instant the card appeared and hop it backwards
   * when the card was dismissed.
   */
  const visualSpaceIds = useRef<Map<string, SpaceId | undefined>>(new Map())
  const visualSpaceId = useCallback(
    (player: Player, index: number): SpaceId | undefined => {
      const midMove = phase === 'moving' || phase === 'passingEvent'
      const frozen = index === currentPlayerIndex && midMove && visualSpaceIds.current.has(player.id)
      if (!frozen) visualSpaceIds.current.set(player.id, player.spaceId)
      return visualSpaceIds.current.get(player.id)
    },
    [currentPlayerIndex, phase],
  )

  /**
   * The road the fork roll picked stays lit past the prop that announced it:
   * the store clears `chosenExit` the instant the distance roll is pressed,
   * but the whole point of the light is to still be on the road while the
   * car actually drives down it. So the last exit named is held here for as
   * long as the move it started is still playing out — the distance roll,
   * the hops, any swept-past card — and let go the moment the turn resolves.
   * Same trick, same reasoning as `visualSpaceIds` above.
   */
  const litExitRef = useRef<SpaceId | null>(null)
  const midFork = phase === 'awaitingDistanceSpin' || phase === 'moving' || phase === 'passingEvent'
  if (chosenExitId) litExitRef.current = chosenExitId
  else if (!midFork) litExitRef.current = null
  const litExitId = litExitRef.current

  /**
   * Everything the fork light paints: the chosen road's own ribbons, the
   * rejected road's, and the rejected road's tiles. Resolved from the graph
   * rather than from anything the dock said — the lit exit heads its own
   * lane (a fork always breaks the chain there, see `boardLanes`), and the
   * road not taken is whichever lane the fork's other exit heads.
   */
  const forkLight = useMemo(() => {
    if (!litExitId) return null
    const fork = spaces.find((space) => space.next.length > 1 && space.next.includes(litExitId))
    if (!fork) return null
    const laneOf = (head: SpaceId): BoardLane | undefined =>
      lanes.find((lane) => lane.spaceIds[0] === head)
    const taken = laneOf(litExitId)
    if (!taken) return null
    const passed = fork.next
      .filter((id) => id !== litExitId)
      .map(laneOf)
      .filter((lane): lane is BoardLane => lane !== undefined)
    const passedLaneIds = new Set(passed.map((lane) => lane.id))
    return {
      takenStrands: strands.filter((strand) => strand.laneId === taken.id),
      passedStrands: strands.filter((strand) => passedLaneIds.has(strand.laneId)),
      passedSpaceIds: new Set(passed.flatMap((lane) => lane.spaceIds)),
    }
  }, [litExitId, spaces, lanes, strands])

  const seats = Math.min(players.length, 4)
  const pawnSize = projection.tileSize * (PAWN_SCALE[seats] ?? 0.54)
  const spreadX = projection.tileSize * (SLOT_SPREAD_X[seats] ?? 0.46)
  const spreadY = projection.tileSize * (SLOT_SPREAD_Y[seats] ?? 0.32)

  /**
   * A player's parking offset at `targetSpaceId`, fanned against only the
   * rivals actually sharing that space right now — see `fanSlot`. Overall car
   * size and the reach of a step are still set from the size of the whole
   * table (`seats` above), so the fan never needs to grow past what a tile
   * was built to hold even in the worst case of every player landing on one
   * space; only which of those pre-sized bays each present car is offered
   * changes with who is actually parked alongside it.
   */
  const fanOffset = useCallback(
    (targetSpaceId: SpaceId | undefined, playerIndex: number): Point => {
      const slot = fanSlot(
        players.map((player) => player.spaceId),
        playerIndex,
        targetSpaceId,
      )
      return { x: slot.x * spreadX, y: slot.y * spreadY }
    },
    [players, spreadX, spreadY],
  )

  /**
   * Every player's own car, at the exact point it is actually drawn — lifted
   * onto its tile's face and fanned clear of whoever else is parked there,
   * same as `pointOf` computes for the pawn itself — not just the tile
   * centre `routeBounds` measures. Folded into the wide shot below so a cover
   * crop can never take a parked car's own tile out of frame while still
   * leaving the car itself, fanned toward the edge, outside it.
   */
  const playerPoints = useMemo<readonly Point[]>(
    () => players.map((player, index) => pointOf(board, projection, player.spaceId, fanOffset(player.spaceId, index))),
    [players, board, projection, fanOffset],
  )

  /* ── the camera ────────────────────────────────────────────────────────
     Driven as a transform on a group inside a viewBox that never changes,
     rather than by rewriting the viewBox itself: React owns that attribute and
     would reset it on every re-render, which is a fight the camera loses. */
  const opening = wideShot(projection, board, playerPoints, containerAspectRef.current)
  const initial = cameraTransform(projection, opening, containerAspectRef.current)
  const camX = useMotionValue(initial.x)
  const camY = useMotionValue(initial.y)
  const camScale = useMotionValue(initial.scale)
  const cameraControls = useRef<AnimationPlaybackControls[]>([])
  const cameraRef = useRef<SVGGElement>(null)
  /**
   * The last shot the camera was told to land on — where a turn-handoff pan
   * measures its travel from. A free-look drag can leave the true frame
   * somewhere else, but all that mispricing costs is a slightly off duration
   * on the next pan, so the drag deliberately isn't tracked here.
   */
  const lastShotRef = useRef<CameraShot>(opening)
  /** True until the opening sweep is done: nothing else may touch the camera. */
  const flyingRef = useRef(introFlythrough)

  /**
   * How far the player has zoomed the map in themselves, on top of whatever
   * shot the camera chose — see `userZoomedShot`. `USER_ZOOM_FIT` is every
   * framing this component has ever produced, unchanged, which is where it
   * starts and where the reset key puts it back.
   *
   * A `MotionValue`, and deliberately not React state and not the game
   * store. Not the store, because none of this is the game: it is how one
   * person is looking at it right now, no different from having scrolled a
   * page — it must not travel in an autosave, must not reach the other
   * players in a handoff, and the store's own state is the record of what
   * has happened, which a zoom never is. Not React state either, because a
   * pinch or a trackpad zoom changes this on every pointer frame, and the
   * board is several thousand SVG nodes that must not re-render for a
   * camera change — the same reason the shot itself is written straight
   * onto a group's transform attribute a few lines below. `ZoomControls`
   * subscribes to it and repaints alone.
   */
  const userZoom = useMotionValue(USER_ZOOM_FIT)

  /* The shot is written straight onto the group's `transform` attribute rather
     than handed to a `motion.g`. React never sets that attribute, so it can
     never reset the camera mid-move, and the identity transform is exactly the
     wide shot — so the first painted frame is already correctly framed. */
  useEffect(() => {
    const write = (): void => {
      cameraRef.current?.setAttribute(
        'transform',
        `translate(${camX.get()} ${camY.get()}) scale(${camScale.get()})`,
      )
    }
    write()
    const stops = [camX.on('change', write), camY.on('change', write), camScale.on('change', write)]
    return () => stops.forEach((stop) => stop())
  }, [camX, camY, camScale])

  /**
   * Move the camera to an already-computed transform.
   *
   * Split out from `applyShot` because a zoom does not have a shot: it acts
   * on wherever the frame actually is — including wherever a free-look drag
   * has since dragged it — rather than on where the camera last decided it
   * ought to be. Both paths must stop the same running animations and record
   * the same handles, which is exactly what this owns.
   */
  const driveCamera = useCallback(
    (target: CameraTransform, seconds: number): Promise<void> => {
      cameraControls.current.forEach((controls) => controls.stop())
      cameraControls.current = []

      const legs: readonly (readonly [typeof camX, number])[] = [
        [camX, target.x],
        [camY, target.y],
        [camScale, target.scale],
      ]

      if (seconds <= 0) {
        for (const [value, to] of legs) value.set(to)
        return Promise.resolve()
      }

      const running = legs.map(([value, to]) =>
        animate(value, to, { duration: seconds, ease: CAMERA_EASE }),
      )
      cameraControls.current = [...running]
      return Promise.all(running.map((controls) => controls.finished)).then(() => undefined)
    },
    [camX, camY, camScale],
  )

  const applyShot = useCallback(
    (shot: CameraShot, seconds: number): Promise<void> => {
      /* The shot is recorded as the camera chose it, *without* the player's
         zoom folded in: it is the mark the camera is holding, and a reset has
         to be able to go back to it exactly. The magnification is applied on
         the way to the DOM and nowhere else. */
      lastShotRef.current = shot
      const target = cameraTransform(
        projection,
        userZoomedShot(shot, userZoom.get()),
        containerAspectRef.current,
      )

      /* On a narrow screen the drawing is wider than its column and pans. The
         transform always lands the shot's centre on the middle of the drawing,
         so keeping the drawing centred is all the panning that is ever needed. */
      const surface = surfaceRef.current
      if (surface) {
        const overflow = surface.scrollWidth - surface.clientWidth
        if (overflow > 1) {
          surface.scrollTo({
            left: clamp((surface.scrollWidth - surface.clientWidth) / 2, 0, overflow),
            behavior: seconds > 0 ? 'smooth' : 'auto',
          })
        }
      }

      return driveCamera(target, seconds)
    },
    [projection, userZoom, driveCamera],
  )

  useEffect(() => {
    return () => {
      cameraControls.current.forEach((controls) => controls.stop())
      cameraControls.current = []
    }
  }, [])

  /* ── zoom ──────────────────────────────────────────────────────────────
     The one part of the camera the player holds. Everything below routes
     through `zoomTo`: the rail's keys, a wheel, a trackpad pinch and two
     fingers on a phone all mean the same thing and must land in the same
     place. */

  /**
   * Zoom the map to `requested`, holding whatever is at the middle of the
   * frame where it is.
   *
   * Anchored on the frame's centre rather than on the pointer, at every
   * entry point, on purpose: the centre of this particular screen is where
   * the die sits and where the camera parks the active car, so it is the one
   * spot a player is reliably already looking at — and one anchor for keys,
   * wheel and pinch alike means the map behaves the same way however it is
   * asked.
   *
   * Worked on the live transform, not by re-deriving a shot: by the time a
   * player reaches for the zoom they may well have dragged the board
   * somewhere of their own (free look, below), and re-framing on the last
   * shot would snap that away as the price of a closer look. The reset key
   * is where going back to the camera's own mark belongs.
   *
   * Mid-move is the one moment this stays out of: the movement effect is
   * driving a shot per hop and the drag handler already refuses for the same
   * reason. The new zoom is still recorded, so the very next hop's shot —
   * a fraction of a second away — arrives at it.
   */
  const zoomTo = useCallback(
    (requested: number): void => {
      const previous = userZoom.get()
      const next = clampUserZoom(requested)
      if (next === previous) return
      userZoom.set(next)
      if (phase === 'moving') return

      /* The player has taken the camera; the opening sweep, if it is still
         running, has lost its claim on it — same bargain as a drag. */
      flyingRef.current = false

      const ratio = next / previous
      const scale = camScale.get() * ratio
      const held = (translate: number, span: number): number =>
        clamp(span / 2 - (span / 2 - translate) * ratio, span * (1 - scale), 0)

      void driveCamera(
        {
          x: held(camX.get(), projection.viewWidth),
          y: held(camY.get(), projection.viewHeight),
          scale,
        },
        reduceMotion ? 0 : ZOOM_SECONDS,
      )
    },
    [userZoom, phase, driveCamera, camX, camY, camScale, projection, reduceMotion],
  )

  const zoomIn = useCallback(() => zoomTo(stepUserZoom(userZoom.get(), 1)), [zoomTo, userZoom])
  const zoomOut = useCallback(() => zoomTo(stepUserZoom(userZoom.get(), -1)), [zoomTo, userZoom])

  /**
   * Back to the camera's own framing — the zoom let go of *and* the free-look
   * pan with it, which is why this cannot just be `zoomTo(USER_ZOOM_FIT)`:
   * a map dragged off its mark at fit has a zoom that is already 1 and still
   * needs putting back.
   */
  const resetZoom = useCallback((): void => {
    userZoom.set(USER_ZOOM_FIT)
    if (phase === 'moving') return
    flyingRef.current = false
    void applyShot(lastShotRef.current, reduceMotion ? 0 : ZOOM_SECONDS)
  }, [userZoom, phase, applyShot, reduceMotion])

  /**
   * Wheel and trackpad. Bound natively rather than through `onWheel` because
   * React attaches wheel listeners passively, where `preventDefault` is
   * ignored — and a zoom that does not consume the gesture leaves the
   * browser free to zoom the whole page underneath it at the same time.
   * `pageCanScroll` is what keeps this off an ordinary scroll.
   */
  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    const onWheel = (event: WheelEvent): void => {
      if (!event.ctrlKey && pageCanScroll()) return
      event.preventDefault()
      const pixels = event.deltaMode === 0 ? event.deltaY : event.deltaY * WHEEL_LINE_PIXELS
      zoomTo(userZoom.get() * Math.exp(-pixels * WHEEL_ZOOM_PER_PIXEL))
    }
    svg.addEventListener('wheel', onWheel, { passive: false })
    return () => svg.removeEventListener('wheel', onWheel)
  }, [zoomTo, userZoom])

  /**
   * Free look: drag the board (swipe on touch) to pan it, and tap a tile
   * for its own card — see `TilePopover`. No inertia and no snap-back, on
   * purpose: a look around is over the moment the player lets go.
   *
   * Suspended while a car is actually hopping between tiles (`phase ===
   * 'moving'`): the movement effect below is mid-animation on this exact
   * camera then, `await`ing each leg's own `applyShot` to finish, and
   * stopping that animation out from under it would leave that `await`
   * waiting on a promise that had already been abandoned — freezing the
   * play loop the same way an interrupted spin once did. Waiting for a
   * spin, weighing a decision, or resting on what a turn resolved to are
   * all fair game: the camera has nothing of its own to say in those
   * moments, so there is nothing a drag can go on to fight.
   *
   * A tap is not a pan cut short — it is judged by how far the pointer
   * actually travelled, not by whether one happened to land on a tile, so a
   * drag that happens to end over a tile never also opens that tile's card.
   */
  const dragRef = useRef<{
    readonly pointerId: number
    readonly startX: number
    readonly startY: number
    readonly camX0: number
    readonly camY0: number
    readonly panning: boolean
    moved: number
  } | null>(null)
  /**
   * Every finger currently on the board, and the pinch a second one starts.
   *
   * Two fingers on a map mean zoom in every other app a player has ever
   * used, and the board already claims the gesture from the browser
   * (`touch-action: none` on `.svg`, for the pan) — so not answering it
   * would mean the pinch simply did nothing, which reads as broken rather
   * than as unsupported. The first finger's drag is abandoned the moment
   * the second lands: a pinch that also panned would slide the map out from
   * under the fingers doing the pinching.
   */
  const pointersRef = useRef<Map<number, Point>>(new Map())
  const pinchRef = useRef<{ readonly spread: number; readonly zoom: number } | null>(null)
  const [selectedTile, setSelectedTile] = useState<{ readonly space: Space; readonly anchor: Point } | null>(
    null,
  )

  const handleBoardPointerDown = useCallback(
    (event: ReactPointerEvent<SVGSVGElement>) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return
      pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
      event.currentTarget.setPointerCapture?.(event.pointerId)

      const spread = pinchSpread(pointersRef.current)
      if (spread !== null) {
        dragRef.current = null
        pinchRef.current = { spread, zoom: userZoom.get() }
        return
      }

      const panning = phase !== 'moving'
      dragRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        camX0: camX.get(),
        camY0: camY.get(),
        panning,
        moved: 0,
      }
      if (panning) {
        cameraControls.current.forEach((controls) => controls.stop())
        cameraControls.current = []
        flyingRef.current = false
      }
    },
    [phase, camX, camY, userZoom],
  )

  const handleBoardPointerMove = useCallback(
    (event: ReactPointerEvent<SVGSVGElement>) => {
      if (pointersRef.current.has(event.pointerId)) {
        pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
      }
      const pinch = pinchRef.current
      if (pinch) {
        const spread = pinchSpread(pointersRef.current)
        if (spread !== null && pinch.spread > 0) zoomTo((pinch.zoom * spread) / pinch.spread)
        return
      }

      const drag = dragRef.current
      if (!drag || event.pointerId !== drag.pointerId) return
      const dxScreen = event.clientX - drag.startX
      const dyScreen = event.clientY - drag.startY
      drag.moved = Math.max(drag.moved, Math.hypot(dxScreen, dyScreen))
      if (!drag.panning) return

      const svg = svgRef.current
      const rect = svg?.getBoundingClientRect()
      if (!rect || rect.width === 0 || rect.height === 0) return

      // The svg's own viewBox-to-CSS scale ("slice" — see Board.tsx's JSX):
      // one viewBox unit of camera translate is this many rendered pixels,
      // so a drag in screen pixels converts back by dividing it out.
      const renderScale = Math.max(rect.width / projection.viewWidth, rect.height / projection.viewHeight)
      const scale = camScale.get()
      const minX = projection.viewWidth * (1 - scale)
      const minY = projection.viewHeight * (1 - scale)
      camX.set(clamp(drag.camX0 + dxScreen / renderScale, minX, 0))
      camY.set(clamp(drag.camY0 + dyScreen / renderScale, minY, 0))
    },
    [projection, camX, camY, camScale, zoomTo],
  )

  const handleBoardPointerUp = useCallback(
    (event: ReactPointerEvent<SVGSVGElement>) => {
      pointersRef.current.delete(event.pointerId)
      // The pinch is over as soon as one of its two fingers is: the finger
      // still down is not a pan resumed halfway, and must not be treated as
      // a tap on whatever tile it happens to be resting on either.
      if (pointersRef.current.size < 2) pinchRef.current = null

      const drag = dragRef.current
      if (!drag || event.pointerId !== drag.pointerId) return
      dragRef.current = null
      if (drag.moved > TAP_THRESHOLD_PX) return

      const hit = document.elementFromPoint(event.clientX, event.clientY)
      const spaceId = hit?.closest('[data-space]')?.getAttribute('data-space')
      const space = spaceId ? board.spaces[spaceId] : undefined
      if (space) setSelectedTile({ space, anchor: { x: event.clientX, y: event.clientY } })
    },
    [board],
  )

  /**
   * The opening sweep. Before the first spin the camera runs the length of the
   * route, so the players see the life ahead of them — school, the wedding, the
   * houses, the coast at the end — rather than meeting it a tile at a time.
   *
   * Under reduced motion it collapses to the wide shot immediately: the same
   * information, none of the travel. It is never allowed to gate play — the
   * movement loop below runs regardless of whether the sweep has finished.
   */
  useEffect(() => {
    if (!introFlythrough) return
    if (reduceMotion) {
      flyingRef.current = false
      void applyShot(wideShot(projection, board, playerPoints, containerAspectRef.current), 0)
      return
    }

    let cancelled = false
    const run = async (): Promise<void> => {
      for (const shot of flythroughShots(board, projection, 6, playerPoints, containerAspectRef.current)) {
        if (cancelled) return
        await applyShot(shot, FLYTHROUGH_SECONDS)
      }
      flyingRef.current = false
    }
    void run()

    return () => {
      cancelled = true
      flyingRef.current = false
    }
    // Runs once for the life of a board: the sweep is an opening, not a state.
  }, [introFlythrough, board])

  /**
   * Where the camera rests between moves.
   *
   * A turn that has just resolved holds close on the space it resolved on, so
   * the player sees what happened. Waiting for a spin is where the board used
   * to pull all the way back to the whole map — legible for nobody, per the
   * reported complaint — so it now settles on `restShot`, zoomed on the active
   * player's own corner of the board instead. Handing the table to a
   * *different* player used to route through a wide establishing shot on the
   * way, and that drew its own complaint: between every pair of turns the
   * camera visibly fell back to the centre of the map before finding the next
   * player, which read as the camera losing its place rather than as
   * orientation. A handoff now pans straight from wherever the last turn
   * left the frame to the new player's rest shot, paced by how far it
   * actually travels (`handoffPanSeconds`) — neighbours get the ordinary
   * considered move, a cross-board handoff a slower, readable sweep. The
   * establishing wide shot survives in exactly one place: the first settle of
   * a board nobody has been framed on yet (a game just loaded), where there
   * is no previous frame to pan from and the whole map genuinely is the
   * orientation a player needs. Reduced motion always collapses straight to
   * the final rest shot: the wide beat and the pan are motion, not
   * information, and the rest shot alone already answers "where am I and
   * what's next".
   *
   * `passingEvent` is left alone along with `moving`: the car is parked
   * mid-move on the tile whose card is up, and every shot below is framed on
   * `activeSpaceId` — which by then is the *destination*, several hops
   * further on. The movement effect has already framed the tile the card is
   * actually about, so the right thing to do here is nothing.
   */
  const previousRestPlayerId = useRef<string | null>(null)
  useEffect(() => {
    if (flyingRef.current || phase === 'moving' || phase === 'passingEvent') return
    const space = activeSpaceId ? board.spaces[activeSpaceId] : undefined

    if (phase === 'awaitingDecision' || phase === 'resolved') {
      previousRestPlayerId.current = activePlayer?.id ?? null
      const framed = space
        ? focusShot(projection, projection.project(space.layout), RESOLVE_ZOOM, containerAspectRef.current)
        : wideShot(projection, board, playerPoints, containerAspectRef.current)
      void applyShot(framed, reduceMotion ? 0 : CAMERA_SECONDS)
      return
    }

    const changedPlayer = previousRestPlayerId.current !== (activePlayer?.id ?? null)
    const firstSettle = previousRestPlayerId.current === null
    previousRestPlayerId.current = activePlayer?.id ?? null
    const sequence = restSequence(
      board,
      projection,
      space,
      changedPlayer && firstSettle && !reduceMotion,
      playerPoints,
      containerAspectRef.current,
    )
    /* Priced before the loop moves the camera: a handoff pan's whole travel
       is from wherever the previous turn parked the frame, and `applyShot`
       overwrites that record with its own first leg. */
    const seconds =
      changedPlayer && !firstSettle
        ? handoffPanSeconds(
            projection,
            lastShotRef.current,
            sequence[sequence.length - 1] as CameraShot,
            CAMERA_SECONDS,
          )
        : CAMERA_SECONDS

    let cancelled = false
    void (async () => {
      for (const shot of sequence) {
        if (cancelled) return
        await applyShot(shot, reduceMotion ? 0 : seconds)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [phase, activeSpaceId, activePlayer?.id, board, projection, applyShot, reduceMotion])

  /* Read through refs inside the movement effect, which is deliberately keyed
     on the leg alone: a fresh callback identity from the parent must never
     restart a hop that is already running. */
  const onSpacesLeftChangeRef = useRef(onSpacesLeftChange)
  onSpacesLeftChangeRef.current = onSpacesLeftChange
  const pendingHopsRef = useRef(pendingHops)
  pendingHopsRef.current = pendingHops

  useEffect(() => {
    if (phase !== 'moving' || movementPath.length === 0 || movingRef.current) return
    const mover = activePlayer
    if (!mover) return
    const ref = pawnRefs.current.get(mover.id)
    movingRef.current = true

    const run = async (): Promise<void> => {
      const total = movementPath.length
      const closest = arrivalZoom(board, movementPath[total - 1])
      /* The counter counts *spaces*, not legs: what is owed after this leg
         ends counts too, so pausing on a swept-past tile ticks the number
         down through the pause rather than resetting it. Reported before the
         first hop so it reads the full distance the moment the die lands. */
      let spacesLeft = total + pendingHopsRef.current
      onSpacesLeftChangeRef.current?.(spacesLeft)
      for (let step = 0; step < total; step += 1) {
        /* Recomputed per step, not once for the whole hop: which players are
           already parked differs from stop to stop along the path, and the
           mover is fanned against whoever is actually waiting at each one —
           including a rival passed through on the way, not just the final
           space it lands on. */
        const target = pointOf(
          board,
          projection,
          movementPath[step],
          fanOffset(movementPath[step], currentPlayerIndex),
        )
        /* Deliberately not awaited: the camera leads the car rather than
           following it, and nothing about a move may wait on a camera move. */
        void applyShot(
          focusShot(projection, target, approachZoom(step, total, closest), containerAspectRef.current),
          reduceMotion ? 0 : FOLLOW_SECONDS,
        )
        /* The crouch belongs to the last tile of the *move*, not of this
           leg: a leg that ends on a swept-past tile still has road owed
           behind it, and a car that gathers itself for a hop it is going to
           make three more of reads as a stumble rather than as an arrival. */
        await ref?.hopThrough([target], {
          final: step === total - 1 && pendingHopsRef.current === 0,
        })
        spacesLeft -= 1
        onSpacesLeftChangeRef.current?.(spacesLeft)
      }
      movingRef.current = false
      onMovementComplete()
    }
    void run()
    // Deliberately keyed on phase/movementPath alone: this must run exactly
    // once per leg, regardless of prop identity churn elsewhere.
  }, [phase, movementPath])

  /* The counter belongs to a move, so it is cleared when the next turn opens
     rather than the instant the last hop lands — a player who reads "0" as
     the car settles is reading the thing it was put there to say. */
  useEffect(() => {
    if (phase === 'awaitingSpin' || phase === 'setup') onSpacesLeftChangeRef.current?.(null)
  }, [phase])

  /**
   * Back to front. Cars nearer the bottom of the board are nearer the eye and
   * are drawn over the ones behind them; whoever is moving is drawn over
   * everybody, so a car crossing an occupied space visibly passes the cars on
   * it instead of disappearing through them.
   */
  const parked = useMemo(() => {
    const depthOf = (player: Player, index: number): number => {
      if (index === currentPlayerIndex) return Number.POSITIVE_INFINITY
      const space = board.spaces[player.spaceId]
      const at = space ? projection.project(space.layout) : { x: 0, y: 0 }
      return at.y + fanOffset(player.spaceId, index).y
    }
    return players
      .map((player, index) => ({ player, index, depth: depthOf(player, index) }))
      .sort((a, b) => a.depth - b.depth)
  }, [players, board, projection, fanOffset, currentPlayerIndex])

  const sheenId = `${uid}-sheen`
  const glowId = `${uid}-glow`
  const hazardId = `${uid}-hazard`
  const groundId = `${uid}-ground`
  const seaId = `${uid}-sea`
  const contactId = `${uid}-contact`

  return (
    <div className={styles.frame} data-edition={editionId}>
      <div className={styles.surface} ref={surfaceRef}>
        <svg
          ref={svgRef}
          className={styles.svg}
          viewBox={`0 0 ${projection.viewWidth} ${projection.viewHeight}`}
          role="img"
          aria-label="Game board"
          /* The board's cell fills whatever room it is given rather than
             capping itself to its own aspect ratio — see `.boardArea` in
             App.module.css — so `slice` crops the drawing to cover that
             cell instead of `meet` letterboxing it down to fit inside. The
             camera (`wideShot`) already does the same trade at the route
             level: bigger and cropped beats smaller and fully in frame. */
          preserveAspectRatio="xMidYMid slice"
          onPointerDown={handleBoardPointerDown}
          onPointerMove={handleBoardPointerMove}
          onPointerUp={handleBoardPointerUp}
          onPointerCancel={handleBoardPointerUp}
        >
          <defs>
            <linearGradient id={sheenId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.62" />
              <stop offset="38%" stopColor="#ffffff" stopOpacity="0.1" />
              <stop offset="62%" stopColor="#0b0722" stopOpacity="0.02" />
              <stop offset="100%" stopColor="#0b0722" stopOpacity="0.17" />
            </linearGradient>
            <radialGradient id={glowId}>
              <stop offset="0%" stopColor="var(--candy-sun)" stopOpacity="0.55" />
              <stop offset="55%" stopColor="var(--candy-sun)" stopOpacity="0.18" />
              <stop offset="100%" stopColor="var(--candy-sun)" stopOpacity="0" />
            </radialGradient>
            <radialGradient id={contactId}>
              <stop offset="0%" stopColor="#120d2b" stopOpacity="0.5" />
              <stop offset="62%" stopColor="#120d2b" stopOpacity="0.26" />
              <stop offset="100%" stopColor="#120d2b" stopOpacity="0" />
            </radialGradient>
            <linearGradient id={groundId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--land-far)" />
              <stop offset="34%" stopColor="var(--land)" />
              <stop offset="100%" stopColor="var(--land-near)" />
            </linearGradient>
            <linearGradient id={seaId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--sea)" />
              <stop offset="100%" stopColor="var(--sea-deep)" />
            </linearGradient>
            <pattern
              id={hazardId}
              width="16"
              height="16"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(45)"
            >
              <rect width="16" height="16" className={styles.hazardLight} />
              <rect width="8" height="16" className={styles.hazardDark} />
            </pattern>
          </defs>

          <g className={styles.camera} data-testid="board-camera" ref={cameraRef}>
            <g className={styles.landscape} aria-hidden="true">
              <rect
                x="0"
                y="0"
                width={projection.viewWidth}
                height={projection.viewHeight}
                fill={`url(#${groundId})`}
              />

              {hills.map((ridge, index) => (
                <g key={ridge.id} className={styles.ridge} data-depth={index}>
                  <path d={ridge.path} className={styles.ridgeFace} />
                  <path d={ridge.litPath} className={styles.ridgeLit} />
                </g>
              ))}

              {regions.map((region) => (
                <path
                  key={region.id}
                  d={region.path}
                  className={styles.district}
                  data-district={region.district}
                />
              ))}

              {pockets.map((pocket) => (
                <Pocket key={pocket.id} pocket={pocket} />
              ))}

              <path d={coast.beachPath} className={styles.beach} />
              <path d={coast.shallowPath} className={styles.shallow} />
              <path d={coast.waterPath} fill={`url(#${seaId})`} />
              <path d={coast.foamPath} className={styles.foam} />

              {scenery.map((piece) => (
                <Scenery key={piece.id} piece={piece} tileSize={projection.tileSize} />
              ))}
            </g>

            <g className={styles.roadCasing} aria-hidden="true">
              {strands.map((strand) => (
                <path key={strand.id} d={strand.path} strokeWidth={projection.roadCasingWidth} />
              ))}
            </g>

            <g className={styles.roadEdge} aria-hidden="true">
              {strands.map((strand) => (
                <path key={strand.id} d={strand.path} strokeWidth={projection.roadEdgeWidth} />
              ))}
            </g>

            <g className={styles.roadTop} aria-hidden="true">
              {strands.map((strand) => (
                <path key={strand.id} d={strand.path} strokeWidth={projection.roadWidth} />
              ))}
            </g>

            {/* The fork roll's answer, painted on the road itself: the chosen
                ribbon glows amber with fresh paint flowing the way the car is
                about to go, and the road not taken falls into shade — its
                tiles with it, further down. Drawn over the tarmac but under
                the slabs, so the light reads as the road catching the sun
                rather than as chrome laid on top of the tiles. */}
            {forkLight && (
              <g className={styles.forkLight} aria-hidden="true">
                {forkLight.passedStrands.map((strand) => (
                  <path
                    key={strand.id}
                    data-testid="road-not-taken"
                    className={styles.roadNotTaken}
                    d={strand.path}
                    strokeWidth={projection.roadCasingWidth}
                  />
                ))}
                {forkLight.takenStrands.map((strand) => (
                  <g key={strand.id} data-testid="road-taken">
                    <path
                      className={styles.roadTakenGlow}
                      d={strand.path}
                      strokeWidth={projection.roadWidth * 1.08}
                    />
                    <path
                      className={styles.roadTakenTrace}
                      d={strand.path}
                      strokeWidth={projection.roadWidth * 0.16}
                    />
                  </g>
                ))}
              </g>
            )}

            <g className={styles.glowLayer} aria-hidden="true">
              {tiles
                .filter((tile) => tile.accent === 'milestone' || tile.accent === 'payday')
                .map((tile) => (
                  <circle
                    key={tile.space.id}
                    cx={tile.face.x}
                    cy={tile.face.y}
                    r={tile.half * (tile.accent === 'milestone' ? 2.3 : 1.7)}
                    fill={`url(#${glowId})`}
                  />
                ))}
            </g>

            {/* Every slab is grounded before any of them is raised, so a tile's
                contact shadow always falls on the board and never on the tile
                standing in front of it. */}
            <g className={styles.contacts} aria-hidden="true">
              {tiles.map((tile) => (
                <ellipse
                  key={tile.space.id}
                  cx={tile.at.x + tile.depth * 0.24}
                  cy={tile.at.y + tile.half * 0.92}
                  rx={tile.half * 1.12}
                  ry={tile.half * 0.34 + tile.depth * 0.18}
                  fill={`url(#${contactId})`}
                />
              ))}
            </g>

            <g className={styles.tileBases} aria-hidden="true">
              {tiles.map((tile) => {
                const { half, radius, size, depth } = tile
                return (
                  <g
                    key={tile.space.id}
                    transform={`translate(${tile.face.x}, ${tile.face.y})`}
                    data-tone={tile.space.tone}
                    data-accent={tile.accent}
                  >
                    {tile.accent === 'milestone' ? (
                      <>
                        <path
                          className={styles.bezelWall}
                          d={slabWallPath(half + 6, radius + 6, depth)}
                        />
                        <rect
                          className={styles.bezel}
                          x={-half - 6}
                          y={-half - 6}
                          width={size + 12}
                          height={size + 12}
                          rx={radius + 6}
                        />
                      </>
                    ) : null}
                    <path className={styles.tileWall} d={slabWallPath(half, radius, depth)} />
                    <rect
                      className={styles.tileFace}
                      x={-half}
                      y={-half}
                      width={size}
                      height={size}
                      rx={radius}
                    />
                  </g>
                )
              })}
            </g>

            <g className={styles.tileFaces}>
              {tiles.map((tile) => {
                const { half, radius, size, space } = tile
                const band = size * 0.24
                const isCurrent = activeSpaceId === space.id
                return (
                  <g
                    key={space.id}
                    transform={`translate(${tile.face.x}, ${tile.face.y})`}
                    data-space={space.id}
                    data-tone={space.tone}
                    data-accent={tile.accent}
                    data-current={isCurrent}
                  >
                    <title>
                      {space.title} — {space.description}
                    </title>

                    <rect
                      x={-half}
                      y={-half}
                      width={size}
                      height={size}
                      rx={radius}
                      fill={`url(#${sheenId})`}
                    />

                    {(space.kind === 'stop' || space.kind === 'event') ? (
                      <path
                        className={styles.hazardBand}
                        d={bottomBandPath(half, radius, band)}
                        fill={`url(#${hazardId})`}
                      />
                    ) : null}

                    {tile.accent === 'payday' ? (
                      <>
                        <rect
                          className={styles.coinRing}
                          x={-half + 5}
                          y={-half + 5}
                          width={size - 10}
                          height={size - 10}
                          rx={radius - 4}
                        />
                        <path
                          className={styles.sparkle}
                          d={sparklePath(half * 0.58, -half * 0.6, size * 0.17)}
                        />
                        <path
                          className={styles.sparkle}
                          d={sparklePath(-half * 0.66, half * 0.52, size * 0.1)}
                        />
                      </>
                    ) : null}

                    <rect
                      className={styles.tileEmboss}
                      x={-half + 2.5}
                      y={-half + 2.5}
                      width={size - 5}
                      height={size - 5}
                      rx={radius - 2}
                      stroke={`url(#${sheenId})`}
                    />

                    <GameIconGlyph
                      name={space.icon}
                      size={size * 0.72}
                      y={(space.kind === 'stop' || space.kind === 'event') ? -band * 0.42 : 0}
                    />

                    {tile.caption && tile.captionAt ? (
                      <g
                        className={styles.caption}
                        transform={`translate(0, ${
                          tile.captionAt === 'below'
                            ? half + tile.depth + captionSize * 1.05
                            : -half - captionSize * 1.05
                        })`}
                      >
                        <rect
                          className={styles.captionPlate}
                          x={-(tile.caption.length * captionSize * 0.62 + captionSize) / 2}
                          y={-captionSize * 0.78}
                          width={tile.caption.length * captionSize * 0.62 + captionSize}
                          height={captionSize * 1.56}
                          rx={captionSize * 0.62}
                        />
                        <text
                          className={styles.captionText}
                          textAnchor="middle"
                          dominantBaseline="central"
                          y={captionSize * 0.04}
                          style={{ fontSize: `${captionSize}px` }}
                        >
                          {tile.caption}
                        </text>
                      </g>
                    ) : null}

                    {/* The road not taken's own tiles dim with their road —
                        a shaded ribbon threading between bright tiles would
                        read as weather, not as an answer. A plain tinted
                        rect rather than a filter: a filter region per tile
                        is exactly what the shared-shadow note above the
                        slab layer exists to avoid. */}
                    {forkLight?.passedSpaceIds.has(space.id) ? (
                      <rect
                        data-testid="tile-not-taken"
                        className={styles.roadNotTakenTile}
                        x={-half}
                        y={-half}
                        width={size}
                        height={size}
                        rx={radius}
                      />
                    ) : null}

                    {isCurrent ? (
                      <g className={styles.here}>
                        <rect
                          className={styles.hereGlow}
                          x={-half - size * 0.2}
                          y={-half - size * 0.2}
                          width={size + size * 0.4}
                          height={size + size * 0.4}
                          rx={radius + size * 0.2}
                        />
                        <path
                          className={styles.hereBracketsUnder}
                          d={bracketPath(half + size * 0.12, size * 0.3)}
                        />
                        <path
                          className={styles.hereBrackets}
                          d={bracketPath(half + size * 0.12, size * 0.3)}
                        />
                      </g>
                    ) : null}
                  </g>
                )
              })}
            </g>

            <g className={styles.pawnLayer}>
              {parked.map(({ player, index }) => {
                // The mover's own space while its move is outstanding; every
                // other player's real, live space. See `visualSpaceId` above.
                const spaceId = visualSpaceId(player, index)
                return (
                  <Pawn
                    key={player.id}
                    ref={(handle) => {
                      if (handle) pawnRefs.current.set(player.id, handle)
                      else pawnRefs.current.delete(player.id)
                    }}
                    color={player.color}
                    restPosition={pointOf(board, projection, spaceId, fanOffset(spaceId, index))}
                    label={player.name.charAt(0).toUpperCase()}
                    name={player.name}
                    isActive={index === currentPlayerIndex}
                    isMarried={player.isMarried}
                    childCount={player.children}
                    // Recomputed on every render, which is the point: a
                    // promotion or a bad month re-renders the board, and the
                    // car's bodywork follows without anyone opening a menu.
                    wealthTier={wealthTier(estimateNetWorth(player, difficulty, edition), edition.economy)}
                    // Likewise live: a hire at the fair or a mid-life switch
                    // re-renders the board, and the driver peg is wearing the
                    // new trade's gear by the next paint.
                    careerIcon={player.career?.icon ?? null}
                    // And the diploma: the mortarboard goes on the moment
                    // the Cap and Gown tile re-renders the board, and comes
                    // off again when career gear claims the head.
                    hasDegree={player.hasDegree}
                    size={pawnSize}
                  />
                )
              })}
            </g>
          </g>
        </svg>
      </div>

      {/* Inside the card, over the map, and after the drawing in the DOM so
          the keys are the last thing a tab pass through the board reaches
          rather than something a keyboard has to get past to leave it.
          Inside `.frame` matters for another reason too: the board's own
          box is what `e2e/layout.spec.ts` measures against its grid cell,
          and a control added as a *sibling* of the card would be a second
          box in that cell for the layout to get wrong. */}
      <ZoomControls zoom={userZoom} onZoomIn={zoomIn} onZoomOut={zoomOut} onReset={resetZoom} />

      {/* The drawing is a single image to assistive technology, so who is on the
          board — and, above all, who is riding with them — is stated here in
          words rather than left inside it. */}
      <ul className="visually-hidden">
        {players.map((player) => (
          <li key={player.id}>
            {describeCar(player.name, player.isMarried, player.children)}, on{' '}
            {board.spaces[player.spaceId]?.title ?? 'the board'}
          </li>
        ))}
      </ul>

      {selectedTile && (
        <TilePopover
          space={selectedTile.space}
          anchor={selectedTile.anchor}
          onClose={() => setSelectedTile(null)}
        />
      )}
    </div>
  )
}
