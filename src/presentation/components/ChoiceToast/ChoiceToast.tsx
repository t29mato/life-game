import type { ReactElement } from 'react'
import { motion } from 'framer-motion'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'
import styles from './ChoiceToast.module.css'

export interface ChoiceToastProps {
  /** The label of the option the player actually picked. */
  readonly label: string
}

/**
 * "✓ Walk on by" — a small tick that outlives the card it was pressed on.
 *
 * Choosing an option used to produce nothing at all: the bank's card vanished
 * and the next player's turn was on screen, with no moment anywhere in
 * between that belonged to the choice. Declining something is the worst case
 * of it, because declining changes no money and gains no tile, so there is
 * genuinely nothing else on screen that could confirm the press landed.
 *
 * Two beats answer that, and this is the second: the card itself holds the
 * chosen option lit and alone for `TEMPO.choiceConfirmMs` (see
 * `DecisionModal`), and then this rides over the board for a moment after
 * play has already carried on. Deliberately *after*: a confirmation the game
 * waits out is just a second card.
 */
export function ChoiceToast({ label }: ChoiceToastProps): ReactElement {
  const reduceMotion = usePrefersReducedMotion()

  return (
    <motion.div
      className={styles.toast}
      role="status"
      initial={reduceMotion ? false : { opacity: 0, y: 16, scale: 0.86 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 480, damping: 26 }}
    >
      <span className={styles.tick} aria-hidden="true">
        ✓
      </span>
      <span className={styles.label}>{label}</span>
    </motion.div>
  )
}
