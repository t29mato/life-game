import { useEffect, useRef, useState, type ReactElement } from 'react'
import { animate, motion, useMotionValue, useTransform, type AnimationPlaybackControls } from 'framer-motion'
import type { SpinValue } from '@domain/model/types'
import { useAudio } from '../../hooks/useAudio'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'
import { useUi } from '../../i18n/LocaleProvider'
import { usePrimaryAction } from '../../hooks/usePrimaryAction'
import { TEMPO } from '../../tempo'
import { SEGMENT_DEGREES, createWheelSpin, faceAtAngle, tickerBend } from './wheelPhysics'
import styles from './Wheel.module.css'

export interface WheelProps {
  /** The face to come to rest on. Set by the parent once the store has
   *  resolved a spin — the wheel is driven *to* it and never decides it. */
  readonly result: SpinValue | null
  readonly disabled?: boolean
  /** Fired when the player presses the wheel. */
  readonly onSpin: () => void
  /** Fired once the wheel has come to a standstill on `result`. */
  readonly onSpinComplete: () => void
  /**
   * Bump this to make the wheel spin as though it had been pressed. A computer
   * seat takes its turn through here, so its spin looks exactly like a
   * person's rather than the number simply appearing.
   */
  readonly autoSpinToken?: number
  /**
   * Nominal seconds for one spin. The realised figure varies a little with how
   * far round the rim this particular flick has to travel — see
   * `TEMPO.wheelSpinSeconds` for why a wheel is allowed to be slower than the
   * die it replaced, and `wheelPhysics.ts` for what the time is spent on.
   */
  readonly spinDuration?: number
  /**
   * Sized down for the board tray, where the wheel sits over a map that needs
   * the room. `EventSpinModal` has no board to protect: a spin with no bearing
   * on the board's tiles gets the full-size wheel at any width.
   */
  readonly compact?: boolean
  /**
   * True while this wheel is the one thing the screen is waiting for. It then
   * takes focus and answers Space and Enter from anywhere on the page — see
   * `usePrimaryAction`. False for a wheel that is merely on screen: the
   * board's while a modal is up, or a computer seat's own spin.
   */
  readonly primary?: boolean
  /**
   * Change this to retire the last spin's result and hand the wheel to a new
   * turn.
   *
   * The board's wheel is a single object that outlives every turn taken with
   * it, and `result` is whatever the store last spun — so a new player used to
   * arrive at a die still showing the previous player's 6 and read it as
   * theirs (issue #23). A wheel cannot be blanked the way a die could be
   * turned face-down: its ticker is always resting in *some* segment, and
   * pretending otherwise would be a lie about a physical object. So what is
   * cleared is the claim rather than the position — the winning segment stops
   * being lit, the announcement stops naming a number, and the wheel sits
   * where the last spin left it, exactly as the real thing does on a table.
   *
   * A key that changes while the wheel is actually turning is ignored — the
   * spin in flight owns the wheel until it stops.
   */
  readonly resetKey?: string | null
}

/** Where the pointer rests before anything has been spun: the middle of the
 *  first segment, so the wheel starts as a wheel rather than balanced on a peg. */
const START_ANGLE = SEGMENT_DEGREES / 2

/**
 * How far the ticker swings when a peg is directly under it. Enough that the
 * blade is unmistakably shoved off the peg rather than merely leaning on it:
 * at this angle the tip travels about twice a peg's own width.
 */
const MAX_BEND_DEGREES = 19

/** viewBox units. The disc sits low in its box to leave room above it for the
 *  ticker's bracket and a blade long enough to read as something that bends —
 *  a stubby one just looks like a printed arrow. */
const CENTRE_X = 50
const CENTRE_Y = 54
const RIM = 40
const PEG_RADIUS = 2.6

const FACES: readonly SpinValue[] = [1, 2, 3, 4, 5, 6]

/**
 * One face's colour. Six distinct ones, the way a spinner in a box actually
 * looks — and it earns its keep here: the segment a player is hoping for is
 * findable at a glance while the wheel is still turning, which is the whole
 * mechanism behind "it's nearly on the six".
 */
const FACE_COLOURS: Readonly<Record<SpinValue, string>> = {
  1: 'var(--candy-sky)',
  2: 'var(--candy-mint)',
  3: 'var(--candy-sun)',
  4: 'var(--candy-tangerine)',
  5: 'var(--candy-bubblegum)',
  6: 'var(--candy-grape)',
}

/** A point on the rim, `degrees` clockwise from the top. */
function rim(degrees: number, radius: number): readonly [number, number] {
  const r = (degrees * Math.PI) / 180
  return [CENTRE_X + radius * Math.sin(r), CENTRE_Y - radius * Math.cos(r)]
}

