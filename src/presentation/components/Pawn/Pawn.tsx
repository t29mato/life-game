import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
} from 'react'
import { animate, motion, useMotionValue, type AnimationPlaybackControls } from 'framer-motion'
import type { PlayerColor } from '@domain/model/types'
import type { IconName } from '@domain/model/icons'
import { useAudio } from '../../hooks/useAudio'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'
import { FAMILY_PALETTE, type CareerFamily } from '../CareerPlaque/families'
import { driverGearFamily } from './careerGear'
import { childPegs, describeCar } from './passengers'
import type { WealthTier } from './wealthTier'
import styles from './Pawn.module.css'

export interface PawnPoint {
  readonly x: number
  readonly y: number
}

export interface PawnHandle {
  /** Hops the token through each point in turn, firing `hop` sfx per landing. */
  hopThrough(path: readonly PawnPoint[]): Promise<void>
}

export interface PawnProps {
  readonly color: PlayerColor
  /**
   * Where the car sits when it isn't mid-hop. Read once to seed the very
   * first paint; after that the car tracks it continuously — a rival parking
   * alongside can change which bay this car is fanned into without it ever
   * having moved itself — except while `hopThrough` is actively driving the
   * token, which always wins.
   */
  readonly restPosition: PawnPoint
  /** Length of the car, in the surrounding SVG's user units. */
  readonly size?: number
  /** Seconds per single hop. Overridable for tests. */
  readonly hopDuration?: number
  /** Seconds to settle into a new bay when fanned rivals rearrange. */
  readonly settleDuration?: number
  /** Short label painted on the door, e.g. a player's initial. */
  readonly label?: string
  /** Full name, used only for the car's accessible description. */
  readonly name?: string
  readonly isActive?: boolean
  /** Puts a second grown-up peg in the passenger seat. */
  readonly isMarried?: boolean
  /** Small pegs in the back, one per child, capped and then badged. */
  readonly childCount?: number
  /**
   * How prosperous the bodywork looks, battered (1) to grand (4). Earned
   * from the player's live net worth, never chosen — see `wealthTier.ts`
   * for the banding. Defaults to the familiar mid-tier roadster.
   */
  readonly wealthTier?: WealthTier
  /**
   * The current career's own icon, worn by the driver peg as family-coloured
   * gear — a toque, a hard hat, a beret — the moment a hire or a switch
   * lands. Derived live from state exactly like `wealthTier`, never chosen;
   * see `careerGear.ts`. Absent, null, or naming no trade means the familiar
   * bare-headed peg.
   */
  readonly careerIcon?: IconName | null | undefined
}

/**
 * A peg passenger: a rounded head over a tapered body, sunk into its seat.
 * Laid out as fractions of the car's length so it keeps its proportions at any
 * size, but drawn in the board's own units so its outline never scales with it.
 */
function Peg({
  u,
  at,
  lift,
  scale,
  children,
}: {
  u: number
  at: number
  lift: number
  scale: number
  /** Drawn over the peg in its own frame — the driver's career gear. */
  children?: ReactNode
}): ReactElement {
  return (
    <g className={styles.peg} transform={`translate(${at * u}, ${lift * u})`}>
      <ellipse className={styles.pegBody} cy={-0.28 * u * scale} rx={0.075 * u * scale} ry={0.19 * u * scale} />
      <circle className={styles.pegHead} cy={-0.47 * u * scale} r={0.082 * u * scale} />
      <circle
        className={styles.pegGloss}
        cx={-0.026 * u * scale}
        cy={-0.5 * u * scale}
        r={0.03 * u * scale}
      />
      {children}
    </g>
  )
}

/**
 * The driver's career gear: one small moulded accessory per plaque family,
 * worn by the peg at the wheel and cast in that family's own plastic
 * (`FAMILY_PALETTE`), so a rival's trade reads across the table before its
 * name does — the pawn-scale cousin of the `CareerPlaque` treatment.
 *
 * Each piece is chosen for its *silhouette* at peg scale, where a head is a
 * couple of pixels: the toque is tall, the straw hat wide, the hard hat a
 * smooth dome over a dark brim, the beret a tilted pancake, the sports cap a
 * dome with a forward peak, the goggles two bumps pushed up on the head, the
 * clinic cap the one white shape with a coloured cross — and the necktie the
 * one mark worn on the body, not the head. Drawn in the peg's own frame on
 * the same unit grid as the rest of the car, lit from the same upper-left
 * (a white gloss catching each crown's left shoulder, the darker tone low
 * and to the right), with the board-weight outlines every moulding carries.
 */
