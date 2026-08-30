import { useEffect, useRef, useState, type ReactElement } from 'react'
import {
  animate,
  cubicBezier,
  motion,
  useMotionValue,
  useTransform,
  type AnimationPlaybackControls,
} from 'framer-motion'
import type { SpinValue } from '@domain/model/types'
import { useAudio } from '../../hooks/useAudio'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'
import { FACE_PLACEMENTS, SETTLE_ROTATIONS, pipsFor } from './diceFaces'
import styles from './Dice.module.css'

export interface DiceProps {
  /** The face to land on. Set by the parent once the store has resolved a roll. */
  readonly result: SpinValue | null
  readonly disabled?: boolean
  /** Fired when the player presses the die. */
  readonly onRoll: () => void
  /** Fired once the die has fully settled on `result`. */
  readonly onRollComplete: () => void
  /**
   * Bump this to make the die roll as though it had been pressed. A computer
   * seat takes its turn through here, so its roll looks exactly like a
   * person's rather than the number simply appearing.
   */
  readonly autoRollToken?: number
  /** Seconds for the tumble. Overridable for tests. */
  readonly rollDuration?: number
  /** Seconds for the overshoot-settle bounce. Overridable for tests. */
  readonly settleDuration?: number
  /**
   * Sized down for the board dock, where the die floats over a map that
   * needs the room. `EventSpinModal` has no board to protect: a roll with no
   * bearing on the board's tiles gets the full-size die at any width.
   */
  readonly compact?: boolean
}

/** viewBox units. Each face is drawn in its own square and scaled by CSS. */
const SIZE = 100
const CORNER = 22
const PIP_RADIUS = 7.4

/** Full edge-over-edge turns the throw makes about the rolling (X) axis. */
const TUMBLE_X_TURNS = 3
/** Full corkscrew turns about Y — all spent airborne, none in the rollout. */
const TUMBLE_Y_TURNS = 1
/** Share of the roll spent airborne; the rest is rolling out on the table. */
const FLIGHT_SHARE = 0.4
/** Degrees past the resting angle, taken back by the settle bounce. */
const OVERSHOOT_DEG = 14
/** How far below rest the settle dips — plastic compressing on impact. */
const SETTLE_SQUASH = -0.055

/**
 * Where the throw peaks, in percentages of the die's own width — so the arc
 * scales with the die from a 64px phone dock to the full-size modal die. The
 * dock die is thrown up and out over the board's tiles; the modal die lives
 * inside a card that clips its own overflow, so its toss stays within reach
 * of the card's edges.
 */
const THROW_ARC = {
  board: { x: -115, y: -165 },
  modal: { x: -42, y: -72 },
} as const

/** Point in the descent leg where the die first touches the table. */
const TOUCHDOWN = 0.45
/** Where its one small bounce has died out and it is rolling flat. */
const BOUNCE_END = 0.78
/** Height of that bounce, as a fraction of the throw's peak. */
const BOUNCE_RISE = 0.16

/**
 * Height over the descent leg, from 1 at the peak to 0 at rest: a quickening
 * fall to touchdown, one small bounce, then flat on the table while the last
 * of the spin rolls out.
 */
function descentHeight(p: number): number {
  if (p < TOUCHDOWN) {
    const q = p / TOUCHDOWN
    // Gravity: slow off the peak, fast into the table.
    return 1 - q * q
  }
  if (p < BOUNCE_END) {
    return BOUNCE_RISE * Math.sin(((p - TOUCHDOWN) / (BOUNCE_END - TOUCHDOWN)) * Math.PI)
  }
  return 0
}

/**
 * The smallest angle at least `minTurns` whole turns forward of `from` that
 * still reads as `canonical` — whole turns never change which face shows, so
 * the tumble can always spin forward from wherever the cube happens to sit,
 * even if a cancelled roll left it at some odd mid-flight angle.
 */
function turnPast(from: number, canonical: number, minTurns: number): number {
  let target = canonical + 360 * minTurns
  while (target < from + 360 * minTurns) target += 360
  return target
}

// The throw's three easings: airborne (barely decelerating — nothing slows a
// die in flight), rollout (friction bleeding the spin off), and the settle's
// overshoot-and-return. Channels are shaped per-frame from a linear progress
// value, so the fall can accelerate while the spin decelerates in one leg.
const flightEase = cubicBezier(0.2, 0.5, 0.7, 0.85)
const rolloutEase = cubicBezier(0.1, 0.6, 0.2, 1)
const settleEase = cubicBezier(0.34, 1.56, 0.64, 1)

