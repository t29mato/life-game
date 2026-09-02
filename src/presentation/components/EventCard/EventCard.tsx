import { useEffect, useMemo, useState, type CSSProperties, type ReactElement } from 'react'
import { motion } from 'framer-motion'
import type { EditionId, LandingEvent } from '@domain/model/types'
import { editionFor } from '@domain/edition/registry'
import { formatMoney, formatMoneyDelta, formatOrdinal } from '../../format'
import { GameIcon } from '../../icons/GameIcon'
import { useAudio } from '../../hooks/useAudio'
import { useModalFocusTrap } from '../../hooks/useModalFocusTrap'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'
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
   * Everything the car drove over on the way to this tile, in the order it
   * drove over them. Each of these already had its say on the board as a
   * `PassingPop`; this is the receipt, aggregated by tile so three paydays
   * read as one line. Never the tile this card is about — only what was
   * passed *on the way* — and absent entirely on a card that ended a move
   * nothing was passed on, which is most of them.
   */
  readonly passedThrough?: readonly LandingEvent[]
}

// Cards from before `emphasis` existed still tint gold for a milestone —
// keep honouring that so nothing already tagged that way goes quiet.
const MILESTONE_TONES = new Set(['gold'])
const REVEAL_DELAY = 240
const BURST_DELAY = 460
const FLASH_RESET_DELAY = 420

/** The modal shown once a landing effect has resolved. */
export function EventCard({
  event,
  onDismiss,
  editionId,
  passedThrough,
}: EventCardProps): ReactElement {
  const containerRef = useModalFocusTrap<HTMLDivElement>(onDismiss)
  const reduceMotion = usePrefersReducedMotion()
  const audio = useAudio()
  const { currency } = editionFor(editionId)
  const moneyDelta = (amount: number): string => formatMoneyDelta(amount, currency)
  const money = (amount: number): string => formatMoney(amount, currency)
  const [revealed, setRevealed] = useState(false)
  const [burstTick, setBurstTick] = useState(0)
  const [coinTick, setCoinTick] = useState(0)
  const [flashing, setFlashing] = useState(false)
  const passedSummary = useMemo(
    () => (passedThrough && passedThrough.length > 0 ? summarizePassedEvents(passedThrough, currency) : []),
    [passedThrough, currency],
  )

  const emphasis = event.emphasis ?? 'normal'
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
        audio.playSfx(event.moneyDelta >= 0 ? 'coinGain' : 'coinLose')
      }
    }, reduceMotion ? 0 : REVEAL_DELAY)

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
      if (burstTimer) clearTimeout(burstTimer)
      if (flashTimer) clearTimeout(flashTimer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, isMilestone, isCutIn, reduceMotion])

  // A pill that always read "$0" told a player their landing had a dollar
  // figure attached and then that figure was always nothing — clutter, not
  // information. Skipped entirely rather than shown in a neutral tone; the
  // rest of the card (title, narration, description, tiles, notes) still
  // renders in full regardless.
  const hasMoneyDelta = event.moneyDelta !== 0
  const direction = event.moneyDelta > 0 ? 'up' : 'down'
  const deltaClassName = direction === 'up' ? styles.deltaPositive : styles.deltaNegative
  const arrow = direction === 'up' ? '▲' : '▼'

  // The tone tints the whole card: header band, medallion ring, edge stripe.
  const toneVars = {
    '--card-tone-bg': `var(--tone-${event.tone}-bg)`,
    '--card-tone-ink': `var(--tone-${event.tone}-ink)`,
    '--card-tone-edge': `var(--tone-${event.tone}-edge)`,
  } as CSSProperties

  // A dealt card lands off-axis and settles — fast, because it is seen dozens
  // of times per game. `big`/`milestone` slam in harder: a longer throw, more
  // rotation, and a stiffer, less damped spring so it visibly overshoots.
  const entrance = reduceMotion
    ? { initial: { opacity: 1, scale: 1, y: 0, rotate: 0 }, animate: { opacity: 1, scale: 1, y: 0, rotate: 0 }, transition: { duration: 0 } }
    : isCutIn
      ? {
          initial: { opacity: 0, scale: 0.62, y: 72, rotate: -8 },
          animate: { opacity: 1, scale: 1, y: 0, rotate: 0 },
          transition: { type: 'spring' as const, stiffness: 520, damping: 20, mass: 0.85 },
        }
      : {
          initial: { opacity: 0, scale: 0.82, y: 44, rotate: -4.5 },
          animate: { opacity: 1, scale: 1, y: 0, rotate: 0 },
          transition: { type: 'spring' as const, stiffness: 420, damping: 26, mass: 0.85 },
        }

  return (
    // The tone vars live on the backdrop so they inherit into the card without
    // colliding with framer-motion's stricter `style` typing.
    <div className={styles.backdrop} style={toneVars}>
      <Confetti burstKey={burstTick} origin="center" pieceCount={110} />
      <motion.div
        ref={containerRef}
        className={[styles.card, isMilestone ? styles.milestone : '', isCutIn ? styles.cutIn : '']
          .filter(Boolean)
          .join(' ')}
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
          {/* The die that decided this card, shown once and structurally.
              Every wheel-decided handler used to write "Rolled a 4." into
              `notes` *and* open its narration with "A 4!", so the same
              number reached the player twice in two voices. `rolled` is
              already on the event — the die the player watched land was
              thrown from it — so the card reads it straight rather than
              asking each handler to spell it out again. */}
          {event.rolled !== undefined ? (
            <p className={styles.rolled}>
              <span className={styles.rolledLabel}>Rolled</span>
              <span className={styles.rolledFace}>{event.rolled}</span>
            </p>
          ) : null}
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
              <CoinBurst burstKey={coinTick} kind={event.moneyDelta >= 0 ? 'gain' : 'lose'} />
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
                  duration={0.7}
                />
              </div>
              <span className={styles.moneyDeltaChip}>
                <span className={styles.deltaArrow} aria-hidden="true">
                  {arrow}
                </span>
                {moneyDelta(event.moneyDelta)}
              </span>
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

          {event.notes.length > 0 ? (
            <ul className={styles.notes}>
              {event.notes.map((note, index) => (
                <li key={index} className={styles.note}>
                  {note}
                </li>
              ))}
            </ul>
          ) : null}

          {/* The road behind this tile. Everything here already popped on the
              board as it happened — this is the receipt, so a player who
              looked away for a second can still account for their balance
              without opening the log. Set below the notes and printed
              quieter than them on purpose: it is about somewhere else. */}
          {passedSummary.length > 0 ? (
            <ul className={styles.passedThrough} aria-label="Passed on the way here">
              {passedSummary.map((line) => (
                <li key={line} className={styles.passedLine}>
                  {line}
                </li>
              ))}
            </ul>
          ) : null}

          <div className={styles.continue}>
            <ChunkyButton variant="primary" size="lg" fullWidth onClick={onDismiss}>
              Continue
            </ChunkyButton>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
