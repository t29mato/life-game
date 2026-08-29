import { useEffect, useState, type CSSProperties, type ReactElement } from 'react'
import { motion } from 'framer-motion'
import type { EditionId, LandingEvent } from '@domain/model/types'
import { editionFor } from '@domain/edition/registry'
import { formatMoney, formatMoneyDelta } from '../../format'
import { GameIcon } from '../../icons/GameIcon'
import { useAudio } from '../../hooks/useAudio'
import { useModalFocusTrap } from '../../hooks/useModalFocusTrap'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'
import { ChunkyButton } from '../ChunkyButton/ChunkyButton'
import { RollingNumber } from '../RollingNumber/RollingNumber'
import { Confetti } from '../Confetti/Confetti'
import { CoinBurst, TransferLane } from '../CoinFlight/CoinFlight'
import styles from './EventCard.module.css'

export interface EventCardProps {
  readonly event: LandingEvent
  /** Dismissing the card always ends the turn. */
  readonly onDismiss: () => void
  /** Which edition's money the delta is printed in. Defaults to the original board. */
  readonly editionId?: EditionId
}

// Cards from before `emphasis` existed still tint gold for a milestone —
// keep honouring that so nothing already tagged that way goes quiet.
const MILESTONE_TONES = new Set(['gold'])
const REVEAL_DELAY = 240
const BURST_DELAY = 460
const FLASH_RESET_DELAY = 420

/** The modal shown once a landing effect has resolved. */
export function EventCard({ event, onDismiss, editionId }: EventCardProps): ReactElement {
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

  const direction = event.moneyDelta > 0 ? 'up' : event.moneyDelta < 0 ? 'down' : 'flat'
  const deltaClassName =
    direction === 'up' ? styles.deltaPositive : direction === 'down' ? styles.deltaNegative : styles.deltaZero
  const arrow = direction === 'up' ? '▲' : direction === 'down' ? '▼' : '—'

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
          {event.narration ? <p className={styles.narration}>&ldquo;{event.narration}&rdquo;</p> : null}
          <p className={styles.description}>{event.description}</p>

          <div className={`${styles.deltaPlate} ${deltaClassName}`}>
            <CoinBurst burstKey={coinTick} kind={event.moneyDelta >= 0 ? 'gain' : 'lose'} />
            <span className={styles.deltaArrow} aria-hidden="true">
              {arrow}
            </span>
            <RollingNumber
              className={`${styles.delta} tabular-num`}
              value={revealed ? event.moneyDelta : 0}
              format={moneyDelta}
              duration={0.7}
            />
          </div>

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
