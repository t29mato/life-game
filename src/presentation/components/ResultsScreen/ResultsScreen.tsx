import { useCallback, useEffect, useMemo, useState, type CSSProperties, type ReactElement } from 'react'
import type { EditionId, GameResults, PlayerResult } from '@domain/model/types'
import { editionFor } from '@domain/edition/registry'
import type { GameRecord } from '@application/ports/StatsRepositoryPort'
import { useAudio } from '../../hooks/useAudio'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'
import { formatMoney, formatOrdinal } from '../../format'
import { ChunkyButton } from '../ChunkyButton/ChunkyButton'
import { RollingNumber } from '../RollingNumber/RollingNumber'
import { Confetti } from '../Confetti/Confetti'
import { UiIcon, type UiIconName } from '../../icons/ui'
import styles from './ResultsScreen.module.css'

export interface ResultsScreenProps {
  readonly results: GameResults
  readonly records: readonly GameRecord[]
  readonly onPlayAgain: () => void
  /** Which edition this game was played on. Defaults to the original board. */
  readonly editionId?: EditionId
}

/** The stage waits, then places each finisher — slowing down as it climbs. */
const REVEAL_INITIAL_DELAY = 700
const REVEAL_STAGGER = 900
/** The winner gets an extra beat of silence before landing. */
const WINNER_EXTRA_DELAY = 650
const ROLL_DURATION = 1100
const MEDALS: readonly UiIconName[] = ['medal-gold', 'medal-silver', 'medal-bronze']

type MoneyKey =
  | 'cash'
  | 'lifeTileValue'
  | 'houseValue'
  | 'stockValue'
  | 'insurancePayout'
  | 'childrenBonus'
  | 'retirementBonus'
  | 'loanPenalty'

const BREAKDOWN_LABELS: ReadonlyArray<readonly [string, MoneyKey]> = [
  ['Cash', 'cash'],
  ['Life tiles', 'lifeTileValue'],
  ['House', 'houseValue'],
  ['Shares', 'stockValue'],
  ['Insurance', 'insurancePayout'],
  ['Kids', 'childrenBonus'],
  ['Retirement', 'retirementBonus'],
  ['Loans', 'loanPenalty'],
]

function colorVars(color: PlayerResult['color']): CSSProperties {
  return {
    '--dot-light': `var(--player-${color}-light)`,
    '--dot-color': `var(--player-${color})`,
    '--dot-dark': `var(--player-${color}-dark)`,
    '--podium-light': `var(--player-${color}-light)`,
    '--podium-base': `var(--player-${color})`,
    '--podium-dark': `var(--player-${color}-dark)`,
  } as CSSProperties
}

/**
 * When each finisher lands, counting from the back of the field forward so the
 * winner is always last and always after the longest pause.
 */
function revealSchedule(count: number): number[] {
  return Array.from({ length: count }, (_, i) =>
    REVEAL_INITIAL_DELAY + i * REVEAL_STAGGER + (i === count - 1 ? WINNER_EXTRA_DELAY : 0),
  )
}

/**
 * Games already finished before this one. `StatsRepositoryPort.list()` appends
 * automatically at `gameOver`, so by the time this screen renders, `records[0]`
 * is this very game — comparisons look past it, at everything played before.
 */
function priorRecords(records: readonly GameRecord[]): readonly GameRecord[] {
  return records.slice(1)
}

/** Every total a player of this name has finished with in games before this one. */
function pastTotalsFor(name: string, history: readonly GameRecord[]): readonly number[] {
  return history.flatMap((record) => record.standings.filter((s) => s.name === name).map((s) => s.total))
}

/** A short badge for a standing row, when the data honestly supports one. */
function rowBadge(entry: PlayerResult, history: readonly GameRecord[]): string | null {
  const pastTotals = pastTotalsFor(entry.name, history)
  if (pastTotals.length === 0) return null
  return entry.total > Math.max(...pastTotals) ? 'Personal best' : null
}

/** One headline about where this game sits in the table's history, if any. */
function recordNoteFor(
  winner: PlayerResult | undefined,
  history: readonly GameRecord[],
  money: (amount: number) => string,
): string | null {
  if (!winner) return null
  if (history.length === 0) return 'The first game in the hall of records.'

  const allPastTotals = history.flatMap((record) => record.standings.map((s) => s.total))
  const tableHigh = allPastTotals.length > 0 ? Math.max(...allPastTotals) : -Infinity
  if (winner.total > tableHigh) return `A new high score for the table — ${money(winner.total)}.`

  const priorWins = history.filter((record) => record.winnerName === winner.name).length
  if (priorWins === 0) return `${winner.name}'s first win.`

  const pastTotals = pastTotalsFor(winner.name, history)
  if (pastTotals.length > 0 && winner.total > Math.max(...pastTotals)) {
    return `A personal best for ${winner.name}.`
  }

  return null
}

