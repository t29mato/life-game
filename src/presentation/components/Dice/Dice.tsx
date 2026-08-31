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
import { createDiceThrow } from './dicePhysics'
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
  /**
   * Nominal seconds for the throw — launch, flight and every bounce. The
   * realised figure strays under a fifth either way with the randomised
   * launch; small values still force a fast run for tests. The default is
   * unhurried on purpose: the throw is slow enough to read faces off
   * mid-tumble, because a roll nobody can follow has no suspense in it.
   */
  readonly rollDuration?: number
  /**
   * Base seconds for the corrective settle onto the rolled face, scaled by
   * how far the die still has to tip when the bouncing dies out. Overridable
   * for tests.
   */
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

/** Full corkscrew turns about Y — all spent airborne, none in the bounces. */
const TUMBLE_Y_TURNS = 1
/** How far below rest the settle dips — plastic compressing on impact. */
const SETTLE_SQUASH = -0.055
/** Squash a full-speed impact costs, shrinking with each softer bounce. */
const BOUNCE_SQUASH = 0.09
/** Seconds one impact's compression takes to relax. */
const SQUASH_PULSE = 0.09
/**
 * The settle's length as multiples of `settleDuration`: a floor for a die
 * that grounds nearly square, plus time in proportion to the tip still owed
 * — so however far the physics happened to leave the cube from its resting
 * angle, the last roll runs at about the tumbling speed it grounded with,
 * never a flick to catch up nor a crawl to kill time.
 */
const SETTLE_TIME_FLOOR = 0.35
const SETTLE_TIME_PER_TURN = 2.2
/**
 * A grounding die is still turning at several hundred degrees a second; a
 * settle owed less than this cannot absorb that and reads as a dead stop.
 * Such a throw takes one more whole turn instead — the same face, one last
 * unhurried tip-over.
 */
const MIN_SETTLE_GAP = 60

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

/**
 * Where the skid leaves the die, as a share of the arc's reach. It used to
 * slide all the way home before the number showed — which read as the table
 * snatching the die back to centre right at the reveal. Now the result comes
 * up wherever the throw actually ended: visibly off to one side, but capped
 * near half the die's own width, so the settled cube still lies over the
 * docked press target and the next press is where the eye already is.
 */
const REST_DRIFT_MIN = 0.28
const REST_DRIFT_SPREAD = 0.14

/**
 * The glide home after the reveal: how long the number is left to be read
 * where the die stopped, then the unhurried slide back under the button.
 * Purely cosmetic and strictly after the fact — `onRollComplete` fired the
 * moment the face showed, so the shell is already moving on. A die about to
 * be unmounted (an event modal closing over it) simply never reaches the
 * glide, and a press mid-glide launches from wherever the slide had got to.
 */
const RETURN_DELAY = 0.9
const RETURN_DURATION = 0.5

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

