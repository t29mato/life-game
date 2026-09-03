import { useEffect, useRef, useState, type CSSProperties, type ReactElement } from 'react'
import type { Money, PlayerColor } from '@domain/model/types'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'
import { useUi } from '../../i18n/LocaleProvider'
import { Coin, Note } from '../../icons/parts'
import styles from './CoinFlight.module.css'

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

/** One coin or note in a `CoinBurst` field, on its own little arc. */
interface Piece {
  readonly id: number
  readonly note: boolean
  readonly style: CSSProperties
}

function generatePieces(count: number): Piece[] {
  return Array.from({ length: count }, (_, i) => {
    const note = i % 3 === 0
    const size = randomBetween(0.8, 1.35)
    return {
      id: i,
      note,
      style: {
        '--size': `${size}`,
        '--left': `${randomBetween(30, 70)}%`,
        '--drift': `${randomBetween(-70, 70)}px`,
        '--rise': `${randomBetween(60, 130)}px`,
        '--spin': `${Math.round(randomBetween(-260, 260))}deg`,
        '--duration': `${randomBetween(0.62, 0.92)}s`,
        '--delay': `${randomBetween(0, 0.12)}s`,
      } as CSSProperties,
    }
  })
}

export interface CoinBurstProps {
  /** Bump this to fire a new burst. */
  readonly burstKey: number | string
  /** A gain scatters upward and bright; a loss drops away, dimmer. */
  readonly kind: 'gain' | 'lose'
  readonly pieceCount?: number
}

/**
 * A handful of coins and notes bursting from wherever this is mounted —
 * the same "print, don't fetch" approach `Confetti` already takes, reusing
 * the board's own `Coin`/`Note` art rather than a sprite sheet. `kind`
 * points the burst up and bright for a gain, down and muted for a loss, so
 * the shape alone reads before anyone finishes counting the number next to
 * it.
 */
export function CoinBurst({ burstKey, kind, pieceCount = 10 }: CoinBurstProps): ReactElement | null {
  const reduceMotion = usePrefersReducedMotion()
  const [pieces, setPieces] = useState<Piece[]>([])
  const firstRun = useRef(true)

  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false
      return
    }
    if (reduceMotion) {
      setPieces([])
      return
    }
    setPieces(generatePieces(pieceCount))
    const timeout = setTimeout(() => setPieces([]), 1100)
    return () => clearTimeout(timeout)
  }, [burstKey])

  if (reduceMotion || pieces.length === 0) return null

  return (
    <div className={`${styles.burstField} ${kind === 'lose' ? styles.burstLose : ''}`} aria-hidden="true">
      {pieces.map((piece) => (
        <span key={piece.id} className={styles.burstPiece} style={piece.style}>
          <svg viewBox="0 0 64 64" width="22" height="22">
            {piece.note ? (
              kind === 'lose' ? (
                <Note x={32} y={32} tone="#c96a5a" />
              ) : (
                <Note x={32} y={32} />
              )
            ) : (
              <Coin x={32} y={32} r={16} />
            )}
          </svg>
        </span>
      ))}
    </div>
  )
}

export interface TransferLaneEntry {
  readonly playerName: string
  readonly playerColor: PlayerColor
  /** Signed from the *viewing* player's own point of view: positive is a gain. */
  readonly amount: Money
}

export interface TransferLaneProps {
  readonly entry: TransferLaneEntry
  readonly format: (amount: Money) => string
  /** Stagger, in seconds, before this lane's coin sets off. */
  readonly delay: number
  /** Bump to replay the flight — same convention as `CoinBurst`'s `burstKey`. */
  readonly flightKey: number | string
}

/**
 * One coin, travelling the table between "You" and whoever else's balance
 * this landing just moved — Mario-Party-style money-changes-hands, minus
 * the sprite budget: a single `Coin` slides along a straight line between
 * two colour-coded ends, landing on whichever side gained. `transfers` is
 * the source of truth for the amount and direction, and the lane is where
 * a player reads them — the note it pairs with says only where the money
 * left that player standing (`"X is down to $Z"`), so the two halves of
 * the fact are told once each rather than both twice. On its own delay, so
 * a `payEach` reads as a queue of individual payments rather than one blur.
 */
export function TransferLane({ entry, format, delay, flightKey }: TransferLaneProps): ReactElement {
  const reduceMotion = usePrefersReducedMotion()
  const t = useUi()
  const gained = entry.amount > 0
  const colorVars = {
    '--lane-color': `var(--player-${entry.playerColor})`,
    '--lane-color-light': `var(--player-${entry.playerColor}-light)`,
    '--lane-delay': `${delay}s`,
  } as CSSProperties

  return (
    <div className={styles.lane} style={colorVars} data-reduce-motion={reduceMotion || undefined}>
      <span className={`${styles.laneEnd} ${styles.laneYou}`}>{t.coin.you}</span>
      <span className={styles.laneTrack} aria-hidden="true">
        <span
          key={flightKey}
          className={`${styles.laneCoin} ${gained ? styles.laneCoinToYou : styles.laneCoinToThem}`}
        >
          <svg viewBox="0 0 64 64" width="18" height="18">
            <Coin x={32} y={32} r={17} />
          </svg>
        </span>
      </span>
      <span className={`${styles.laneEnd} ${styles.laneThem}`}>
        <span className={styles.laneDot} aria-hidden="true" />
        {entry.playerName}
      </span>
      <span className={`${styles.laneAmount} ${gained ? styles.laneAmountGain : styles.laneAmountLose}`}>
        {gained ? '+' : '−'}
        {format(Math.abs(entry.amount))}
      </span>
    </div>
  )
}
