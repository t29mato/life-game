import { type ReactElement } from 'react'
import { motion } from 'framer-motion'
import type { Decision, SpinValue } from '@domain/model/types'
import { useModalFocusTrap } from '../../hooks/useModalFocusTrap'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'
import { Spinner } from '../Spinner/Spinner'
import styles from './EventSpinModal.module.css'

export interface EventSpinModalProps {
  /** The event's own value-spin decision — named stakes, one Spin option. */
  readonly decision: Decision
  readonly result: SpinValue | null
  readonly onSpin: () => void
  readonly onSpinComplete: () => void
  readonly autoSpinToken: number
}

/**
 * Where an event-driven spin lands — tuition, a promotion review, a
 * marriage proposal, career choice, the joint account. The tile the pawn
 * is standing on has nothing to do with any of these; the movement roll
 * that gets a pawn from one tile to the next is the only spin that does,
 * which is why that one stays beside the board and this one does not. A
 * question with no bearing on where the pawn sits gets the middle of the
 * screen instead, the same way the choice cards already do.
 */
export function EventSpinModal({
  decision,
  result,
  onSpin,
  onSpinComplete,
  autoSpinToken,
}: EventSpinModalProps): ReactElement {
  const containerRef = useModalFocusTrap<HTMLDivElement>()
  const reduceMotion = usePrefersReducedMotion()
  const stakes = decision.options[0]?.description || decision.prompt

  const entrance = reduceMotion
    ? { initial: { opacity: 1 }, animate: { opacity: 1 }, transition: { duration: 0 } }
    : {
        initial: { opacity: 0, scale: 0.86, y: 34 },
        animate: { opacity: 1, scale: 1, y: 0 },
        transition: { type: 'spring' as const, stiffness: 380, damping: 26, mass: 0.9 },
      }

  return (
    <div className={styles.backdrop}>
      <motion.div
        ref={containerRef}
        className={styles.card}
        role="dialog"
        aria-modal="true"
        aria-labelledby="event-spin-prompt"
        initial={entrance.initial}
        animate={entrance.animate}
        transition={entrance.transition}
      >
        <header className={styles.header}>
          <span className={styles.kind}>The wheel</span>
          <h2 id="event-spin-prompt" className={styles.prompt}>
            {decision.prompt}
          </h2>
          <p className={styles.stakes}>{stakes}</p>
        </header>

        <Spinner
          result={result}
          disabled={false}
          onSpin={onSpin}
          onSpinComplete={onSpinComplete}
          autoSpinToken={autoSpinToken}
        />
      </motion.div>
    </div>
  )
}
