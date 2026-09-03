import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactElement } from 'react'
import { motion } from 'framer-motion'
import type { EditionId, LandingEvent } from '@domain/model/types'
import { editionFor } from '@domain/edition/registry'
import { formatMoney, formatMoneyDelta, formatOrdinal } from '../../format'
import { GameIcon } from '../../icons/GameIcon'
import { useAudio } from '../../hooks/useAudio'
import { useModalFocusTrap } from '../../hooks/useModalFocusTrap'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'
import { usePrimaryAction } from '../../hooks/usePrimaryAction'
import { TEMPO } from '../../tempo'
import { ChunkyButton } from '../ChunkyButton/ChunkyButton'
import { RollingNumber } from '../RollingNumber/RollingNumber'
import { Confetti } from '../Confetti/Confetti'
import { CoinBurst, TransferLane } from '../CoinFlight/CoinFlight'
import { CareerPlaque } from '../CareerPlaque/CareerPlaque'
import { isCareerIcon } from '../CareerPlaque/families'
import { summarizePassedEvents } from './passedSummary'
import styles from './EventCard.module.css'

export interface EventCardProps {
  readonly event: LandingEvent
  /** Dismissing the card always ends the turn. */
  readonly onDismiss: () => void
  /** Which edition's money the delta is printed in. Defaults to the original board. */
  readonly editionId?: EditionId
  /**
   * Fired once this card's own count-up has landed on the balance it was
   * rolling towards — B4's other half.
   *
   * The HUD behind the card reads the store directly, so it used to print
   * the final figure while the card's digits were still turning: the result
   * spoiled by the very strip the count-up was building suspense for. The
   * card is the one thing that knows when its number has actually settled,
   * so it says so, and the strip waits to be told. Not called at all on a
   * card that moved no money — there is nothing to wait for.
   */
  readonly onMoneyLanded?: () => void

  /**
   * Everything the car drove over on the way to this tile, in the order it
   * drove over them. Each of these already had its say on the board as a
   * `PassingPop`; this is the receipt, aggregated by tile so three paydays
   * read as one line. Never the tile this card is about — only what was
   * passed *on the way* — and absent entirely on a card that ended a move
   * nothing was passed on, which is most of them.
   */
  readonly passedThrough?: readonly LandingEvent[]

  /**
   * Which of the game's four cards this is.
   *
   * A playtester could only tell them apart by a small, faint English label —
   * "PASSING THROUGH", "LIFE MILESTONE", "THE DIE" — because the cards were
   * otherwise the same object. They are not any more: a tile only driven past
   * gets a smaller, lighter card that slides up from below, a landing gets the
   * standard one, a milestone keeps its gold and its confetti, and a question
   * put to the player is the purple `DecisionModal`. The label stays, but by
   * the time it is read the shape has already answered.
   */
  readonly variant?: 'landing' | 'passing'
}

// Cards from before `emphasis` existed still tint gold for a milestone —
// keep honouring that so nothing already tagged that way goes quiet.
const MILESTONE_TONES = new Set(['gold'])
const REVEAL_DELAY = 240
/**
 * A card that both charged the player and borrowed for them is read in two
 * beats, so the balance waits for both to have been said. The rows animate in
 * at 0.14s and 0.42s (see `.beatPaid`/`.beatBorrowed` in the stylesheet); the
 * wallet starts moving once the second one has landed, which is the whole
 * point — the player watches what they *paid*, then what they *borrowed*, and
 * only then where that left them. One number arriving first would once again
 * be one number carrying two meanings.
 */
const BORROWED_REVEAL_DELAY = 760
const BURST_DELAY = 460
const FLASH_RESET_DELAY = 420

/** How long `RollingNumber` is given to roll the balance, in seconds. */
const COUNT_UP_SECONDS = 0.7

