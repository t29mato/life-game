import type { ReactElement } from 'react'
import { motion } from 'framer-motion'
import type { SpinValue } from '@domain/model/types'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'
import { TEMPO } from '../../tempo'
import styles from './RollFlight.module.css'

export interface RollFlightProps {
  /** The number the die came to rest on. */
  readonly value: SpinValue
}

/**
 * The rolled number, leaving the die and travelling up over the car.
 *
 * This is the answer to a rule rather than a decoration: **the gap between a
 * result and the game acting on it must never be still.** The gap here is
 * small now — the die reports and the car sets off in the same frame — but
 * "small" is a measurement that can rot, and a moving hand-off is the version
 * that cannot. It also does something the die alone could not: it carries the
 * number *away from the die*, towards where the car and the "N TO GO" counter
 * are, so the roll visibly becomes the distance instead of being a fact left
 * lying on the table for the player to connect up themselves.
 *
 * Under reduced motion it does not render at all. There is nothing here but
 * the motion — the number it carries is on the die's own face and in the hop
 * counter it flies towards, both still there, both still readable — so a
 * still version of this would be a third copy of the same digit and nothing
 * else. The parent clears it after `TEMPO.rollFlightSeconds`.
 */
export function RollFlight({ value }: RollFlightProps): ReactElement | null {
  const reduceMotion = usePrefersReducedMotion()
  if (reduceMotion) return null

  return (
    <motion.span
      className={styles.chip}
      aria-hidden="true"
      initial={{ opacity: 0, scale: 0.5, y: 26 }}
      animate={{ opacity: [0, 1, 1, 0], scale: [0.5, 1.18, 1, 0.9], y: [26, -6, -40, -64] }}
      transition={{ duration: TEMPO.rollFlightSeconds, times: [0, 0.22, 0.62, 1], ease: 'easeOut' }}
    >
      {value}
    </motion.span>
  )
}