/** `phase === 'gameOver'`: podium, full standings, and a Play Again CTA. */
export function ResultsScreen({ results, records, onPlayAgain, editionId }: ResultsScreenProps): ReactElement {
  const { currency } = editionFor(editionId)
  // Stable across renders so the memoised record note is not rebuilt every time.
  const money = useCallback((amount: number) => formatMoney(amount, currency), [currency])
  const audio = useAudio()
  const reduceMotion = usePrefersReducedMotion()
  const standings = results.standings
  // Reveal from last place to first, so the winner lands last.
  const revealOrder = useMemo(() => [...standings].sort((a, b) => b.rank - a.rank), [standings])
  const [revealedCount, setRevealedCount] = useState(0)
  const [fanfareTick, setFanfareTick] = useState(0)

  const history = useMemo(() => priorRecords(records), [records])
  const winner = standings.find((s) => s.playerId === results.winnerId)
  const recordNote = useMemo(() => recordNoteFor(winner, history, money), [winner, history, money])

  useEffect(() => {
    if (reduceMotion) {
      // Reduced motion means arriving, not hurrying: everything is already here.
      setRevealedCount(revealOrder.length)
      return
    }
    setRevealedCount(0)
    const timers = revealSchedule(revealOrder.length).map((delay, i) =>
      setTimeout(() => setRevealedCount(i + 1), delay),
    )
    return () => timers.forEach(clearTimeout)
  }, [revealOrder, reduceMotion])

  useEffect(() => {
    if (revealOrder.length === 0 || revealedCount < revealOrder.length) return
    const timer = setTimeout(
      () => {
        audio.playSfx('fanfare')
        setFanfareTick((tick) => tick + 1)
      },
      reduceMotion ? 0 : ROLL_DURATION * 0.55,
    )
    return () => clearTimeout(timer)
  }, [revealedCount, revealOrder.length, audio, reduceMotion])

  const indexOf = (playerId: string): number => revealOrder.findIndex((s) => s.playerId === playerId)
  const isRevealed = (playerId: string): boolean => {
    const index = indexOf(playerId)
    return index !== -1 && revealedCount > index
  }

  const winnerLanded = revealedCount >= revealOrder.length && revealOrder.length > 0
  const podium = standings.filter((s) => s.rank <= 3)
  // Classic podium order: 2nd, 1st, 3rd.
  const podiumOrder = [2, 1, 3]
    .map((rank) => podium.find((s) => s.rank === rank))
    .filter((s): s is PlayerResult => Boolean(s))

  return (
    <div className={`${styles.screen} ${winnerLanded ? styles.finished : ''}`}>
      <Confetti burstKey={fanfareTick} pieceCount={150} />

      <header className={styles.masthead}>
        <span className={styles.eyebrow}>Final standings</span>
        <h1 className={styles.heading} data-text="Game Over">
          Game Over
        </h1>
        <p className={styles.subheading}>Here&rsquo;s how everyone&rsquo;s journey turned out.</p>
        {winnerLanded && recordNote ? (
          <p className={styles.recordNote} aria-live="polite">
            {recordNote}
          </p>
        ) : null}
      </header>

      <div className={styles.stage}>
        <div className={styles.podium}>
          {podiumOrder.map((entry) => (
            <div
              key={entry.playerId}
              className={`${styles.podiumSpot} ${styles[`rank${entry.rank}`] ?? ''} ${
                isRevealed(entry.playerId) ? styles.podiumRevealed : ''
              }`}
              style={colorVars(entry.color)}
            >
              <span className={styles.podiumMedal} aria-hidden="true">
                {MEDALS[entry.rank - 1] ? <UiIcon name={MEDALS[entry.rank - 1] as UiIconName} size={28} /> : null}
              </span>
              <span className={styles.podiumName}>{entry.name}</span>
              <span className={styles.podiumPawn} aria-hidden="true">
                <span className={styles.podiumPawnHead} />
                <span className={styles.podiumPawnBody} />
              </span>
              <div className={styles.podiumBlock}>
                <span className={styles.podiumTop} aria-hidden="true" />
                <span className={styles.podiumFace}>{formatOrdinal(entry.rank)}</span>
              </div>
            </div>
          ))}
        </div>
        <div className={styles.plinth} aria-hidden="true" />
      </div>

      <div className={styles.table} role="table" aria-label="Final standings">
        {standings.map((entry) => {
          const revealed = isRevealed(entry.playerId)
          const isWinner = entry.playerId === results.winnerId
          const badge = revealed ? rowBadge(entry, history) : null
          return (
            <div
              key={entry.playerId}
              role="row"
              className={`${styles.row} ${revealed ? styles.rowRevealed : ''} ${
                isWinner ? styles.winnerRow : ''
              }`}
              style={colorVars(entry.color)}
            >
              <span role="cell" className={styles.rank}>
                {formatOrdinal(entry.rank)}
              </span>
              <span role="cell" className={styles.rowIdentity}>
                <span className={styles.rowDot} aria-hidden="true" />
                <span className={styles.rowName}>{entry.name}</span>
                {badge ? <span className={styles.badge}>{badge}</span> : null}
              </span>
              <div role="cell" className={styles.breakdown}>
                {BREAKDOWN_LABELS.map(([label, key]) => (
                  <span key={label} className={styles.breakdownItem}>
                    <span className={styles.breakdownLabel}>{label}</span>
                    <RollingNumber
                      className={`${styles.breakdownValue} tabular-num`}
                      value={revealed ? entry[key] : 0}
                      format={money}
                      duration={ROLL_DURATION / 1000}
                    />
                  </span>
                ))}
              </div>
              <span role="cell" className={styles.total}>
                <RollingNumber
                  className="tabular-num"
                  value={revealed ? entry.total : 0}
                  format={money}
                  duration={ROLL_DURATION / 1000}
                />
              </span>
            </div>
          )
        })}
      </div>

      <div className={styles.playAgain}>
        <ChunkyButton variant="primary" size="lg" icon="replay" fullWidth onClick={onPlayAgain}>
          Play Again
        </ChunkyButton>
      </div>
    </div>
  )
}
