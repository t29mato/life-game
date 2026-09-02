import { useEffect, type CSSProperties, type ReactElement } from 'react'
import { motion } from 'framer-motion'
import type { EditionId, LandingEvent } from '@domain/model/types'
import { editionFor } from '@domain/edition/registry'
import { formatMoneyDelta } from '../../format'
import { GameIcon } from '../../icons/GameIcon'
import { useAudio } from '../../hooks/useAudio'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'
import styles from './PassingPop.module.css'

export interface PassingPopProps {
  /** The tile the car has just driven over, already resolved by the store. */
  readonly event: LandingEvent
  readonly editionId?: EditionId
}

/**
 * What a tile the car merely *passed over* looks like now: a chip that pops
 * on the board, says what happened and how much it was worth, and gets out of
 * the way on its own.
 *
 * It replaces a full modal card with a Continue button, which is what every
 * passed tile used to get (v1.15.0). That card was not a mistake — it fixed a
 * real complaint, that a tuition bill collected three tiles back was folded
 * silently into whatever different tile the car finally stopped on, with no
 * way to tell the two apart. The tile is still named, still shown, still
 * priced, and still gets its own line in the log; what it no longer gets is
 * *the game's whole attention and a press*. A five-tile move that crossed
 * three paydays and a life tile asked for four dismissals; it now asks for
 * none, and the landing card carries the aggregate as a footnote
 * (`passedSummary.ts`).
 *
 * Deliberately not a dialog and not focus-trapped: nothing here is waiting on
 * anybody. It is `role="status"`, so assistive tech hears it the same way a
 * sighted player reads it — in passing, without being stopped.
 */
export function PassingPop({ event, editionId }: PassingPopProps): ReactElement {
  const audio = useAudio()
  const reduceMotion = usePrefersReducedMotion()
  const { currency } = editionFor(editionId)
  const hasMoney = event.moneyDelta !== 0

  // The same coin the card played, kept: money changing hands is the one
  // thing about a passed tile a player might otherwise miss entirely now
  // that nothing stops to tell them about it.
  useEffect(() => {
    if (!hasMoney) return
    audio.playSfx(event.moneyDelta >= 0 ? 'coinGain' : 'coinLose')
  }, [event, hasMoney, audio])

  const toneVars = {
    '--pop-tone-bg': `var(--tone-${event.tone}-bg)`,
    '--pop-tone-ink': `var(--tone-${event.tone}-ink)`,
    '--pop-tone-edge': `var(--tone-${event.tone}-edge)`,
  } as CSSProperties

  return (
    // The tone vars ride on a `display: contents` holder rather than on the
    // motion element itself: framer-motion's `style` typing is stricter than
    // React's and rejects a bare `CSSProperties` under
    // `exactOptionalPropertyTypes`. `EventCard` puts them on its backdrop for
    // the identical reason; there is no backdrop here, so the holder is one
    // that costs no layout.
    <div className={styles.holder} style={toneVars}>
    <motion.div
      className={styles.pop}
      role="status"
      initial={reduceMotion ? false : { opacity: 0, scale: 0.7, y: 22 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 460, damping: 24 }}
    >
      <span className={styles.emblem} aria-hidden="true">
        <GameIcon name={event.icon} size={26} />
      </span>
      <span className={styles.body}>
        <span className={styles.title}>{event.title}</span>
        {hasMoney ? (
          <span
            className={`${styles.amount} tabular-num ${
              event.moneyDelta > 0 ? styles.amountUp : styles.amountDown
            }`}
          >
            {formatMoneyDelta(event.moneyDelta, currency)}
          </span>
        ) : (
          // A passed tile that moved no money still has to say *something*,
          // or the pop is a title with an empty space under it. Its own
          // one-line story is what the card used to lead with.
          <span className={styles.note}>{event.narration ?? event.description}</span>
        )}
      </span>
    </motion.div>
    </div>
  )
}