const FACES: readonly SpinValue[] = [1, 2, 3, 4, 5, 6]

/**
 * One printed face of the cube — the same moulded-plastic drawing the flat
 * die had, now stamped six times. The gradients are shared through the first
 * face's defs: SVG resolves `url(#…)` document-wide, and every face wants
 * the identical material anyway.
 */
function FaceArt({ value, withDefs }: { value: SpinValue; withDefs: boolean }): ReactElement {
  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className={styles.faceArt} aria-hidden="true">
      {withDefs && (
        <defs>
          <linearGradient id="dice-face" x1="0" y1="0" x2="0.35" y2="1">
            <stop offset="0%" stopColor="#fffdf7" />
            <stop offset="46%" stopColor="#fdf4e2" />
            <stop offset="100%" stopColor="#e6d3ae" />
          </linearGradient>
          {/* Lit from *below* centre: a drilled well is concave, so the lamp
              overhead shades its top and catches its lower bowl — the
              opposite of the dome a top-lit gradient would print. */}
          <radialGradient id="dice-pip" cx="50%" cy="74%" r="80%">
            <stop offset="0%" stopColor="#6d5c40" />
            <stop offset="100%" stopColor="var(--ink)" />
          </radialGradient>
        </defs>
      )}

      {/* The lip: the cut edge of the moulding, showing under the face. */}
      <rect x={4} y={8} width={SIZE - 8} height={SIZE - 8} rx={CORNER} className={styles.lip} />
      <rect
        x={4}
        y={4}
        width={SIZE - 8}
        height={SIZE - 8}
        rx={CORNER}
        fill="url(#dice-face)"
        stroke="var(--ink)"
        strokeWidth={3.5}
      />
      {/* Inner top highlight — the lit top face of a domed moulding. */}
      <rect
        x={10}
        y={10}
        width={SIZE - 20}
        height={SIZE - 20}
        rx={CORNER - 6}
        className={styles.emboss}
      />

      {pipsFor(value).map(([x, y]) => {
        const cx = 4 + x * (SIZE - 8)
        const cy = 4 + y * (SIZE - 8)
        return (
          <g key={`${x}-${y}`}>
            {/* Drilled, not printed: the cut edge shades the face just
                above the hole, the bowl catches the light just below it,
                and the disc between them is lit from underneath. */}
            <circle cx={cx} cy={cy - 1.2} r={PIP_RADIUS + 0.5} className={styles.pipRim} />
            <circle cx={cx} cy={cy + 1.5} r={PIP_RADIUS} className={styles.pipWell} />
            <circle cx={cx} cy={cy} r={PIP_RADIUS} fill="url(#dice-pip)" className={styles.pip} />
          </g>
        )
      })}
    </svg>
  )
}

/**
 * The die: a real moulded plastic cube, pressed to throw it.
 *
 * Six faces in actual 3D — `preserve-3d`, each face rotated to its side of
 * the cube and pushed out by half its depth — so a throw tumbles edge over
 * edge with visible depth instead of a flat square pretending. The faces are
 * placed by `FACE_PLACEMENTS` and the landing angle by `SETTLE_ROTATIONS`,
 * both checked by a test that rotates the actual normals, because opposite
 * faces summing to 7 is the kind of thing players notice broken on sight.
 *
 * The press target never moves: the button stays docked, and the cube flies
 * out of it — up over the board, down with a bounce, rolling out the last
 * turn back at the dock — so the next roll is always exactly where the last
 * one was. The cast shadow is a separate layer that stays on the table and
 * shrinks under the cube at the peak, the same trick `Pawn` uses for hops,
 * and the specular sheen stays put too: the lamp is above the table, not
 * glued to the die.
 */