/** The pie slice for one face, drawn clockwise from the top. */
function wedgePath(face: SpinValue): string {
  const [x0, y0] = rim((face - 1) * SEGMENT_DEGREES, RIM)
  const [x1, y1] = rim(face * SEGMENT_DEGREES, RIM)
  return `M ${CENTRE_X} ${CENTRE_Y} L ${x0} ${y0} A ${RIM} ${RIM} 0 0 1 ${x1} ${y1} Z`
}

/**
 * The wheel: a six-segment spinner with a flexible ticker riding its pegs.
 *
 * Pressed once, flicked once, and then left alone — everything after the press
 * is a wheel running out of energy. `wheelPhysics.ts` owns that: drag plus
 * friction for the long ritardando, and a potential barrier at every peg for
 * the click, the snap, and the stall. The ticker's bend is read straight off
 * the wheel's angle, so the blade cannot disagree with what the rim is doing;
 * on a spin that dies right against a peg it is held bent, straining, while
 * the wheel creeps — and then either scrapes over or is pushed back off it.
 *
 * The number is not this component's to choose. The store has already spun
 * (`SpinValue`); `createWheelSpin` is handed that value and *solves for the
 * launch speed* whose free run stops in that segment, so nothing is corrected
 * mid-flight, nothing overshoots and snaps back, and the last thing the player
 * watches is a genuine deceleration rather than a scripted arrival. What is
 * announced at the end is read back off the wheel's own resting angle
 * (`faceAtAngle`), not off the prop — if the two ever disagreed, the test that
 * checks this would say so rather than the screen quietly lying.
 */
