import { useEffect, useRef, useState, type ReactElement } from 'react'
import { animate, motion, useMotionValue, type AnimationPlaybackControls } from 'framer-motion'
import type { SpinValue } from '@domain/model/types'
import { useAudio } from '../../hooks/useAudio'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'
import { UiIcon } from '../../icons/ui'
import { WEDGE_ANGLE, WEDGE_COUNT, landingRotation, wedgeCenterAngle } from './spinnerMath'
import styles from './Spinner.module.css'

export interface SpinnerProps {
  /** The value to land on. Set by the parent once the store has resolved a spin. */
  readonly result: SpinValue | null
  readonly disabled?: boolean
  /** Fired when the player presses the spin control. */
  readonly onSpin: () => void
  /** Fired once the wheel has fully settled on `result`. */
  readonly onSpinComplete: () => void
  /**
   * Bump this to make the wheel spin as though it had been pressed. A computer
   * seat takes its turn through here, so its spin looks exactly like a
   * person's rather than the number simply appearing.
   */
  readonly autoSpinToken?: number
  /** Seconds for the fast decelerating leg. Overridable for tests. */
  readonly spinDuration?: number
  /** Seconds for the overshoot-settle bounce. Overridable for tests. */
  readonly settleDuration?: number
  /**
   * The desktop rail sits beside a board on every width, phone included —
   * on a phone specifically, the board above it is what actually needs the
   * screen, so the wheel gives up some of its own size on a narrow viewport
   * to protect it. `EventSpinModal` has no board to protect: a spin with no
   * bearing on the board's tiles gets the full-size wheel at any width.
   */
  readonly compact?: boolean
}

const WEDGE_COLORS = [
  'var(--candy-coral)',
  'var(--candy-tangerine)',
  'var(--candy-sun)',
  'var(--candy-mint)',
  'var(--candy-sky)',
  'var(--candy-grape)',
  'var(--candy-bubblegum)',
  'var(--candy-coral-dark)',
  'var(--candy-sky-dark)',
  'var(--candy-mint-dark)',
]

const RADIUS = 100
const CENTER = 110
const OVERSHOOT_DEG = 10
const SPIN_TURNS = 6

/** Fine index marks engraved around the fixed outer bezel. */
const BEZEL_TICKS = Array.from({ length: 40 }, (_, i) => i * 9)

function clockToPoint(clockDeg: number, radius: number): { x: number; y: number } {
  const rad = ((clockDeg - 90) * Math.PI) / 180
  return { x: CENTER + radius * Math.cos(rad), y: CENTER + radius * Math.sin(rad) }
}

function wedgePath(index: number): string {
  const n = (index + 1) as SpinValue
  const center = wedgeCenterAngle(n)
  const start = clockToPoint(center - WEDGE_ANGLE / 2, RADIUS)
  const end = clockToPoint(center + WEDGE_ANGLE / 2, RADIUS)
  return `M${CENTER},${CENTER} L${start.x.toFixed(2)},${start.y.toFixed(2)} A${RADIUS},${RADIUS} 0 0,1 ${end.x.toFixed(2)},${end.y.toFixed(2)} Z`
}

/**
 * The ten-wedge spinner wheel. Owns its own spin trigger; the parent supplies
 * the eventual `result` once the store has committed to one, and this
 * component takes care of making the landing feel physical.
 *
 * Rendered in three stacked layers so the lighting stays put while the wheel
 * turns: the rotating enamelled disc, a fixed bezel carrying the specular
 * highlight and index marks, and the metal hub with the pointer above it.
 */
