import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  type CSSProperties,
  type ReactElement,
} from 'react'
import { animate, useMotionValue, type AnimationPlaybackControls } from 'framer-motion'
import type { Board as BoardModel, GamePhase, Player, Space, SpaceId } from '@domain/model/types'
import { GameIconGlyph } from '../../icons/GameIcon'
import { Pawn, type PawnHandle, type PawnPoint } from '../Pawn/Pawn'
import { describeCar } from '../Pawn/passengers'
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
  type BoardProjection,
  type CaptionSide,
  type Point,
  type SpaceAccent,
} from './boardLayout'
import {
  approachZoom,
  arrivalZoom,
  cameraTransform,
  flythroughShots,
  focusShot,
  restSequence,
  wideShot,
  RESOLVE_ZOOM,
  type CameraShot,
} from './camera'
import { Pocket, Scenery } from './Scenery'
import styles from './Board.module.css'

export interface BoardProps {
  readonly board: BoardModel
  readonly players: readonly Player[]
  readonly currentPlayerIndex: number
  readonly phase: GamePhase
  readonly movementPath: readonly SpaceId[]
  /** Fired once the active pawn has hopped through the whole `movementPath`. */
  readonly onMovementComplete: () => void
  /** Sweeps the camera along the route once before the first turn. */
  readonly introFlythrough?: boolean
  /** Which country's map pigments to paint the terrain in — see `.frame`'s `[data-edition]` overrides. */
  readonly editionId?: string
}

/**
 * Car length and how far apart parked cars sit, both as fractions of a tile,
 * indexed by how many players are in the game.
 *
 * A single car is drawn almost as long as its space — the toy overhangs the
 * board, and that is what makes it read as a physical object sitting on the
 * tile rather than as an icon printed inside it. Each extra player shortens
 * every car and widens the echelon, so a full stack still fits on one space
 * with every roofline and every passenger in view.
 */
const PAWN_SCALE: readonly number[] = [0.9, 0.9, 0.86, 0.75, 0.67]

/**
 * The echelon reaches further sideways than it does back, because a car is
 * much longer than it is deep — the sideways step is what keeps the bonnet,
 * the driver and the headlamp of a covered car in view, which has to survive
 * the active player's car being laid over the top of the pile.
 *
 * The step back matters just as much, though: two cars offset only sideways
 * still have their bodies overlapping through most of their width, and it is
 * the back step that lifts one roofline clear of the other so a stack of cars
 * reads as several roofs in a row rather than one wide smear. At four to a
 * tile the back step used to be little more than a third of a car's own
 * height — barely more than the wheels alone — which is what let two cars in
 * the middle of the row all but merge into one silhouette; it is widened here
 * so a step is always a good fraction of a whole car tall.
 *
 * Each figure is set so that the outermost slot plus half a car still lands
 * near the tarmac. A car may overhang its space — the toy always does — but
 * one that hung off the road entirely would read as misplaced rather than as
 * parked.
 */
const SLOT_SPREAD_X: readonly number[] = [0, 0, 0.4, 0.46, 0.5]
const SLOT_SPREAD_Y: readonly number[] = [0, 0, 0.35, 0.41, 0.54]

/**
 * Seconds a camera move takes: a considered one between turns, a brisk one that
 * has to keep up with a hopping car, and one leg of the opening sweep.
 */