export function Wheel({
  result,
  disabled = false,
  onSpin,
  onSpinComplete,
  autoSpinToken = 0,
  spinDuration = TEMPO.wheelSpinSeconds,
  compact = false,
  primary = false,
  resetKey = null,
}: WheelProps): ReactElement {
  const audio = useAudio()
  const reduceMotion = usePrefersReducedMotion()
  const t = useUi()
  const angle = useMotionValue(START_ANGLE)
  const bend = useMotionValue(0)
  const [spinning, setSpinning] = useState(false)
  const [landed, setLanded] = useState<SpinValue | null>(null)
  // Bumped on every press. `result` alone cannot drive the animation: the
  // store legitimately reports the same number twice in a row, and keying on
  // the value would then never re-run the effect, never call
  // `onSpinComplete`, and freeze the play loop.
  const [spinToken, setSpinToken] = useState(0)
  const armedRef = useRef(false)

  // The disc is drawn with face 1 starting at the top and running clockwise,
  // so turning it *back* by the wheel's angle sweeps the pointer forwards
  // through 1, 2, 3… — a count that climbs towards the six rather than away
  // from it, which is the number everybody is watching for.
  const discRotation = useTransform(angle, (a) => -a)
  // The rim under the ticker is therefore travelling *leftwards*, and a blade
  // being dragged leftwards by a peg swings clockwise about a mount above it —
  // so the bend is positive. Getting this sign wrong is not subtle: the ticker
  // leans into the oncoming peg instead of being shoved aside by it.
  const tickerRotation = useTransform(bend, (b) => b * MAX_BEND_DEGREES)

  useEffect(() => {
    if (!armedRef.current || result === null) return
    armedRef.current = false

    setSpinning(true)
    setLanded(null)

    /** Come to rest, announce it, and hand the turn back. Shared by both
     *  branches below so a reduced-motion spin ends the same way a full one
     *  does — on the wheel's own angle, never on the prop. */
    const settle = (restAngle: number): void => {
      // Whole turns cancel out, so rest is restated inside one revolution and
      // the next spin never inherits an ever-growing angle. Invisible: the
      // wheel is standing still, and a rotation differs from it by a turn.
      const canonical = ((restAngle % 360) + 360) % 360
      angle.set(canonical)
      bend.set(tickerBend(canonical))
      setSpinning(false)
      setLanded(faceAtAngle(canonical))
      audio.playSfx('spinStop')
      onSpinComplete()
    }

    if (reduceMotion) {
      // No suspense to have, so none is mimed: the wheel is simply standing in
      // the middle of the segment the store named. A dwell would be honest
      // here; a fake deceleration would not.
      settle((result - 1) * SEGMENT_DEGREES + SEGMENT_DEGREES / 2)
      return
    }

    const spin = createWheelSpin({
      fromAngle: angle.get(),
      result,
      targetSeconds: spinDuration,
    })

    let cancelled = false
    let nextClick = 0
    const controls: AnimationPlaybackControls = animate(0, 1, {
      duration: spin.duration,
      ease: 'linear',
      onUpdate: (p) => {
        const seconds = p * spin.duration
        const now = spin.angleAt(seconds)
        angle.set(now)
        bend.set(tickerBend(now))
        // One click per peg the ticker has actually passed, off the schedule
        // the physics recorded — so the intervals widen with the wheel for
        // free, rather than from a timer that would have to be told to.
        while (nextClick < spin.clickTimes.length && spin.clickTimes[nextClick]! <= seconds) {
          nextClick += 1
          audio.playSfx('spin')
        }
      },
      onComplete: () => {
        if (cancelled) return
        settle(spin.restAngle)
      },
    })

    return () => {
      cancelled = true
      controls.stop()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result, spinToken])

  const handleSpin = (): void => {
    if (disabled || spinning) return
    audio.playSfx('confirm')
    armedRef.current = true
    setSpinToken((token) => token + 1)
    onSpin()
  }

  /*
   * The A button, when this wheel is what the screen is waiting for: focus
   * lands here the moment it becomes pressable, and Space *or* Enter spins it
   * from anywhere on the page. Held back while the wheel is turning or
   * disabled — `handleSpin` would refuse anyway, but a focus ring on a dead
   * control is a lie about what the next press will do.
   */
  const primaryRef = usePrimaryAction<HTMLButtonElement>(primary && !disabled && !spinning)

  /*
   * A new turn retires the last one's result. The wheel does not move — see
   * `resetKey` — but the lit segment goes out and the announcement stops
   * naming a number that was never this player's.
   *
   * Guarded on `spinning` rather than on the arming flag: a key that lands
   * mid-spin (a turn that opened while the previous spin was still running)
   * must not blank the result the wheel is about to report.
   */
  const lastResetKeyRef = useRef(resetKey)
  useEffect(() => {
    if (resetKey === lastResetKeyRef.current) return
    lastResetKeyRef.current = resetKey
    if (spinning || armedRef.current) return
    setLanded(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey])

  // A computer seat pulls the same lever a person does, one render after the
  // parent decides it is time. `handleSpin` guards the disabled/spinning cases
  // itself, so a stray bump can never start a second spin.
  const lastAutoSpinRef = useRef(autoSpinToken)
  useEffect(() => {
    if (autoSpinToken === lastAutoSpinRef.current) return
    lastAutoSpinRef.current = autoSpinToken
    handleSpin()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSpinToken])

  const ready = !disabled && !spinning
  const label = spinning ? t.wheel.spinning : landed === null ? t.wheel.spin : t.wheel.spinWithLast(landed)
  /*
   * Waiting for a press, and saying so. Only while this wheel is genuinely the
   * screen's next input: a wheel that is merely on screen (the board's, under
   * a modal) must not advertise a key that would not reach it.
   */
  const waiting = ready && primary
  /** The segment lit as this player's result — none at all until a spin of
   *  their own has stopped in one. */
  const won = spinning ? null : landed

  return (
    <div
      className={[styles.wrap, compact ? styles.compact : ''].filter(Boolean).join(' ')}
      /* What the ticker is actually resting in, for the tests that hold this
         component to the domain's answer. Written from the wheel's settled
         angle, so it is the drawing's opinion and not the prop's. */
      data-landed={landed ?? ''}
    >
      <button
        ref={primaryRef}
        type="button"
        className={[
          styles.wheel,
          ready ? styles.ready : '',
          // Only once a spin of this player's own has stopped somewhere: it is
          // what lets the winning wedge be lit *against* the other five,
          // rather than the whole wheel sitting permanently dimmed. A turning
          // wheel is never settled, so it needs no state of its own here —
          // `won` is null throughout the spin.
          won !== null ? styles.settled : '',
        ]
          .filter(Boolean)
          .join(' ')}
        onClick={handleSpin}
        disabled={disabled || spinning}
        aria-label={label}
      >
        {/* The disc. Its own layer so the ticker above can stay still while
            this turns, and pointer-transparent so the press target is the
            whole button rather than whichever wedge happens to be under the
            finger. */}
        <motion.div className={styles.disc} style={{ rotate: discRotation }} aria-hidden="true">
          <svg viewBox="0 0 100 100" className={styles.art}>
            {/* Fixed ids, and safe ones: SVG resolves `url(#…)` document-wide,
                so two wheels on screen at once (the board's under a modal's)
                share whichever came first — and they want the identical
                material anyway. */}
            <defs>
              <radialGradient id="wheel-face" cx="38%" cy="30%" r="82%">
                <stop offset="0%" stopColor="rgba(255,255,255,0.35)" />
                <stop offset="62%" stopColor="rgba(255,255,255,0)" />
                <stop offset="100%" stopColor="rgba(0,0,0,0.18)" />
              </radialGradient>
              <radialGradient id="wheel-hub" cx="36%" cy="30%" r="76%">
                <stop offset="0%" stopColor="#fffdf7" />
                <stop offset="100%" stopColor="#cbb98f" />
              </radialGradient>
            </defs>

            {/* The card the segments are printed on, showing as a lip. */}
            <circle cx={CENTRE_X} cy={CENTRE_Y} r={RIM + 2.4} className={styles.lip} />

            {/* The segment that was actually won is lit on the disc itself.
                A spinner's ticker is always resting in *some* segment, so the
                one this player earned has to say so rather than leaving the
                board to be read like a die that never got turned over. */}
            {FACES.map((face) => (
              <path
                key={face}
                d={wedgePath(face)}
                fill={FACE_COLOURS[face]}
                className={[styles.wedge, face === won ? styles.wonWedge : ''].filter(Boolean).join(' ')}
              />
            ))}

            {/* Lit from the upper left, once, over the whole disc — printed
                board, not six separately shaded ones. */}
            <circle cx={CENTRE_X} cy={CENTRE_Y} r={RIM} fill="url(#wheel-face)" />
            <circle cx={CENTRE_X} cy={CENTRE_Y} r={RIM} className={styles.rimRing} />

            {FACES.map((face) => {
              const centre = (face - 1) * SEGMENT_DEGREES + SEGMENT_DEGREES / 2
              return (
                <text
                  key={face}
                  x={CENTRE_X}
                  y={CENTRE_Y - RIM * 0.62}
                  transform={`rotate(${centre} ${CENTRE_X} ${CENTRE_Y})`}
                  className={[styles.numeral, face === won ? styles.wonNumeral : '']
                    .filter(Boolean)
                    .join(' ')}
                  data-face={face}
                >
                  {face}
                </text>
              )
            })}

            {/* The pegs the ticker rides. One per boundary, standing proud of
                the rim, because they are the thing the whole feeling is made
                of — every click, every stall and every snap happens at one. */}
            {FACES.map((face) => {
              const [x, y] = rim((face - 1) * SEGMENT_DEGREES, RIM)
              return (
                <g key={face}>
                  <circle cx={x} cy={y + 0.7} r={PEG_RADIUS} className={styles.pegShadow} />
                  <circle cx={x} cy={y} r={PEG_RADIUS} className={styles.peg} />
                  <circle cx={x - 0.7} cy={y - 0.8} r={PEG_RADIUS * 0.4} className={styles.pegLight} />
                </g>
              )
            })}

            <circle cx={CENTRE_X} cy={CENTRE_Y} r={9} fill="url(#wheel-hub)" className={styles.hub} />
            <circle cx={CENTRE_X} cy={CENTRE_Y} r={2.4} className={styles.pin} />
          </svg>
        </motion.div>

        {/* The ticker, mounted above the wheel and pointing down into the
            pegs. It rotates about its own bracket — `transform-origin` in
            `.ticker` — and its angle is a pure function of where the rim is,
            so it bends against a peg, holds while the wheel strains, and
            snaps as the peg goes under. */}
        <motion.div className={styles.ticker} style={{ rotate: tickerRotation }} aria-hidden="true">
          <svg viewBox="0 0 100 100" className={styles.art}>
            <path d="M 46.6 2 L 53.4 2 L 51.4 15.6 Q 50 18.4 48.6 15.6 Z" className={styles.blade} />
            <path d="M 47.9 3.6 L 49.5 3.6 L 49 14.4 Q 48.5 15.4 48.1 14.3 Z" className={styles.bladeLight} />
            <rect x={44.4} y={0} width={11.2} height={4.4} rx={2.2} className={styles.bracket} />
          </svg>
        </motion.div>

      </button>

      {/* How to spin it, under the wheel. Small and quiet — an invitation, not
          a label — and only present while this wheel is genuinely the screen's
          next input, so it can never advertise a press that would not reach
          it. `aria-hidden` because the button's own name already carries this
          for anyone not reading the screen. */}
      {waiting && (
        <p className={styles.prompt} aria-hidden="true">
          <span className={styles.promptKey}>{t.wheel.spaceKey}</span>
          <span className={styles.promptSlash}> / </span>
          <span className={styles.promptClick}>{t.wheel.clickToSpin}</span>
          <span className={styles.promptTap}>{t.wheel.tapToSpin}</span>
        </p>
      )}

      {/* The drawing is one image to assistive technology, so the segment the
          ticker came to rest in is stated in words rather than left inside it. */}
      <p className="visually-hidden" role="status">
        {landed === null ? '' : t.wheel.landedOn(landed)}
      </p>
    </div>
  )
}
