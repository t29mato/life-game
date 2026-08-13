import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  type ReactElement,
} from 'react'
import { animate, motion, useMotionValue, type AnimationPlaybackControls } from 'framer-motion'
import type { PlayerColor } from '@domain/model/types'
import { useAudio } from '../../hooks/useAudio'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'
import { childPegs, describeCar } from './passengers'
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
}

/**
 * A peg passenger: a rounded head over a tapered body, sunk into its seat.
 * Laid out as fractions of the car's length so it keeps its proportions at any
 * size, but drawn in the board's own units so its outline never scales with it.
 */
function Peg({ u, at, lift, scale }: { u: number; at: number; lift: number; scale: number }): ReactElement {
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
        rx={size * 0.56}
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

        {/* Wheels, behind the bodywork they are bolted to. */}
        {[-0.29, 0.27].map((cx) => (
          <g key={cx}>
            <circle className={styles.tyre} cx={cx * u} cy={0.19 * u} r={0.125 * u} />
            <circle className={styles.hub} cx={cx * u} cy={0.19 * u} r={0.052 * u} />
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

        {/* At the wheel, and the seat beside it once there is a partner. */}
        {isMarried ? <Peg u={u} at={-0.07} lift={0} scale={1} /> : null}
        <Peg u={u} at={0.1} lift={0} scale={1} />

        {/* Chassis: the darker moulding the body sits on. */}
        <rect
          className={styles.chassis}
          x={-0.5 * u}
          y={-0.04 * u}
          width={u}
          height={0.28 * u}
          rx={0.11 * u}
        />

        <path className={styles.body} d={scalePath(BODY_PATH, u)} />
        <path className={styles.bodyShade} d={scalePath(BODY_PATH, u)} fill={`url(#${bodyId})`} />

        {/* Windscreen and lamp, the two details that fix which way it faces. */}
        <path className={styles.glass} d={scalePath(GLASS_PATH, u)} />
        <circle className={styles.lamp} cx={0.45 * u} cy={-0.03 * u} r={0.042 * u} />
        <path className={styles.gloss} d={scalePath(GLOSS_PATH, u)} />

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
