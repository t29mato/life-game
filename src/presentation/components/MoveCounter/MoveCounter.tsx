import type { ReactElement } from 'react'
import { motion } from 'framer-motion'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'
import { useUi } from '../../i18n/LocaleProvider'
import styles from './MoveCounter.module.css'

export interface MoveCounterProps {
  /** Spaces the mover still has to travel. */
  readonly spacesLeft: number
}

/**
 * How much further the car is going, counted down as it goes.
 *
 * A player watching a pawn hop had no way to know whether it was nearly
 * there or barely started without counting the hops themselves — and since a
 * move now stops partway to deal a card, "how far is left" stopped being
 * something you could read off the number rolled either. So the board says
 * it: the roll's own distance the moment the die lands, one less every time
 * the car sets down, and nought when it is parked.
 *
 * It counts *spaces*, not hops of the current leg, so a pause on a
 * swept-past tile ticks straight through rather than restarting.
 */
export function MoveCounter({ spacesLeft }: MoveCounterProps): ReactElement {
  const reduceMotion = usePrefersReducedMotion()
  const t = useUi()

  return (
    // The tab pops up from the die below it the moment the roll lands, rather
    // than blinking into existence: it is part of the throw's payoff, and
    // things on this table arrive with weight.
    <motion.div
      className={styles.chip}
      role="status"
      aria-label={t.moveCounter.aria(spacesLeft)}
      initial={reduceMotion ? false : { scale: 0.6, opacity: 0, y: 10 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 430, damping: 22 }}
    >
      {/* Keyed on the number so each tick is its own entrance: the punch is
          what makes a countdown read as counting rather than as a label that
          happens to change. */}
      <motion.span
        key={spacesLeft}
        className={styles.count}
        initial={reduceMotion ? false : { scale: 1.45, opacity: 0.35 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 520, damping: 18, mass: 0.6 }}
        aria-hidden="true"
      >
        {spacesLeft}
      </motion.span>
      <span className={styles.label} aria-hidden="true">
        {t.moveCounter.toGo}
      </span>
    </motion.div>
  )
}