export function Spinner({
  result,
  disabled = false,
  onSpin,
  onSpinComplete,
  autoSpinToken = 0,
  spinDuration = 2.2,
  settleDuration = 0.5,
  compact = false,
}: SpinnerProps): ReactElement {
  const audio = useAudio()
  const reduceMotion = usePrefersReducedMotion()
  const rotationMV = useMotionValue(0)
  const [spinning, setSpinning] = useState(false)
  const [landed, setLanded] = useState<SpinValue | null>(null)
  // Bumped on every press. `result` alone cannot drive the animation: the
  // store legitimately reports the same number twice in a row, and keying on
  // the value would then never re-run the effect, never call
  // `onSpinComplete`, and freeze the play loop.
  const [spinToken, setSpinToken] = useState(0)
  const armedRef = useRef(false)
  const baselineRef = useRef(0)
  const lastWedgeRef = useRef(0)

  useEffect(() => {
    if (!armedRef.current || result === null) return
    armedRef.current = false

    const baseTurns = Math.floor(baselineRef.current / 360) + SPIN_TURNS
    const target = landingRotation(result, baseTurns)
    setSpinning(true)
    setLanded(null)

    if (reduceMotion) {
      rotationMV.set(target)
      baselineRef.current = target
      setSpinning(false)
      setLanded(result)
      audio.playSfx('spinStop')
      onSpinComplete()
      return
    }

    lastWedgeRef.current = Math.floor(rotationMV.get() / WEDGE_ANGLE)
    const unsubscribe = rotationMV.on('change', (latest) => {
      const wedge = Math.floor(latest / WEDGE_ANGLE)
      if (wedge !== lastWedgeRef.current) {
        lastWedgeRef.current = wedge
        audio.playSfx('spin')
      }
    })

    let cancelled = false
    let active: AnimationPlaybackControls | null = null

    /**
     * Animates a plain 0→1 progress value and writes the rotation itself, the
     * same way `Pawn` drives its hops. Completion is what the play loop waits
     * on, so it is worth taking the shape that is already proven here rather
     * than depending on how a `MotionValue` target settles its own promise.
     */
    const turnTo = (to: number, duration: number, ease: [number, number, number, number]) =>
      new Promise<void>((resolve) => {
        const from = rotationMV.get()
        active = animate(0, 1, {
          duration,
          ease,
          onUpdate: (progress) => rotationMV.set(from + (to - from) * progress),
          onComplete: () => {
            rotationMV.set(to)
            resolve()
          },
        })
      })

    const run = async (): Promise<void> => {
      await turnTo(target + OVERSHOOT_DEG, spinDuration, [0.12, 0.72, 0.28, 1])
      if (cancelled) return
      await turnTo(target, settleDuration, [0.34, 1.56, 0.64, 1])
      if (cancelled) return
      unsubscribe()
      baselineRef.current = target
      setSpinning(false)
      setLanded(result)
      audio.playSfx('spinStop')
      onSpinComplete()
    }
    void run()

    return () => {
      cancelled = true
      active?.stop()
      unsubscribe()
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

  // A computer seat pulls the same lever a person does, one render after the
  // parent decides it is time. `handleSpin` guards the disabled/spinning cases
  // itself, so a stray bump can never start a second wheel.
  const lastAutoSpinRef = useRef(autoSpinToken)
  useEffect(() => {
    if (autoSpinToken === lastAutoSpinRef.current) return
    lastAutoSpinRef.current = autoSpinToken
    handleSpin()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSpinToken])

  const ready = !disabled && !spinning
  const hubLabel = spinning ? 'Spinning…' : 'Spin'
  const caption = spinning ? 'Spinning…' : ready ? 'Tap the wheel to spin' : ''

  return (
    <div className={[styles.wrap, compact ? styles.compact : ''].filter(Boolean).join(' ')}>
      <div
        className={[styles.wheelBox, spinning ? styles.spinning : '', ready ? styles.ready : '']
          .filter(Boolean)
          .join(' ')}
      >
        <motion.svg
          viewBox="0 0 220 220"
          className={styles.wheel}
          style={{ rotate: rotationMV }}
          role="img"
          aria-label={landed ? `Spinner landed on ${landed}` : 'Spinner wheel'}
        >
          <defs>
            <radialGradient id="spinner-dome" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fff" stopOpacity="0.34" />
              <stop offset="42%" stopColor="#fff" stopOpacity="0.06" />
              <stop offset="74%" stopColor="#000" stopOpacity="0" />
              <stop offset="100%" stopColor="#000" stopOpacity="0.26" />
            </radialGradient>
          </defs>

          {Array.from({ length: WEDGE_COUNT }, (_, i) => (
            <path
              key={`wedge-${i + 1}`}
              d={wedgePath(i)}
              fill={WEDGE_COLORS[i]}
              stroke="rgba(255,255,255,0.55)"
              strokeWidth={1.6}
            />
          ))}

          {/* Lit outer band: the top face of the moulding catching the light. */}
          <circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS - 6}
            fill="none"
            stroke="rgba(255,255,255,0.24)"
            strokeWidth={11}
          />
          {/* Domed gloss — radial, so it reads identically at any rotation. */}
          <circle cx={CENTER} cy={CENTER} r={RADIUS} fill="url(#spinner-dome)" />

          {Array.from({ length: WEDGE_COUNT }, (_, i) => {
            const n = (i + 1) as SpinValue
            const angle = wedgeCenterAngle(n)
            const labelPoint = clockToPoint(angle, RADIUS * 0.7)
            return (
              <text
                key={`label-${n}`}
                x={labelPoint.x}
                y={labelPoint.y}
                // Printed radially, like a real disc — which means the wedge
                // the pointer lands on always comes to rest perfectly upright.
                transform={`rotate(${angle} ${labelPoint.x.toFixed(2)} ${labelPoint.y.toFixed(2)})`}
                textAnchor="middle"
                dominantBaseline="middle"
                className={styles.wedgeLabel}
                fill="#fff"
                stroke="rgba(28,20,60,0.4)"
                strokeWidth={3}
                paintOrder="stroke"
              >
                {n}
              </text>
            )
          })}
        </motion.svg>

        <svg viewBox="0 0 220 220" className={styles.bezel} aria-hidden="true">
          <defs>
            <linearGradient id="spinner-rim" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fff" stopOpacity="0.85" />
              <stop offset="38%" stopColor="#fff" stopOpacity="0.25" />
              <stop offset="62%" stopColor="#000" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#000" stopOpacity="0.38" />
            </linearGradient>
            <radialGradient id="spinner-spec" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fff" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#fff" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* The bezel: a moulded ring around the disc. */}
          <circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS + 4}
            fill="none"
            stroke="var(--ink)"
            strokeWidth={11}
          />
          <circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS + 4}
            fill="none"
            stroke="url(#spinner-rim)"
            strokeWidth={11}
          />

          {BEZEL_TICKS.map((angle) => {
            const major = angle % 45 === 0
            const outer = clockToPoint(angle, RADIUS + 8)
            const inner = clockToPoint(angle, RADIUS + (major ? 0 : 3))
            return (
              <line
                key={`tick-${angle}`}
                x1={outer.x}
                y1={outer.y}
                x2={inner.x}
                y2={inner.y}
                stroke={major ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.42)'}
                strokeWidth={major ? 2.4 : 1.2}
                strokeLinecap="round"
              />
            )
          })}

          {/* Fixed specular sweep — the lamp above the table. */}
          <ellipse
            cx={78}
            cy={62}
            rx={58}
            ry={30}
            fill="url(#spinner-spec)"
            transform="rotate(-30 78 62)"
          />
        </svg>

        {/* The wheel used to be flanked by its own "Spin" button — now the
            hub itself is the button, the way the real board game's dial
            works: press the middle to make it turn. `type="button"` so it
            can never masquerade as a form submit if this ever ends up
            inside one. */}
        <button
          type="button"
          className={styles.hub}
          onClick={handleSpin}
          disabled={disabled || spinning}
          aria-label={hubLabel}
        >
          {landed === null ? (
            <UiIcon name="dice" size={18} className={styles.hubGlyph} key="idle" aria-hidden="true" />
          ) : (
            <span className={styles.hubValue} key={landed} aria-hidden="true">
              {landed}
            </span>
          )}
        </button>

        <div className={styles.pointer} aria-hidden="true">
          <svg viewBox="0 0 44 54" className={styles.pointerArt}>
            <defs>
              <linearGradient id="spinner-needle" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="var(--candy-coral-dark)" />
                <stop offset="34%" stopColor="var(--candy-coral)" />
                <stop offset="52%" stopColor="#fff" stopOpacity="0.85" />
                <stop offset="70%" stopColor="var(--candy-coral)" />
                <stop offset="100%" stopColor="var(--candy-coral-dark)" />
              </linearGradient>
            </defs>
            <path
              d="M22 52 L5 20 A17 17 0 1 1 39 20 Z"
              fill="var(--candy-coral-dark)"
              transform="translate(0 3)"
              opacity="0.55"
            />
            <path
              d="M22 52 L5 20 A17 17 0 1 1 39 20 Z"
              fill="url(#spinner-needle)"
              stroke="var(--ink)"
              strokeWidth={2.5}
              strokeLinejoin="round"
            />
            <circle cx={22} cy={17} r={5} fill="var(--ink)" opacity="0.35" />
            <circle cx={22} cy={16} r={4.5} fill="#fff" opacity="0.9" />
          </svg>
        </div>
      </div>

      {/* A sighted hint that the wheel itself is what you press — the old
          button used to say this in words; the wheel has to say it now. */}
      <p className={styles.caption} aria-hidden="true">
        {caption}
      </p>
    </div>
  )
}