function DriverGear({ u, family }: { u: number; family: CareerFamily }): ReactElement {
  const palette = FAMILY_PALETTE[family]
  const style = {
    '--gear-light': palette.light,
    '--gear-base': palette.base,
    '--gear-dark': palette.dark,
  } as CSSProperties

  return (
    <g className={styles.gear} data-gear-family={family} style={style}>
      {family === 'kitchen' ? (
        // The toque: a tall white-hot crown of the kitchen's copper plastic,
        // puffed at the top, banded at the brow.
        <>
          <rect
            className={styles.gearLight}
            x={-0.062 * u}
            y={-0.65 * u}
            width={0.124 * u}
            height={0.115 * u}
          />
          <ellipse className={styles.gearLight} cy={-0.655 * u} rx={0.088 * u} ry={0.052 * u} />
          <rect
            className={styles.gearTint}
            x={-0.062 * u}
            y={-0.556 * u}
            width={0.124 * u}
            height={0.02 * u}
          />
          <circle className={styles.gearGloss} cx={-0.032 * u} cy={-0.665 * u} r={0.02 * u} />
        </>
      ) : null}

      {family === 'field' ? (
        // The straw hat: the widest brim on the board, a low crown above it.
        <>
          <path
            className={styles.gearLight}
            d={scalePath('M -0.068 -0.525 Q -0.068 -0.61 0 -0.61 Q 0.068 -0.61 0.068 -0.525 Z', u)}
          />
          <ellipse className={styles.gearShell} cy={-0.525 * u} rx={0.13 * u} ry={0.03 * u} />
          <circle className={styles.gearGloss} cx={-0.026 * u} cy={-0.578 * u} r={0.017 * u} />
        </>
      ) : null}

      {family === 'works' ? (
        // The hard hat: a smooth proud dome with a crest bump on top and a
        // dark all-round brim seating it on the head.
        <>
          <rect
            className={styles.gearShell}
            x={-0.024 * u}
            y={-0.617 * u}
            width={0.048 * u}
            height={0.024 * u}
            rx={0.01 * u}
          />
          <path
            className={styles.gearShell}
            d={scalePath('M -0.096 -0.5 Q -0.1 -0.6 0 -0.6 Q 0.1 -0.6 0.096 -0.5 Z', u)}
          />
          <ellipse className={styles.gearDark} cy={-0.5 * u} rx={0.117 * u} ry={0.02 * u} />
          <circle className={styles.gearGloss} cx={-0.036 * u} cy={-0.56 * u} r={0.02 * u} />
        </>
      ) : null}

      {family === 'office' ? (
        // The necktie: knot at the collar, blade down the front — the one
        // family worn on the body, so a bare head still means "no job yet".
        <>
          <path
            className={styles.gearShell}
            d={scalePath('M 0 -0.36 L 0.032 -0.3 L 0 -0.232 L -0.032 -0.3 Z', u)}
          />
          <path
            className={styles.gearShell}
            d={scalePath('M 0 -0.4 L 0.026 -0.378 L 0 -0.356 L -0.026 -0.378 Z', u)}
          />
        </>
      ) : null}

      {family === 'studio' ? (
        // The beret: a pancake tipped to one side, stalk on top.
        <>
          <ellipse
            className={styles.gearShell}
            cx={0.01 * u}
            cy={-0.556 * u}
            rx={0.098 * u}
            ry={0.036 * u}
            transform={`rotate(-12 ${0.01 * u} ${-0.556 * u})`}
          />
          <circle className={styles.gearDark} cx={0.002 * u} cy={-0.598 * u} r={0.013 * u} />
          <circle className={styles.gearGloss} cx={-0.028 * u} cy={-0.568 * u} r={0.016 * u} />
        </>
      ) : null}

      {family === 'care' ? (
        // The clinic cap: the one white piece of headwear, carrying its
        // family's colour as the cross rather than the cloth.
        <>
          <path
            className={styles.gearWhite}
            d={scalePath('M -0.062 -0.535 L -0.05 -0.605 L 0.05 -0.605 L 0.062 -0.535 Z', u)}
          />
          <rect
            className={styles.gearTint}
            x={-0.011 * u}
            y={-0.594 * u}
            width={0.022 * u}
            height={0.048 * u}
          />
          <rect
            className={styles.gearTint}
            x={-0.034 * u}
            y={-0.581 * u}
            width={0.068 * u}
            height={0.022 * u}
          />
        </>
      ) : null}

      {family === 'science' ? (
        // The goggles: pushed up onto the head between experiments — two
        // rimmed lenses over a strap, a glint in the left one.
        <>
          <path
            className={styles.gearStrap}
            d={scalePath('M -0.08 -0.498 Q 0 -0.535 0.08 -0.498', u)}
          />
          <rect
            className={styles.gearDark}
            x={-0.012 * u}
            y={-0.553 * u}
            width={0.024 * u}
            height={0.016 * u}
          />
          <circle className={styles.gearLight} cx={-0.04 * u} cy={-0.545 * u} r={0.033 * u} />
          <circle className={styles.gearLight} cx={0.04 * u} cy={-0.545 * u} r={0.033 * u} />
          <circle className={styles.gearGloss} cx={-0.05 * u} cy={-0.553 * u} r={0.011 * u} />
        </>
      ) : null}

      {family === 'pitch' ? (
        // The sports cap: a dome with its peak jutting toward the nose of
        // the car — the one hat that points the way the driver is going.
        <>
          <path
            className={styles.gearShell}
            d={scalePath('M -0.086 -0.502 Q -0.086 -0.585 0 -0.585 Q 0.086 -0.585 0.086 -0.502 Z', u)}
          />
          <path
            className={styles.gearShell}
            d={scalePath('M 0.055 -0.51 Q 0.13 -0.515 0.152 -0.492 Q 0.11 -0.472 0.052 -0.482 Z', u)}
          />
          <circle className={styles.gearDark} cy={-0.588 * u} r={0.013 * u} />
          <circle className={styles.gearGloss} cx={-0.03 * u} cy={-0.552 * u} r={0.018 * u} />
        </>
      ) : null}
    </g>
  )
}

