import { useEffect, useMemo, useRef, type CSSProperties, type KeyboardEvent, type ReactElement } from 'react'
import type { GameRecord, GameRecordEntry } from '@application/ports/StatsRepositoryPort'
import { editionFor } from '@domain/edition/registry'
import { editionDisplayName, formatMoney, formatOrdinal } from '../../format'
import { ChunkyButton } from '../ChunkyButton/ChunkyButton'
import { UiIcon, type UiIconName } from '../../icons/ui'
import styles from './RecordsScreen.module.css'

export interface RecordsScreenProps {
  readonly records: readonly GameRecord[]
  readonly onClose: () => void
}

interface WinTally {
  readonly name: string
  readonly wins: number
}

const MEDALS: readonly UiIconName[] = ['medal-gold', 'medal-silver', 'medal-bronze']

/** `1970-01-01T00:00:00.000Z` → `'Jan 1, 2026'`. Always English, regardless of the host locale. */
function formatPlayedAt(playedAt: string): string {
  const date = new Date(playedAt)
  if (Number.isNaN(date.getTime())) return 'an unknown date'
  return date.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

/** Newest first, defensively — `list()` already promises this ordering. */
function byPlayedAtDescending(records: readonly GameRecord[]): readonly GameRecord[] {
  return [...records].sort((a, b) => Date.parse(b.playedAt) - Date.parse(a.playedAt))
}

/** How many times each name has won, most wins first, ties broken alphabetically. */
function tallyWins(records: readonly GameRecord[]): readonly WinTally[] {
  const counts = new Map<string, number>()
  for (const record of records) {
    counts.set(record.winnerName, (counts.get(record.winnerName) ?? 0) + 1)
  }
  return Array.from(counts, ([name, wins]) => ({ name, wins })).sort(
    (a, b) => b.wins - a.wins || a.name.localeCompare(b.name),
  )
}

function entryColorVars(color: GameRecordEntry['color']): CSSProperties {
  return {
    '--dot-light': `var(--player-${color}-light)`,
    '--dot-color': `var(--player-${color})`,
    '--dot-dark': `var(--player-${color}-dark)`,
  } as CSSProperties
}

/** `phase === 'setup'`, opened from the title screen: the hall of records. */
export function RecordsScreen({ records, onClose }: RecordsScreenProps): ReactElement {
  const headingRef = useRef<HTMLHeadingElement>(null)
  const sorted = useMemo(() => byPlayedAtDescending(records), [records])
  const leaders = useMemo(() => tallyWins(records), [records])

  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.key === 'Escape') onClose()
  }

  return (
    <div className={styles.screen} onKeyDown={handleKeyDown}>
      <header className={styles.masthead}>
        <div className={styles.backRow}>
          <ChunkyButton variant="ghost" size="sm" icon="exit" onClick={onClose}>
            Back to title
          </ChunkyButton>
        </div>
        <span className={styles.eyebrow}>Every game this table has played</span>
        <h1 className={styles.heading} data-text="Hall of Records" tabIndex={-1} ref={headingRef}>
          Hall of Records
        </h1>
      </header>

      {sorted.length === 0 ? (
        <div className={styles.empty}>
          <span className={styles.emptyBadge} aria-hidden="true">
            <UiIcon name="ribbon" size={40} />
          </span>
          <p className={styles.emptyTitle}>No games finished yet</p>
          <p className={styles.emptyBody}>
            Play a full game and the hall of records will remember every finish — who won, by how much,
            and how long it took. Come back here once the first pawn crosses the retirement space.
          </p>
        </div>
      ) : (
        <>
          {leaders.length > 0 ? (
            <section className={styles.leaders} aria-label="Wins by player">
              <span className={styles.sectionLabel}>Table leaders</span>
              <ol className={styles.leaderList}>
                {leaders.map((leader, index) => (
                  <li key={leader.name} className={styles.leaderChip}>
                    <span className={styles.leaderMedal} aria-hidden="true">
                      {MEDALS[index] ? <UiIcon name={MEDALS[index] as UiIconName} size={18} /> : null}
                    </span>
                    <span className={styles.leaderName}>{leader.name}</span>
                    <span className={styles.leaderWins}>
                      {leader.wins} {leader.wins === 1 ? 'win' : 'wins'}
                    </span>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}

          <ul className={styles.history} aria-label="Game history">
            {sorted.map((record, index) => (
              <li key={`${record.playedAt}-${index}`} className={styles.card}>
                <div className={styles.cardHeader}>
                  <span className={styles.cardWinner}>
                    <UiIcon name="medal-gold" size={20} />
                    <span className={styles.cardWinnerName}>{record.winnerName}</span>
                  </span>
                  <span className={styles.cardMeta}>
                    {/* Which country the game was played in. A ¥64,000,000
                        finish and a $310,000 one are different achievements,
                        and the tag is what keeps neighbouring cards from
                        reading as one league table. */}
                    <span className={styles.cardEdition}>
                      {editionDisplayName(editionFor(record.editionId))}
                    </span>
                    <span className={styles.cardTurns}>
                      {record.turns} {record.turns === 1 ? 'turn' : 'turns'}
                    </span>
                    <span className={styles.cardDate}>{formatPlayedAt(record.playedAt)}</span>
                  </span>
                </div>

                <ol className={styles.standings}>
                  {record.standings.map((entry) => (
                    <li key={entry.name} className={styles.standingRow} style={entryColorVars(entry.color)}>
                      <span className={styles.standingRank}>{formatOrdinal(entry.rank)}</span>
                      <span className={styles.standingDot} aria-hidden="true" />
                      <span className={styles.standingName}>
                        {entry.name}
                        {entry.isCpu ? <span className={styles.standingCpu}>CPU</span> : null}
                      </span>
                      <span className={`${styles.standingTotal} tabular-num`}>
                        {/* Each game is quoted in the money it was actually won
                            in, so an evening that mixed editions still reads. */}
                        {formatMoney(entry.total, editionFor(record.editionId).currency)}
                      </span>
                    </li>
                  ))}
                </ol>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