// Height and tumble come off the simulation now, but the channels the die is
// not honestly simulating still want shaping: the outward travel (fast off
// the hand, drifting at the apex), the skid (friction bleeding the slide
// off), the settle's slight tip past the resting angle and back, and the
// glide home after the reveal — eased both ways, because nothing is throwing
// the die by then and a hard start would read as a yank. The settle curve
// starts at about half its average speed — the momentum a grounding die
// still carries — rather than the old snap-to curve's kick.
const flightEase = cubicBezier(0.2, 0.5, 0.7, 0.85)
const rolloutEase = cubicBezier(0.1, 0.6, 0.2, 1)
const settleEase = cubicBezier(0.3, 0.6, 0.55, 1.25)
const returnEase = cubicBezier(0.45, 0.05, 0.25, 1)

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
 * The throw is a real simulation (`dicePhysics.ts`): gravity, restitution
 * and contact friction stepped frame by frame, so the die bounces several
 * times, each smaller than the last, a little differently every roll. The
 * number is not simulated — the store already rolled it — so once the
 * bouncing dies out, the settle closes the last part-turn onto the exact
 * resting angle, at the speed the tumble grounded with.
 *
 * The press target never moves: the button stays docked, and the cube flies
 * out of it — up over the board, down through its bounces, skidding to rest
 * a little to one side, where the throw actually carried it. The number
 * comes up there, never at a centre the table dragged it back to; the drift
 * is capped so the settled cube still lies over the button's own box, and
 * once the result has been read the die glides home on its own, so the next
 * roll is back exactly where the last press was. The cast shadow is a
 * separate layer that stays on the table and
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
  rollDuration = 1.4,
  settleDuration = 0.42,
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
    // The settle's return from its overshoot crosses backwards over ground it
    // just ticked on — so the ticks stop the moment the target is reached,
    // idempotently, since the cleanup below also calls this on cancellation.
    let ticksStopped = false
    const stopTicks = (): void => {
      if (ticksStopped) return
      ticksStopped = true
      unsubscribe()
    }

    const arc = compact ? THROW_ARC.board : THROW_ARC.modal
    const fromX = throwX.get()
    const fromY = throwY.get()
    const fromLift = lift.get()

    // The throw itself: dealt fresh each roll, so no two are quite alike.
    // See `dicePhysics.ts` — the simulation owns height and tumble; the
    // exact resting angle stays this component's job, after.
    const throwSim = createDiceThrow(rollDuration)

    // Where the skid leaves the die resting, dealt per throw like the
    // launch itself — a little different every roll, never past the drift
    // cap that keeps the settled cube over the press target.
    const restX = arc.x * (REST_DRIFT_MIN + REST_DRIFT_SPREAD * Math.random())

    const run = async (): Promise<void> => {
      // The physics leg, launch to flat on the table: gravity, restitution
      // and contact friction integrated frame by frame, with the Y corkscrew
      // finishing inside the launch arc so everything after first touchdown
      // is the pure edge-over-edge tumble a die on a surface actually has.
      // Travel is the one dishonest channel — the cube skids back across its
      // bounces, but only as far as `restX`: the number comes up where the
      // throw ended, not at a dock the table dragged it back to.
      let simTime = 0
      let impactAt = -1
      let impactMag = 0
      await runLeg(throwSim.duration, (p) => {
        const t = p * throwSim.duration
        const frame = throwSim.step(t - simTime)
        simTime = t
        const out = flightEase(frame.flightProgress)
        const back = rolloutEase(frame.returnProgress)
        rotX.set(fromRX + frame.spinAngle)
        rotY.set(fromRY + (targetRY - fromRY) * out)
        const ground = fromX + (arc.x - fromX) * out
        throwX.set(ground + (restX - ground) * back)
        // The `fromY`/`fromLift` carryovers only matter to a roll restarted
        // mid-flight: they walk a cube caught in the air back down as the
        // new launch rises, instead of teleporting it to the table first.
        throwY.set(arc.y * frame.height + fromY * (1 - out))
        lift.set(Math.min(1, frame.height + fromLift * (1 - out)))
        if (frame.impact > 0) {
          impactAt = t
          impactMag = frame.impact
        }
        if (impactAt >= 0) {
          // Plastic compressing on contact, hardest at the first touchdown
          // and fainter each bounce — the impact's own speed sets the depth.
          const pulse = (t - impactAt) / SQUASH_PULSE
          squash.set(pulse < 1 ? 1 - BOUNCE_SQUASH * impactMag * Math.sin(pulse * Math.PI) : 1)
        }
      })
      if (cancelled) return
      // The handoff: the bouncing has died out, and wherever the simulation
      // left the cube, `turnPast` gives the nearest forward angle that reads
      // as the rolled number — under one turn away, closed at roughly the
      // tumbling speed the die grounded with, tipping slightly past and
      // back. The seam is invisible because nothing at it changes: angle
      // continuous, spin unhurried, ticks still counting the quarters.
      const settleFrom = rotX.get()
      let gap = turnPast(settleFrom, restRX, 0) - settleFrom
      if (gap < MIN_SETTLE_GAP) gap += 360
      await runLeg(settleDuration * (SETTLE_TIME_FLOOR + (SETTLE_TIME_PER_TURN * gap) / 360), (p) => {
        const e = settleEase(p)
        rotX.set(settleFrom + gap * e)
        if (e >= 1) stopTicks()
        squash.set(1 + SETTLE_SQUASH * Math.sin(p * Math.PI))
      })
      if (cancelled) return
      stopTicks()
      // Whole turns all cancel out, so rest is restated in canonical degrees
      // — the next roll never inherits an ever-growing angle.
      rotX.set(restRX)
      rotY.set(restRY)
      squash.set(1)
      setRolling(false)
      setLanded(result)
      audio.playSfx('spinStop')
      onRollComplete()
      // The number has been read where the throw ended; only now does the
      // die glide back under the button, a separate unhurried motion so the
      // next press has a predictable, centred target again. The wait is a
      // leg like any other so the same cleanup that cancels a mid-air roll
      // cancels a pending glide — and a fresh press during either simply
      // launches from wherever the die happens to be.
      await runLeg(RETURN_DELAY, () => {})
      if (cancelled) return
      const homeFrom = throwX.get()
      await runLeg(RETURN_DURATION, (p) => {
        throwX.set(homeFrom * (1 - returnEase(p)))
      })
    }
    void run()

    return () => {
      cancelled = true
      active?.stop()
      stopTicks()
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