/** Scales a path written on the unit car up to `u` viewBox units. */
function scalePath(path: string, u: number): string {
  return path.replace(/-?\d*\.?\d+/g, (value) => String(Math.round(Number(value) * u * 100) / 100))
}

/** The bodywork: rear deck, open cockpit, sloping bonnet — on the unit car. */
const BODY_PATH =
  'M -0.49 0.14 L -0.49 -0.06 Q -0.47 -0.21 -0.32 -0.22 L 0.14 -0.22 Q 0.26 -0.22 0.32 -0.11 L 0.46 -0.05 Q 0.5 -0.03 0.5 0.03 L 0.5 0.14 Z'
const GLASS_PATH = 'M 0.14 -0.22 Q 0.22 -0.23 0.27 -0.35 L 0.19 -0.35 Q 0.16 -0.25 0.12 -0.22 Z'
const GLOSS_PATH = 'M -0.42 -0.09 Q -0.3 -0.17 -0.1 -0.17 L 0.12 -0.17'

/* ---- Wealth-tier bodywork, all on the same unit car ----------------------- */

/**
 * The grand tourer's body: the identical rear deck and cockpit, with the
 * bonnet run stretched to a longer nose — the one silhouette change that
 * says "expensive" at board scale. Everything aft of the windscreen matches
 * `BODY_PATH` point for point, so passengers, door roundel and shadow all
 * sit exactly where every other tier puts them.
 */
const GRAND_BODY_PATH =
  'M -0.49 0.14 L -0.49 -0.06 Q -0.47 -0.21 -0.32 -0.22 L 0.14 -0.22 Q 0.26 -0.22 0.32 -0.11 L 0.54 -0.05 Q 0.58 -0.03 0.58 0.03 L 0.58 0.14 Z'
/** The lighter second colour laid over the long bonnet: a two-tone paint job. */
const TWO_TONE_PATH =
  'M 0.31 -0.11 L 0.54 -0.05 Q 0.58 -0.03 0.58 0.03 L 0.58 0.14 L 0.31 0.14 Z'
/** A crease knocked into the rear wing, drawn as its own shaded crescent. */
const DENT_PATH = 'M -0.44 -0.05 Q -0.36 -0.14 -0.28 -0.06 Q -0.36 -0.1 -0.44 -0.05 Z'
/** A rust bloom low on the nose, where the road salt always gets in first. */
const RUST_PATH = 'M 0.33 0.1 Q 0.37 0.05 0.42 0.09 Q 0.38 0.14 0.33 0.1 Z'
/** Two key scratches along the rear door, the runabout's service record. */
const SCRATCH_PATHS = ['M -0.45 0.05 L -0.31 0.02', 'M -0.43 0.09 L -0.35 0.07'] as const