/** The modal shown once a landing effect has resolved. */
export function EventCard({
  event,
  onDismiss,
  editionId,
  onMoneyLanded,
  passedThrough,
  variant = 'landing',
}: EventCardProps): ReactElement {
  const containerRef = useModalFocusTrap<HTMLDivElement>(onDismiss)
  const primaryRef = usePrimaryAction<HTMLButtonElement>(true)
  const reduceMotion = usePrefersReducedMotion()
  const audio = useAudio()
  const { currency } = editionFor(editionId)
  const moneyDelta = (amount: number): string => formatMoneyDelta(amount, currency)
  const money = (amount: number): string => formatMoney(amount, currency)
  const [revealed, setRevealed] = useState(false)
  const [burstTick, setBurstTick] = useState(0)
  const [coinTick, setCoinTick] = useState(0)
  const [flashing, setFlashing] = useState(false)
  // Read fresh through a ref for the same reason `RollingNumber` reads
  // `format` that way: a caller passing an inline arrow must not be able to
  // restart the reveal, the coins and the confetti on every render.
  const onMoneyLandedRef = useRef(onMoneyLanded)
  onMoneyLandedRef.current = onMoneyLanded

  /*
   * B1: a card that charged the player and borrowed to cover it is two
   * facts, and `moneyDelta` is their sum — which on the biggest bill on the
   * board comes out *positive*. Everything below that reads the direction of
   * this card asks `paidOut`, not the sign of the delta, so the tuition that
   * left a player $52,000 poorer in the ledger never again lands as a green
   * band, a rising coin sound and an upward arrow.
   */
  const borrowing = event.borrowing
  const paidOut = borrowing ? borrowing.charge > 0 : event.moneyDelta < 0

  const passedSummary = useMemo(
    () => (passedThrough && passedThrough.length > 0 ? summarizePassedEvents(passedThrough, currency) : []),
    [passedThrough, currency],
  )

  const emphasis = event.emphasis ?? 'normal'
  const isPassing = variant === 'passing'
  const isMilestone = emphasis === 'milestone' || (event.emphasis === undefined && MILESTONE_TONES.has(event.tone))
  // A cut-in: the card slams in harder and the icon punches forward. Milestone
  // is a cut-in *plus* confetti, so it always counts as "big" too.
  const isCutIn = emphasis === 'big' || isMilestone

  useEffect(() => {
    setRevealed(false)
    const revealTimer = setTimeout(() => {
      setRevealed(true)
      // Coins (or a transfer) fire the moment the number starts rolling —
      // every landing with money on it, not only a milestone's confetti.
      if (event.moneyDelta !== 0 || (event.transfers?.length ?? 0) > 0) {
        setCoinTick((tick) => tick + 1)
        audio.playSfx(paidOut ? 'coinLose' : 'coinGain')
      }
    }, reduceMotion ? 0 : borrowing ? BORROWED_REVEAL_DELAY : REVEAL_DELAY)

    /*
     * The moment the digits stop. Measured rather than observed, because
     * `RollingNumber` is driven by a spring-eased tween with no completion
     * event of its own to subscribe to — and a strip that unfreezes a
     * fraction late costs nothing, while one that unfreezes early is the
     * whole bug. Reduced motion has no roll to wait for, so it lands at once.
     */
    const settleTimer = setTimeout(
      () => onMoneyLandedRef.current?.(),
      reduceMotion ? 0 : (borrowing ? BORROWED_REVEAL_DELAY : REVEAL_DELAY) + COUNT_UP_SECONDS * 1000,
    )

    let burstTimer: ReturnType<typeof setTimeout> | undefined
    if (isMilestone) {
      burstTimer = setTimeout(() => {
        setBurstTick((tick) => tick + 1)
        audio.playSfx('milestone')
      }, BURST_DELAY)
    }

    let flashTimer: ReturnType<typeof setTimeout> | undefined
    if (isCutIn && !reduceMotion) {
      setFlashing(true)
      audio.playSfx('cutIn')
      flashTimer = setTimeout(() => setFlashing(false), FLASH_RESET_DELAY)
    } else {
      setFlashing(false)
    }

    return () => {
      clearTimeout(revealTimer)
      clearTimeout(settleTimer)
      if (burstTimer) clearTimeout(burstTimer)
      if (flashTimer) clearTimeout(flashTimer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, isMilestone, isCutIn, reduceMotion, borrowing])

  // A pill that always read "$0" told a player their landing had a dollar
  // figure attached and then that figure was always nothing — clutter, not
  // information. Skipped entirely rather than shown in a neutral tone; the
  // rest of the card (title, narration, description, tiles, notes) still
  // renders in full regardless.
  const hasMoneyDelta = event.moneyDelta !== 0
  const direction = event.moneyDelta > 0 ? 'up' : 'down'
  // A borrowed card takes neither the green plate nor the red one: the two
  // rows inside it carry their own colours, and a single band around both
  // would be the merged meaning all over again, just in a different hue.
  const deltaClassName = borrowing
    ? styles.deltaBorrowed
    : direction === 'up'
      ? styles.deltaPositive
      : styles.deltaNegative
  const arrow = direction === 'up' ? '▲' : '▼'

  // The tone tints the whole card: header band, medallion ring, edge stripe.
  const toneVars = {
    '--card-tone-bg': `var(--tone-${event.tone}-bg)`,
    '--card-tone-ink': `var(--tone-${event.tone}-ink)`,
    '--card-tone-edge': `var(--tone-${event.tone}-edge)`,
  } as CSSProperties

  /*
   * Every entrance below waits a beat before it starts, and the beat is the
   * whole fix for a ghost the playtest saw on every single card: the board's
   * die and its "0 TO GO" badge used to still be on screen, fading, while
   * this card faded in over them — two frames of the game in the same pixels
   * (issue #24). The dock now fades out over exactly `overlayHandoverMs`,
   * and this waits exactly that long. Old out, then new in.
   *
   * Reduced motion keeps the delay and nothing else: which one thing the
   * screen is showing is not a motion preference.
   */
  const handover = TEMPO.overlayHandoverMs / 1000

  // A dealt card lands off-axis and settles — fast, because it is seen dozens
  // of times per game. `big`/`milestone` slam in harder: a longer throw, more
  // rotation, and a stiffer, less damped spring so it visibly overshoots.
  const entrance = reduceMotion
    ? { initial: { opacity: 0, scale: 1, y: 0, rotate: 0 }, animate: { opacity: 1, scale: 1, y: 0, rotate: 0 }, transition: { duration: 0, delay: handover } }
    : isPassing
      ? // Slid up from below, square on, no throw: a tile you drove over is
        // not a card somebody dealt you, and it should not land like one.
        {
          initial: { opacity: 0, scale: 0.97, y: 96, rotate: 0 },
          animate: { opacity: 1, scale: 1, y: 0, rotate: 0 },
          transition: { type: 'spring' as const, stiffness: 460, damping: 34, mass: 0.7, delay: handover },
        }
      : isCutIn
      ? {
          initial: { opacity: 0, scale: 0.62, y: 72, rotate: -8 },
          animate: { opacity: 1, scale: 1, y: 0, rotate: 0 },
          transition: { type: 'spring' as const, stiffness: 520, damping: 20, mass: 0.85, delay: handover },
        }
      : {
          initial: { opacity: 0, scale: 0.82, y: 44, rotate: -4.5 },
          animate: { opacity: 1, scale: 1, y: 0, rotate: 0 },
          transition: { type: 'spring' as const, stiffness: 420, damping: 26, mass: 0.85, delay: handover },
        }

  return (
    // The tone vars live on the backdrop so they inherit into the card without
    // colliding with framer-motion's stricter `style` typing.
    <div className={styles.backdrop} style={toneVars}>
      <Confetti burstKey={burstTick} origin="center" pieceCount={110} />
      <motion.div
        ref={containerRef}
        className={[
          styles.card,
          isMilestone ? styles.milestone : '',
          isCutIn ? styles.cutIn : '',
          isPassing ? styles.passing : '',
        ]
          .filter(Boolean)
          .join(' ')}
        data-variant={isMilestone ? 'milestone' : variant}
        role="dialog"
        aria-modal="true"
        aria-labelledby="event-card-title"
        initial={entrance.initial}
        animate={entrance.animate}
        transition={entrance.transition}
      >
        {flashing ? <span className={styles.flash} aria-hidden="true" /> : null}
        <div className={styles.band} aria-hidden="true">
          {isMilestone ? <span className={styles.milestoneRibbon}>Life Milestone</span> : null}
          {isPassing && !isMilestone ? (
            <span className={styles.passingRibbon}>Passing through</span>
          ) : null}
          <span className={styles.emblem}>
            <span className={styles.rays} />
            <span className={`${styles.medallion} ${isCutIn ? styles.medallionPunch : ''}`}>
              <GameIcon name={event.icon} size={40} />
            </span>
          </span>
        </div>

        <div className={styles.body}>
          <h2 id="event-card-title" className={styles.title}>
            {event.title}
          </h2>
          {/* Whose trade this packet was earned at — the same portrait a
              career fair's own table draws, so a payday reads as *this*
              job's wage on sight rather than a generic paycheck. Only ever
              present on a payday landing for a player who actually holds a
              career; see `careerIcon` on `LandingEvent`. */}
          {event.careerIcon && isCareerIcon(event.careerIcon) ? (
            <CareerPlaque icon={event.careerIcon} size={48} />
          ) : null}
          {/* The specific, dynamic story of what just happened — every
              handler writes one. The tile's own generic description (already
              shown once, before the roll, on its popover and on its stakes
              line) would only repeat the same beat in a duller voice, so it
              steps aside the moment there is a real sentence to tell instead.
              Only a card built without one — no real handler leaves narration
              off, but the type allows it — falls back to the plain framing. */}
          {event.narration ? (
            <p className={styles.narration}>&ldquo;{event.narration}&rdquo;</p>
          ) : (
            <p className={styles.description}>{event.description}</p>
          )}

          {/* The die that decided this card, shown once and structurally.
              Every wheel-decided handler used to write "Rolled a 4." into
              `notes` *and* open its narration with "A 4!", so the same
              number reached the player twice in two voices. `rolled` is
              already on the event — the die the player watched land was
              thrown from it — so the card reads it straight rather than
              asking each handler to spell it out again.

              It sits *here*, immediately over the plate, rather than up by
              the title where it used to. A player on a pay-per-pip payday
              reported not being able to tell what they rolled or what it had
              paid them, and the two facts were at opposite ends of the card
              with a portrait and a quote between them. They are one fact —
              the face is the multiplier and the plate is the product — so
              they are now one block, read in one glance, with the rate that
              joins them in the note underneath. */}
          {event.rolled !== undefined ? (
            <p className={styles.rolled}>
              <span className={styles.rolledLabel}>Rolled</span>
              <span className={styles.rolledFace}>{event.rolled}</span>
            </p>
          ) : null}

          {/* The one figure a player actually wants: not just how much moved,
              but where it left them — one line the wallet itself could
              print, the delta folded in rather than said again in a second
              line underneath it. `before` is read out of the ledger rather
              than assumed to be `after - delta`'s inverse for the same
              reason `balanceAfter` itself is: an automatic loan can put
              `after` somewhere plain subtraction would not predict, and this
              has to agree with it, not re-derive it. */}
          {hasMoneyDelta && event.balanceAfter !== undefined ? (
            <div className={`${styles.moneyPlate} ${deltaClassName}`}>
              <CoinBurst burstKey={coinTick} kind={paidOut ? 'lose' : 'gain'} />
              {/* B1, the two beats. The payment first, in red, always signed
                  with a minus; then the loan, in the borrowed colour, saying
                  in the same breath what it costs to settle. Neither is the
                  other, and neither of them is the balance. */}
              {borrowing ? (
                <div className={styles.beats}>
                  {borrowing.charge > 0 ? (
                    <p className={`${styles.beat} ${styles.beatPaid}`}>
                      <span className={styles.beatLabel}>Paid</span>
                      <span className={`${styles.beatAmount} tabular-num`}>
                        {moneyDelta(-borrowing.charge)}
                      </span>
                    </p>
                  ) : null}
                  <p className={`${styles.beat} ${styles.beatBorrowed}`}>
                    <span className={styles.beatLabel}>Borrowed</span>
                    <span className={`${styles.beatAmount} tabular-num`}>
                      {moneyDelta(borrowing.borrowed)}
                    </span>
                  </p>
                  <p className={styles.beatTerms}>
                    {borrowing.loans === 1 ? '1 loan' : `${borrowing.loans} loans`} —{' '}
                    {money(borrowing.dueAtRetirement)} to repay at retirement
                  </p>
                </div>
              ) : null}
              <div className={styles.moneyRow}>
                <span className={`${styles.moneyBefore} tabular-num`}>
                  {money(event.balanceAfter - event.moneyDelta)}
                </span>
                <span className={styles.moneyArrow} aria-hidden="true">
                  →
                </span>
                <RollingNumber
                  className={`${styles.moneyAfter} tabular-num`}
                  value={revealed ? event.balanceAfter : event.balanceAfter - event.moneyDelta}
                  format={money}
                  duration={COUNT_UP_SECONDS}
                />
              </div>
              {/* The net, folded under the balance — but never on a borrowed
                  card, where a lone "▲ +$8,000" under a $52,000 bill is
                  precisely the sentence this whole plate exists to stop
                  anybody reading. The two rows above already said it. */}
              {borrowing ? null : (
                <span className={styles.moneyDeltaChip}>
                  <span className={styles.deltaArrow} aria-hidden="true">
                    {arrow}
                  </span>
                  {moneyDelta(event.moneyDelta)}
                </span>
              )}
            </div>
          ) : null}

          {/* Where that leaves them in the standings — only printed when it
              actually moved. Most landings move money without moving a rung,
              and a rank line that reads the same on both sides would just be
              one more thing to read that says nothing happened. */}
          {event.rankBefore !== undefined && event.rankAfter !== undefined ? (
            <p
              className={`${styles.rankChange} ${event.rankAfter < event.rankBefore ? styles.rankUp : styles.rankDown}`}
            >
              <span className={styles.rankValue}>{formatOrdinal(event.rankBefore)}</span>
              <span className={styles.rankArrow} aria-hidden="true">
                →
              </span>
              <span className={styles.rankValue}>{formatOrdinal(event.rankAfter)}</span>
            </p>
          ) : null}

          {event.transfers && event.transfers.length > 0 ? (
            <div className={styles.transferLanes}>
              {event.transfers.map((transfer, index) => (
                <TransferLane
                  key={transfer.playerId}
                  flightKey={coinTick}
                  delay={index * 0.22}
                  format={money}
                  entry={{
                    playerName: transfer.playerName,
                    playerColor: transfer.playerColor,
                    // `transfers` is signed from *that* player's own point of
                    // view; the lane reads from the viewing player's side.
                    amount: -transfer.amount,
                  }}
                />
              ))}
            </div>
          ) : null}

          {event.lifeTilesGained.length > 0 ? (
            <div className={styles.tiles}>
              {event.lifeTilesGained.map((tile) => (
                <span key={tile.id} className={styles.tile}>
                  <GameIcon name={tile.icon} size={18} /> {tile.title}
                </span>
              ))}
            </div>
          ) : null}

          {/* B5: the small print under a figure that otherwise looks wrong —
              "$37,000 every payday" and then "First Paycheck +$2,000" with
              nothing on the card to reconcile them. Written on the tile
              itself (`Space.footnote`), because only the tile knows why its
              own number is the size it is. */}
          {event.footnote ? <p className={styles.footnote}>{event.footnote}</p> : null}

          {/* The third layer. A card is a headline (the title and the
              sentence under it), one big figure (the plate, or the die), and
              then the notes — and the notes are *read*, not offered.

              They were folded behind a "2 more" press for a while (issue #30,
              "one card, one message"), on the theory that a card arriving with
              three bullets was three messages. Playing it says otherwise: what
              is actually in `notes` is the mechanical small print — the rate a
              week is paid at, what a loan now costs to settle, what a rank
              buys — and every one of those is something the player needs
              before they press Continue, not something to go looking for.
              A press to reveal the terms of the deal is a press nobody makes.

              The hierarchy that came with the fold stays: the first note keeps
              the leading size and the rest are set quieter beneath it, so the
              card still has an order to read it in. No cap, because there is
              no long tail to cap — the fattest card in the game is early
              retirement at three notes, and three quiet lines under a plate is
              a paragraph, not a wall. */}
          {event.notes.length > 0 ? (
            <div className={styles.footnotes}>
              <p className={styles.footnote}>{event.notes[0]}</p>
              {event.notes.length > 1 ? (
                <ul className={styles.notes}>
                  {event.notes.slice(1).map((note, index) => (
                    <li key={index} className={styles.note}>
                      {note}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}

          {/* The road behind this tile. Everything here already popped on the
              board as it happened — this is the receipt, so a player who
              looked away for a second can still account for their balance
              without opening the log. Set below the notes and printed
              quieter than them on purpose: it is about somewhere else.

              A real table, built the way `RollTable` is: a visually-hidden
              caption so a screen reader knows what it has arrived at, and
              `<th scope="col">` over each column. It is a receipt, and a
              receipt's whole job is that the figures share an edge — the
              prose version set each sum wherever its own tile name happened
              to end, which is exactly the shape you cannot add up by eye. */}
          {passedSummary.length > 0 ? (
            <table className={styles.passedThrough}>
              <caption className="visually-hidden">Passed on the way here</caption>
              <thead>
                <tr>
                  <th scope="col">Passed</th>
                  <th scope="col" className={styles.passedAmount}>
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {passedSummary.map((row) => (
                  <tr key={row.label}>
                    <th scope="row">{row.label}</th>
                    <td className={styles.passedAmount}>{row.amount ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}

          {/* Continue is this card's A button: it takes focus as the card
              lands, and Space or Enter presses it from wherever the player's
              focus happened to be. The card's own focus trap already put
              focus here — this is what makes the *key* reliable too, on the
              same one control. */}
          <div className={styles.continue}>
            <ChunkyButton ref={primaryRef} variant="primary" size="lg" fullWidth onClick={onDismiss}>
              Continue
            </ChunkyButton>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
