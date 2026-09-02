import { useEffect, useRef, useState, type ReactElement } from 'react'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'
import styles from './RollingNumber.module.css'

export interface RollingNumberProps {
  readonly value: number
  /** How to render the numeric value, e.g. `formatMoney`. */
  readonly format?: (value: number) => string
  /** Optional wrapper class. Accepts `undefined` so CSS-module lookups can be passed straight through. */
  readonly className?: string | undefined
  /** Duration of a full roll, in seconds. */
  readonly duration?: number
}

/** Stable default so it never destabilises the animation effect's deps. */
function defaultFormat(n: number): string {
  return String(Math.round(n))
}

/** How far the digits are thrown, as a fraction of their own type size. */
const KICK_EM = 0.34

/**
 * A number that counts up or down to `value` whenever it changes. A gain is
 * thrown upwards and flashes green; a loss drops and flashes red, so the two
 * are told apart from across the room without reading the digits.
 */
export function RollingNumber({
  value,
  format = defaultFormat,
  className,
  duration = 0.7,
}: RollingNumberProps): ReactElement {
  const reduceMotion = usePrefersReducedMotion()
  const motionValue = useMotionValue(value)
  const rounded = useTransform(motionValue, (latest) => format(latest))
  /*
   * The kick is measured in `em`, not pixels.
   *
   * It used to be a flat 9px, which is a modest nudge under the event card's
   * 2.4rem money plate and a leap clean out of the player strip's pill under
   * its 0.98rem wallet — mid-count values were reported rendering *below* the
   * frame that was supposed to contain them. Tying the travel to the type
   * size makes one number describe both: the same gesture, in proportion to
   * whatever is being thrown.
   */
  const kick = useMotionValue(0)
  const y = useTransform(kick, (latest) => `${latest}em`)
  const scale = useMotionValue(1)
  const [display, setDisplay] = useState(format(value))
  /*
   * How wide the box is held while the digits turn, in characters.
   *
   * Counting from $10,000 to $85,194 passes through $9,999 — one character
   * narrower — and the pill around it resized on every digit gained or lost,
   * which is what pushed mid-count values outside their own frame on the
   * player strip. Both endpoints are measured rather than just the target,
   * because a count *down* is widest where it starts, and the figure is kept
   * in state rather than recomputed per render: `setDisplay` re-renders this
   * component on every frame of the roll, and by then the previous value has
   * already been forgotten. `ch` under `tabular-nums` is the digit advance,
   * so this over-reserves slightly for the symbol and the separators — the
   * right direction to be wrong in, since the one job is never to shrink.
   */
  const [reserved, setReserved] = useState(() => format(value).length)
  const [flash, setFlash] = useState<'up' | 'down' | null>(null)
  const previousValue = useRef(value)
  const flashTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // `format`/`duration` are read fresh via ref so a caller passing an inline
  // function or literal never destabilises the animation effect below.
  const latestFormat = useRef(format)
  latestFormat.current = format
  const latestDuration = useRef(duration)
  latestDuration.current = duration

  useEffect(() => {
    const unsubscribe = rounded.on('change', (latest) => setDisplay(latest))
    return unsubscribe
  }, [rounded])

  useEffect(() => {
    const previous = previousValue.current
    if (previous === value) return
    previousValue.current = value

    const rising = value > previous
    setReserved(Math.max(latestFormat.current(previous).length, latestFormat.current(value).length))
    setFlash(rising ? 'up' : 'down')
    clearTimeout(flashTimeout.current)
    flashTimeout.current = setTimeout(() => setFlash(null), 900)

    if (reduceMotion) {
      motionValue.set(value)
      setDisplay(latestFormat.current(value))
      return undefined
    }

    // The digits get kicked in the direction the money moved, then spring
    // back — the physical part of the roll.
    kick.set(rising ? KICK_EM : -KICK_EM)
    scale.set(rising ? 1.14 : 0.92)
    const thrown = animate(kick, 0, { type: 'spring', stiffness: 420, damping: 16 })
    const punch = animate(scale, 1, { type: 'spring', stiffness: 380, damping: 14 })
    const controls = animate(motionValue, value, {
      duration: latestDuration.current,
      ease: [0.16, 1, 0.3, 1],
      // Belt and braces: whatever the tween's last emitted frame rounded to,
      // a completed roll must land on the exact target so the display can
      // never settle one dollar short (or long). `onComplete` only fires when
      // the animation finishes on its own — `controls.stop()` below (an
      // interruption or unmount) skips it, so a superseded roll never stamps
      // a stale value over the animation that replaced it.
      onComplete: () => {
        motionValue.set(value)
        setDisplay(latestFormat.current(value))
      },
    })
    return () => {
      controls.stop()
      thrown.stop()
      punch.stop()
    }
  }, [value, reduceMotion, motionValue, kick, scale])

  return (
    <motion.span
      className={[
        styles.number,
        flash === 'up' ? styles.flashUp : '',
        flash === 'down' ? styles.flashDown : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ y, scale, minWidth: `${reserved}ch` }}
      aria-live="polite"
    >
      {display}
    </motion.span>
  )
}
