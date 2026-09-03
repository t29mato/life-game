import { useEffect, useState, type ReactElement } from 'react'
import { motion } from 'framer-motion'
import type { RollTableRow, SpinValue } from '@domain/model/types'
import { useModalFocusTrap } from '../../hooks/useModalFocusTrap'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'
import { TEMPO } from '../../tempo'
import { Dice } from '../Dice/Dice'
import { RollTable } from '../RollTable/RollTable'
import styles from './EventSpinModal.module.css'

export interface EventSpinModalProps {
  /** What the roll is for — the tile's own name, or the decision's prompt. */
  readonly prompt: string
  /** One line on what is riding on it, read before the die is thrown. */
  readonly stakes: string
  /**
   * The die's own outcome table — see `DecisionOption.table`. Rendered as an
   * actual table beneath `stakes`, which is why `stakes` should never repeat
   * what a row here already says.
   */
  readonly table?: readonly RollTableRow[] | undefined
  readonly result: SpinValue | null
  readonly onSpin: () => void
  readonly onSpinComplete: () => void
  /** Bumped by the shell to throw the die for a computer seat. */
  readonly autoSpinToken?: number
  /**
   * The hidden roll behind a tile the move only swept past, replayed on the
   * number it already produced — as opposed to an ordinary roll a player
   * pressed for directly. Only affects the header's wording; whether a press
   * is actually required is `unattended`'s job, and the two are independent —
   * a computer seat still throws a *landed* tile's roll unattended, and a
   * person still presses a *passed* tile's roll for themselves.
   */
  readonly passedThrough?: boolean
  /**
   * True when nobody is going to press this: a computer seat's own turn, on
   * either kind of roll. The die throws itself the moment it is on screen
   * rather than waiting on a click nobody is going to make.
   */
  readonly unattended?: boolean
}

/**
 * Where an event-driven roll lands — tuition, a promotion review, a
 * marriage proposal, career choice, the joint account. It shows the same die
 * the movement roll does, deliberately: one object and one contract, so a
 * player never has to learn a second way of asking the game for a number.
 * What differs is only where it sits. The tile the pawn is standing on has
 * nothing to do with any of these, so this one gets the middle of the screen
 * with its stakes written above it, the same way the choice cards already do.
 *
 * It covers a passed-through tile's roll too — a move swept past it, and its
 * own die already turned inside `applyPassedEvent` — and the player deserves
 * to watch that land rather than read the number off the card afterwards.
 * Same object, same die, same place on the screen; only a computer seat gets
 * to skip the press, on either kind of roll.
 */
export function EventSpinModal({
  prompt,
  stakes,
  table,
  result,
  onSpin,
  onSpinComplete,
  autoSpinToken = 0,
  passedThrough = false,
  unattended = false,
}: EventSpinModalProps): ReactElement {
  const containerRef = useModalFocusTrap<HTMLDivElement>()
  const reduceMotion = usePrefersReducedMotion()

  /*
   * The throw for a roll nobody was asked for, made through the very
   * `autoRollToken` a computer seat's own roll already goes through — one
   * arming path, not two, so the die can never be handed a result it was
   * never told to expect. `Dice` reacts to a *change* in that token rather
   * than to its value, which is why it is raised from an effect after mount
   * instead of arriving already raised; raising it to the same 1 again is a
   * no-op React bails out of, so the die is thrown exactly once however
   * often this re-renders.
   */
  const [selfToken, setSelfToken] = useState(0)
  useEffect(() => {
    if (unattended) setSelfToken(1)
  }, [unattended])

  /*
   * The card pops in *after* the board's own dock has faded out, rather than
   * crossfading through it — see `TEMPO.overlayHandoverMs`. The delay is on
   * the reduced-motion branch too: the ordering is not motion, it is which
   * one thing the screen is showing, and a reduced-motion player is owed
   * that answer just as clearly.
   */
  const handover = TEMPO.overlayHandoverMs / 1000
  const entrance = reduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0, delay: handover } }
    : {
        initial: { opacity: 0, scale: 0.86, y: 34 },
        animate: { opacity: 1, scale: 1, y: 0 },
        transition: {
          type: 'spring' as const,
          stiffness: 380,
          damping: 26,
          mass: 0.9,
          delay: handover,
        },
      }

  return (
    <div className={styles.backdrop}>
      <motion.div
        ref={containerRef}
        className={styles.card}
        // The card that holds a die, named so a test can ask whether the die
        // is on screen without matching on prose. Its "Passing through" label
        // is the same phrase the card that follows it wears, deliberately —
        // one name for one thing — so the words alone cannot tell them apart.
        data-testid="event-spin"
        role="dialog"
        aria-modal="true"
        aria-labelledby="event-spin-prompt"
        initial={entrance.initial}
        animate={entrance.animate}
        transition={entrance.transition}
      >
        {/* The reading half, and the only half that scrolls — see `.reading`.
            The die below is deliberately outside it, because a thrown die
            leaves its own box and a scroll container would crop it. */}
        <div className={styles.reading}>
          <header className={styles.header}>
            {/* Named for what it is: a tile driven over is not a tile stopped
                at, and a player who never chose to stop here should be told
                why a die is turning for them — whether they are the one
                throwing it or, on a computer seat, only watching it land. */}
            <span className={styles.kind}>{passedThrough ? 'Passing through' : 'The die'}</span>
            <h2 id="event-spin-prompt" className={styles.prompt}>
              {prompt}
            </h2>
            <p className={styles.stakes}>{stakes}</p>
          </header>

          {/* What each face is actually worth, as rows — a player scans this
              once and knows exactly what to hope for, instead of parsing it
              back out of a sentence the way `stakes` alone used to ask them
              to. Only ever present alongside a real breakdown; most rolls
              (a single threshold, a flat rate) have nothing to tabulate. */}
          {table && table.length > 0 ? <RollTable rows={table} /> : null}
        </div>

        {/* The die is the whole point of this card, so it is also its A
            button: focus lands on it as the card opens and Space or Enter
            throws it, without the player first having to find it with the
            mouse. Nobody is pressing an unattended throw, so it claims
            neither focus nor the keys. */}
        <div className={styles.dieBay}>
          <Dice
            result={result}
            disabled={false}
            onRoll={onSpin}
            onRollComplete={onSpinComplete}
            autoRollToken={unattended ? selfToken : autoSpinToken}
            primary={!unattended}
          />
        </div>
      </motion.div>
    </div>
  )
}