/**
 * A player's car: a moulded plastic roadster carrying peg passengers, which
 * hops between board spaces with squash-and-stretch and a shadow that shrinks
 * at the apex of each arc. The whole path is driven by `hopThrough`,
 * imperatively, so the caller can `await` full traversal.
 *
 * The passengers are the point. A player's marriage and their children are
 * otherwise buried in a stats panel; here they ride around the board in plain
 * sight, so every player can see at a glance who has a full car and who is
 * still driving alone.
 *
 * The car is drawn to the same light as the rest of the board — one source in
 * the upper left — with a darker chassis beneath a glossy body and a single
 * specular along the top edge, and its cast shadow is a separate element so it
 * can stay behind on the surface while the body arcs above it.
 */
export const Pawn = forwardRef<PawnHandle, PawnProps>(function Pawn(
  {
    color,
    restPosition,
    size = 34,
    hopDuration = 0.32,
    settleDuration = 0.28,
    label,
    name,
    isActive = false,
    isMarried = false,
    childCount = 0,
    wealthTier = 2,
    careerIcon = null,
  },
  ref,
): ReactElement {
  const audio = useAudio()
  const reduceMotion = usePrefersReducedMotion()
  const rawId = useId()
  const uid = useMemo(() => rawId.replace(/:/g, ''), [rawId])
  const x = useMotionValue(restPosition.x)
  const groundY = useMotionValue(restPosition.y)
  const liftY = useMotionValue(restPosition.y)
  const scaleX = useMotionValue(1)
  const scaleY = useMotionValue(1)
  const shadowScale = useMotionValue(1)
  const shadowOpacity = useMotionValue(0.35)
  const activeControls = useRef<AnimationPlaybackControls[]>([])
  /** True while `hopThrough` owns `x`/`groundY`/`liftY`, so a settle triggered
   * by a rival's arrival never fights the move actually in flight. */
  const isHopping = useRef(false)
  /** Skips the settle effect's very first run: the motion values above were
   * already seeded from this exact position on mount. */
  const mounted = useRef(false)

  useEffect(() => {
    return () => {
      activeControls.current.forEach((controls) => controls.stop())
      activeControls.current = []
    }
  }, [])

  /**
   * Keeps a parked car on its actual bay as rivals arrive at or leave its
   * space. Only the token's own `hopThrough` may move it once mounted — this
   * effect used to be inert after the first paint, which is why a car already
   * settled on a tile never budged to make room for a later arrival and could
   * end up parked exactly on top of it. Skipped entirely while a hop is in
   * flight, so nothing ever fights `hopThrough` for the same motion values.
   */
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true
      return
    }
    if (isHopping.current) return
    if (x.get() === restPosition.x && groundY.get() === restPosition.y) return

    const duration = reduceMotion ? 0 : settleDuration
    if (duration <= 0) {
      x.set(restPosition.x)
      groundY.set(restPosition.y)
      liftY.set(restPosition.y)
      return
    }
    const controls = [
      animate(x, restPosition.x, { duration, ease: 'easeOut' }),
      animate(groundY, restPosition.y, { duration, ease: 'easeOut' }),
      animate(liftY, restPosition.y, { duration, ease: 'easeOut' }),
    ]
    activeControls.current.push(...controls)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restPosition.x, restPosition.y])

  const hopOnce = useCallback(
    (from: PawnPoint, to: PawnPoint): Promise<void> => {
      const duration = reduceMotion ? 0.01 : hopDuration
      return new Promise((resolve) => {
        const controls = animate(0, 1, {
          duration,
          ease: 'easeInOut',
          onUpdate: (v) => {
            const arc = Math.sin(Math.PI * v)
            x.set(from.x + (to.x - from.x) * v)
            const ground = from.y + (to.y - from.y) * v
            groundY.set(ground)
            liftY.set(ground - arc * size * 0.9)

            const stretch = 1 + 0.28 * arc
            const squashEdges = (1 - arc) ** 3 * 0.22
            scaleY.set(Math.max(0.6, stretch - squashEdges))
            scaleX.set(Math.max(0.6, 2 - (stretch - squashEdges)))
            shadowScale.set(1 - 0.5 * arc)
            shadowOpacity.set(0.4 - 0.22 * arc)
          },
          onComplete: () => {
            scaleX.set(1)
            scaleY.set(1)
            shadowScale.set(1)
            shadowOpacity.set(0.35)
            resolve()
          },
        })
        activeControls.current.push(controls)
      })
    },
    [reduceMotion, hopDuration, size, x, groundY, liftY, scaleX, scaleY, shadowScale, shadowOpacity],
  )

  useImperativeHandle(
    ref,
    () => ({
      async hopThrough(path) {
        isHopping.current = true
        try {
          let from: PawnPoint = { x: x.get(), y: groundY.get() }
          for (const to of path) {
            await hopOnce(from, to)
            audio.playSfx('hop')
            from = to
          }
        } finally {
          isHopping.current = false
        }
      },
    }),
    [hopOnce, audio, x, groundY],
  )

  /* The car is laid out on a unit grid — one unit is its full length — so every
     proportion below reads as a fraction of the car rather than as a pixel
     count that means nothing on its own. Multiplying through here rather than
     wrapping the whole thing in a `scale()` keeps outlines and lettering at the
     board's own weight instead of thinning them as the car shrinks. */
  const u = size
  const bodyId = `${uid}-body`
  const castId = `${uid}-cast`
  const { pegs, badge } = childPegs(childCount)
  const description = describeCar(name ?? label ?? 'Player', isMarried, childCount)
  /* The driver's gear, from the live career — recomputed every render the
     same way `wealthTier` is, so a hire or a switch dresses the peg the
     moment the board next paints. Fails closed to the bare head. */
  const gearFamily = driverGearFamily(careerIcon)

  /* The grand tourer alone changes the silhouette — a longer nose, the front
     axle pushed forward under it, the lamp out on the new wing. Every other
     tier keeps the standard footprint exactly, so passengers and the door
     roundel never move when a player's fortunes do. */
  const grand = wealthTier === 4
  const bodyPath = grand ? GRAND_BODY_PATH : BODY_PATH
  const noseAt = grand ? 0.58 : 0.5
  const frontWheelAt = grand ? 0.33 : 0.27
  const lampAt = grand ? 0.53 : 0.45

  /* Back row first, so the grown-ups in front overlap them: the children's
     heads then peek over the seat backs the way they would in a real toy. */
  const childSeats = [-0.26, -0.12, 0.02]
  const badgeAt = childSeats[Math.min(pegs, childSeats.length - 1)] ?? 0.02

  return (
    <g
      className={styles.token}
      data-testid="pawn"
      data-color={color}
      data-active={isActive}
      data-married={isMarried}
      data-children={Math.max(0, Math.floor(childCount))}
      data-tier={wealthTier}
      data-career-family={gearFamily ?? undefined}
      role="img"
      aria-label={description}
    >
      <defs>
        <linearGradient id={bodyId} x1="0" y1="0" x2="0.15" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.6" />
          <stop offset="34%" stopColor="#ffffff" stopOpacity="0.12" />
          <stop offset="66%" stopColor="#0b0722" stopOpacity="0" />
          <stop offset="100%" stopColor="#0b0722" stopOpacity="0.34" />
        </linearGradient>
        <radialGradient id={castId}>
          <stop offset="0%" stopColor="#120d2b" stopOpacity="0.62" />
          <stop offset="58%" stopColor="#120d2b" stopOpacity="0.32" />
          <stop offset="100%" stopColor="#120d2b" stopOpacity="0" />
        </radialGradient>
      </defs>

      <motion.ellipse
        className={styles.shadow}
        cx={0}
        cy={size * 0.3}
        rx={size * (noseAt + 0.06)}
        ry={size * 0.15}
        fill={`url(#${castId})`}
        style={{ x, y: groundY, scaleX: shadowScale, scaleY: shadowScale, opacity: shadowOpacity }}
      />

      <motion.g className={styles.pawn} style={{ x, y: liftY, scaleX, scaleY }}>
        {isActive ? (
          <>
            <ellipse className={styles.haloUnder} cy={0.16 * u} rx={0.62 * u} ry={0.34 * u} />
            <ellipse className={styles.halo} cy={0.16 * u} rx={0.62 * u} ry={0.34 * u} />
          </>
        ) : null}

        {/* Wheels, behind the bodywork they are bolted to. A battered car has
            lost the bright hub off its front wheel — the bald tyre reads from
            across the table — and a polished one rings both in chrome. */}
        {[-0.29, frontWheelAt].map((cx, wheel) => (
          <g key={cx}>
            <circle className={styles.tyre} cx={cx * u} cy={0.19 * u} r={0.125 * u} />
            <circle
              className={wealthTier === 1 && wheel === 1 ? styles.wornHub : styles.hub}
              cx={cx * u}
              cy={0.19 * u}
              r={0.052 * u}
            />
            {wealthTier >= 3 ? (
              <circle className={styles.hubRing} cx={cx * u} cy={0.19 * u} r={0.082 * u} />
            ) : null}
          </g>
        ))}

        {/* The back seat: drawn first and higher, so the grown-ups in front
            overlap them and only the children's heads show over the seat. */}
        {childSeats.slice(0, pegs).map((at) => (
          <Peg key={at} u={u} at={at} lift={-0.13} scale={0.62} />
        ))}
        {badge ? (
          <g className={styles.badge} transform={`translate(${badgeAt * u}, ${-0.6 * u})`}>
            <rect
              className={styles.badgePlate}
              x={-0.15 * u}
              y={-0.11 * u}
              width={0.3 * u}
              height={0.22 * u}
              rx={0.11 * u}
            />
            <text
              className={styles.badgeText}
              textAnchor="middle"
              dominantBaseline="central"
              y={0.005 * u}
              style={{ fontSize: `${0.17 * u}px` }}
            >
              {badge}
            </text>
          </g>
        ) : null}

        {/* At the wheel — wearing the trade's gear — and the seat beside it
            once there is a partner. Only the driver dresses for work. */}
        {isMarried ? <Peg u={u} at={-0.07} lift={0} scale={1} /> : null}
        <Peg u={u} at={0.1} lift={0} scale={1}>
          {gearFamily ? <DriverGear u={u} family={gearFamily} /> : null}
        </Peg>

        {/* Chassis: the darker moulding the body sits on. */}
        <rect
          className={styles.chassis}
          x={-0.5 * u}
          y={-0.04 * u}
          width={(0.5 + noseAt) * u}
          height={0.28 * u}
          rx={0.11 * u}
        />

        <path className={styles.body} d={scalePath(bodyPath, u)} />
        {grand ? <path className={styles.twoTone} d={scalePath(TWO_TONE_PATH, u)} /> : null}
        <path className={styles.bodyShade} d={scalePath(bodyPath, u)} fill={`url(#${bodyId})`} />

        {/* Windscreen and lamp, the two details that fix which way it faces. */}
        <path className={styles.glass} d={scalePath(GLASS_PATH, u)} />
        <circle className={styles.lamp} cx={lampAt * u} cy={-0.03 * u} r={0.042 * u} />
        <path className={styles.gloss} d={scalePath(GLOSS_PATH, u)} />

        {/* The service record of a car that has seen better days: a creased
            wing, key scratches, and rust blooming out of the nose. */}
        {wealthTier === 1 ? (
          <>
            <path className={styles.dent} d={scalePath(DENT_PATH, u)} />
            {SCRATCH_PATHS.map((scratch) => (
              <path key={scratch} className={styles.scratch} d={scalePath(scratch, u)} />
            ))}
            <path className={styles.rust} d={scalePath(RUST_PATH, u)} />
          </>
        ) : null}

        {/* Brightwork: the chrome speedline a well-off car carries along its
            flank, and — on the grand tourer alone — the ornament on the nose. */}
        {wealthTier >= 3 ? (
          <path
            className={styles.trim}
            d={scalePath(grand ? 'M -0.44 0.09 L 0.5 0.09' : 'M -0.44 0.09 L 0.42 0.09', u)}
          />
        ) : null}
        {grand ? (
          <g>
            <path className={styles.ornamentStem} d={scalePath('M 0.55 -0.05 L 0.55 -0.09', u)} />
            <circle className={styles.ornamentHead} cx={0.55 * u} cy={-0.11 * u} r={0.022 * u} />
          </g>
        ) : null}

        {/* The door roundel: whose car this is, painted on the side. */}
        {label ? (
          <g>
            <circle className={styles.doorPlate} cx={-0.09 * u} cy={0.03 * u} r={0.125 * u} />
            <text
              className={styles.doorText}
              textAnchor="middle"
              dominantBaseline="central"
              x={-0.09 * u}
              y={0.035 * u}
              style={{ fontSize: `${0.2 * u}px` }}
            >
              {label}
            </text>
          </g>
        ) : null}
      </motion.g>
    </g>
  )
})