const CAMERA_SECONDS = 0.62
const FOLLOW_SECONDS = 0.34
const FLYTHROUGH_SECONDS = 0.9
const CAMERA_EASE: readonly [number, number, number, number] = [0.16, 1, 0.3, 1]

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
  onMovementComplete,
  introFlythrough = false,
  editionId,
}: BoardProps): ReactElement {
  const rawId = useId()
  const uid = useMemo(() => rawId.replace(/:/g, ''), [rawId])
  const reduceMotion = usePrefersReducedMotion()
  const projection = useMemo(() => createProjection(board), [board])
  const spaces = useMemo(() => Object.values(board.spaces), [board])

  const captionSize = projection.tileSize * 0.34

  /* The whole landscape is a pure function of the board and the projection, so
     it is built once and never rebuilt as players move around on top of it. */
  const lanes = useMemo(() => boardLanes(board), [board])
  const regions = useMemo(() => terrainRegions(board, projection, lanes), [board, projection, lanes])
  const coast = useMemo(() => coastline(board, projection), [board, projection])
  const pockets = useMemo(() => forkPockets(board, projection), [board, projection])
  const hills = useMemo(() => ridges(board, projection), [board, projection])
  const scenery = useMemo(() => scatterScenery(board, projection), [board, projection])
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
   */
  const visualSpaceIds = useRef<Map<string, SpaceId | undefined>>(new Map())
  const visualSpaceId = useCallback(
    (player: Player, index: number): SpaceId | undefined => {
      const frozen =
        index === currentPlayerIndex && phase === 'moving' && visualSpaceIds.current.has(player.id)
      if (!frozen) visualSpaceIds.current.set(player.id, player.spaceId)
      return visualSpaceIds.current.get(player.id)
    },
    [currentPlayerIndex, phase],
  )

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

  /* ── the camera ────────────────────────────────────────────────────────
     Driven as a transform on a group inside a viewBox that never changes,
     rather than by rewriting the viewBox itself: React owns that attribute and
     would reset it on every re-render, which is a fight the camera loses. */
  const opening = wideShot(projection)
  const initial = cameraTransform(projection, opening)
  const camX = useMotionValue(initial.x)
  const camY = useMotionValue(initial.y)
  const camScale = useMotionValue(initial.scale)
  const cameraControls = useRef<AnimationPlaybackControls[]>([])
  const cameraRef = useRef<SVGGElement>(null)
  /** True until the opening sweep is done: nothing else may touch the camera. */
  const flyingRef = useRef(introFlythrough)

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

  const applyShot = useCallback(
    (shot: CameraShot, seconds: number): Promise<void> => {
      const target = cameraTransform(projection, shot)

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
    [projection, camX, camY, camScale],
  )

  useEffect(() => {
    return () => {
      cameraControls.current.forEach((controls) => controls.stop())
      cameraControls.current = []
    }
  }, [])

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
      void applyShot(wideShot(projection), 0)
      return
    }

    let cancelled = false
    const run = async (): Promise<void> => {
      for (const shot of flythroughShots(board, projection)) {
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
   * player's own corner of the board instead. The one exception is the instant
   * a *different* player is handed the table: that gets a brief passing wide
   * shot first (`restSequence`'s `establishing` shot), so a player picking up
   * the controller sees where their car sits in the whole journey before the
   * camera commits to it — the orientation cue a permanently tight camera
   * would otherwise cost. Reduced motion always collapses straight to the
   * final rest shot: the wide establishing beat is motion, not information,
   * and the rest shot alone already answers "where am I and what's next".
   */
  const previousRestPlayerId = useRef<string | null>(null)
  useEffect(() => {
    if (flyingRef.current || phase === 'moving') return
    const space = activeSpaceId ? board.spaces[activeSpaceId] : undefined

    if (phase === 'awaitingDecision' || phase === 'resolved') {
      previousRestPlayerId.current = activePlayer?.id ?? null
      const framed = space
        ? focusShot(projection, projection.project(space.layout), RESOLVE_ZOOM)
        : wideShot(projection)
      void applyShot(framed, reduceMotion ? 0 : CAMERA_SECONDS)
      return
    }

    const changedPlayer = previousRestPlayerId.current !== (activePlayer?.id ?? null)
    previousRestPlayerId.current = activePlayer?.id ?? null
    const sequence = restSequence(board, projection, space, changedPlayer && !reduceMotion)

    let cancelled = false
    void (async () => {
      for (const shot of sequence) {
        if (cancelled) return
        await applyShot(shot, reduceMotion ? 0 : CAMERA_SECONDS)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [phase, activeSpaceId, activePlayer?.id, board, projection, applyShot, reduceMotion])

  useEffect(() => {
    if (phase !== 'moving' || movementPath.length === 0 || movingRef.current) return
    const mover = activePlayer
    if (!mover) return
    const ref = pawnRefs.current.get(mover.id)
    movingRef.current = true

    const run = async (): Promise<void> => {
      const total = movementPath.length
      const closest = arrivalZoom(board, movementPath[total - 1])
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
          focusShot(projection, target, approachZoom(step, total, closest)),
          reduceMotion ? 0 : FOLLOW_SECONDS,
        )
        await ref?.hopThrough([target])
      }
      movingRef.current = false
      onMovementComplete()
    }
    void run()
    // Deliberately keyed on phase/movementPath alone: this must run exactly
    // once per move, regardless of prop identity churn elsewhere.
  }, [phase, movementPath])

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
    <div
      className={styles.frame}
      data-edition={editionId}
      /* The board's own shape, published to whatever is laying it out. A longer
         route is a taller board — `long` is taller than it is wide — so the
         column it sits in cannot assume a landscape card and has to be told.
         See `.boardArea` in `App.module.css`, which caps the board's width at
         the width its own aspect still fits the available height at. */
      style={{ '--board-aspect': `${projection.viewWidth / projection.viewHeight}` } as CSSProperties}
    >
      <div className={styles.surface} ref={surfaceRef}>
        <svg
          className={styles.svg}
          viewBox={`0 0 ${projection.viewWidth} ${projection.viewHeight}`}
          role="img"
          aria-label="Game board"
          preserveAspectRatio="xMidYMid meet"
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

                    {space.kind === 'stop' ? (
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
                      y={space.kind === 'stop' ? -band * 0.42 : 0}
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
                    size={pawnSize}
                  />
                )
              })}
            </g>
          </g>
        </svg>
      </div>

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
    </div>
  )
}