export function Dice({
  result,
  disabled = false,
  onRoll,
  onRollComplete,
  autoRollToken = 0,
  rollDuration = 0.85,
  settleDuration = 0.32,
  compact = false,
}: DiceProps): ReactElement {
  const audio = useAudio()
  const reduceMotion = usePrefersReducedMotion()
  const rotX = useMotionValue(0)
  const rotY = useMotionValue(0)
  const throwX = useMotionValue(0)
  const throwY = useMotionValue(0)
  const lift = useMotionValue(0)
  const squash = useMotionValue(1)
  const [rolling, setRolling] = useState(false)
  const [landed, setLanded] = useState<SpinValue | null>(null)
  // Bumped on every press. `result` alone cannot drive the animation: the
  // store legitimately reports the same number twice in a row, and keying on
  // the value would then never re-run the effect, never call
  // `onRollComplete`, and freeze the play loop.
  const [rollToken, setRollToken] = useState(0)
  const armedRef = useRef(false)
  const lastTumbleRef = useRef(0)

  // The flight offsets are percentages of the cube's own size, so the same
  // throw scales from a 64px phone dock to the full-size modal die.
  const throwXPct = useTransform(throwX, (v) => `${v}%`)
  const throwYPct = useTransform(throwY, (v) => `${v}%`)
  // The shadow stays on the table under the cube's ground track, shrinking
  // and fading as the throw peaks — `Pawn` sells its hops the same way.
  const shadowScale = useTransform(lift, (v) => 1 - 0.55 * v)
  const shadowOpacity = useTransform(lift, (v) => 1 - 0.65 * v)

  useEffect(() => {
    if (!armedRef.current || result === null) return
    armedRef.current = false

    const [restRX, restRY] = SETTLE_ROTATIONS[result]
    const fromRX = rotX.get()
    const fromRY = rotY.get()
    const targetRX = turnPast(fromRX, restRX, TUMBLE_X_TURNS)
    const targetRY = turnPast(fromRY, restRY, TUMBLE_Y_TURNS)

    setRolling(true)
    setLanded(null)

    if (reduceMotion) {
      rotX.set(restRX)
      rotY.set(restRY)
      throwX.set(0)
      throwY.set(0)
      lift.set(0)
      squash.set(1)
      setRolling(false)
      setLanded(result)
      audio.playSfx('spinStop')
      onRollComplete()
      return
    }

    let cancelled = false
    let active: AnimationPlaybackControls | null = null

    /**
     * One leg of the throw: a plain 0→1 progress value with every channel —
     * spin, travel, height — written per-frame from it, the same way `Pawn`
     * drives its hops. Completion is what the play loop waits on, so it is
     * worth taking the shape that is already proven here rather than
     * depending on how a `MotionValue` target settles its own promise.
     */
    const runLeg = (duration: number, write: (p: number) => void) =>
      new Promise<void>((resolve) => {
        active = animate(0, 1, {
          duration,
          ease: 'linear',
          onUpdate: write,
          onComplete: () => {
            write(1)
            resolve()
          },
        })
      })

    // A tick every quarter turn, which is what a tumbling die actually does:
    // the deceleration is already in the rollout easing, so the ticks slow
    // with the spin for free rather than needing a timer of their own. The
    // faces themselves need no flicker any more — the cube's own geometry
    // shows whatever is passing the camera.
    lastTumbleRef.current = Math.floor(rotX.get() / 90)
    const unsubscribe = rotX.on('change', (latest) => {
      const quarter = Math.floor(latest / 90)
      if (quarter !== lastTumbleRef.current) {
        lastTumbleRef.current = quarter
        audio.playSfx('spin')
      }
    })

    const arc = compact ? THROW_ARC.board : THROW_ARC.modal
    // The final full X turn is saved for the table: a die that finishes all
    // its spinning in the air lands dead, and reads placed rather than rolled.
    const flightRX = targetRX - 360
    const fromX = throwX.get()
    const fromY = throwY.get()

    const run = async (): Promise<void> => {
      // The throw proper: airborne, spinning on both axes at once, barely
      // decelerating — nothing up there slows a die. This is also the whole
      // of the Y corkscrew, so everything after touchdown is the pure
      // edge-over-edge tumble a die actually rolling on a surface has.
      await runLeg(rollDuration * FLIGHT_SHARE, (p) => {
        const e = flightEase(p)
        rotX.set(fromRX + (flightRX - fromRX) * e)
        rotY.set(fromRY + (targetRY - fromRY) * e)
        throwX.set(fromX + (arc.x - fromX) * e)
        throwY.set(fromY + (arc.y - fromY) * e)
        lift.set(e)
      })
      if (cancelled) return
      // Down again: gravity quickens the fall to touchdown, one small bounce
      // dies out, and the last turn rolls off against friction as the cube
      // tracks back into the dock — so it always comes to rest exactly where
      // the next press expects to find it.
      await runLeg(rollDuration * (1 - FLIGHT_SHARE), (p) => {
        const e = rolloutEase(p)
        rotX.set(flightRX + (targetRX + OVERSHOOT_DEG - flightRX) * e)
        throwX.set(arc.x * (1 - e))
        const height = descentHeight(p)
        throwY.set(arc.y * height)
        lift.set(height)
      })
      if (cancelled) return
      unsubscribe()
      // The die is down and showing what it rolled; the bounce that follows
      // is it settling onto that face rather than still deciding.
      await runLeg(settleDuration, (p) => {
        rotX.set(targetRX + OVERSHOOT_DEG * (1 - settleEase(p)))
        squash.set(1 + SETTLE_SQUASH * Math.sin(p * Math.PI))
      })
      if (cancelled) return
      // Whole turns all cancel out, so rest is restated in canonical degrees
      // — the next roll never inherits an ever-growing angle.
      rotX.set(restRX)
      rotY.set(restRY)
      squash.set(1)
      setRolling(false)
      setLanded(result)
      audio.playSfx('spinStop')
      onRollComplete()
    }
    void run()

    return () => {
      cancelled = true
      active?.stop()
      unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result, rollToken])

  const handleRoll = (): void => {
    if (disabled || rolling) return
    audio.playSfx('confirm')
    armedRef.current = true
    setRollToken((token) => token + 1)
    onRoll()
  }

  // A computer seat pulls the same lever a person does, one render after the
  // parent decides it is time. `handleRoll` guards the disabled/rolling cases
  // itself, so a stray bump can never start a second roll.
  const lastAutoRollRef = useRef(autoRollToken)
  useEffect(() => {
    if (autoRollToken === lastAutoRollRef.current) return
    lastAutoRollRef.current = autoRollToken
    handleRoll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRollToken])

  const ready = !disabled && !rolling
  const label = rolling ? 'Rolling…' : landed === null ? 'Roll' : `Roll — last roll ${landed}`

  return (
    <div className={[styles.wrap, compact ? styles.compact : ''].filter(Boolean).join(' ')}>
      <button
        type="button"
        className={[styles.die, rolling ? styles.rolling : '', ready ? styles.ready : '']
          .filter(Boolean)
          .join(' ')}
        onClick={handleRoll}
        disabled={disabled || rolling}
        aria-label={label}
      >
        <motion.span
          className={styles.castShadow}
          style={{ x: throwXPct, scale: shadowScale, opacity: shadowOpacity }}
          aria-hidden="true"
        />

        {/* The 3D stage. Pointer-transparent, deliberately: mid-flight the
            cube crosses board tiles the player must stay able to pan, and the
            press target is the docked button itself, never the flying body. */}
        <div className={styles.scene} aria-hidden="true">
          <motion.div
            className={styles.cube}
            style={{ x: throwXPct, y: throwYPct, rotateX: rotX, rotateY: rotY, scale: squash }}
            data-shown-face={rolling ? undefined : (landed ?? 1)}
          >
            {FACES.map((value) => {
              const [px, py] = FACE_PLACEMENTS[value]
              return (
                <div
                  key={value}
                  className={styles.face}
                  data-face={value}
                  // Out to its side of the cube: half the cube's own width,
                  // which `50cqw` reads off the scene's size container — the
                  // one way CSS can say "half of me" to a translateZ.
                  style={{ transform: `rotateX(${px}deg) rotateY(${py}deg) translateZ(50cqw)` }}
                >
                  <FaceArt value={value} withDefs={value === 1} />
                </div>
              )
            })}
          </motion.div>
        </div>

        {/* Fixed specular sweep — the lamp above the table, which does not
            travel with the die however far it turns. It fades while the cube
            is airborne and off catching different light entirely. */}
        <span className={styles.sheen} aria-hidden="true" />
      </button>

      {/* The drawing is one image to assistive technology, so the number it
          came to rest on is stated in words rather than left inside it. */}
      <p className="visually-hidden" role="status">
        {landed === null ? '' : `Rolled a ${landed}`}
      </p>
    </div>
  )
}
