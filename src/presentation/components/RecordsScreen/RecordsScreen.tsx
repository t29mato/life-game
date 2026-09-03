import { useEffect, useMemo, useRef, type CSSProperties, type KeyboardEvent, type ReactElement } from 'react'
import type { GameRecord, GameRecordEntry } from '@application/ports/StatsRepositoryPort'
import { editionFor } from '@domain/edition/registry'
import { editionDisplayName, formatMoney, formatOrdinal } from '../../format'
import { ChunkyButton } from '../ChunkyButton/ChunkyButton'
import { useUi } from '../../i18n/LocaleProvider'
import type { UiText } from '../../i18n/en'
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

/**
 * `1970-01-01T00:00:00.000Z` → `'Jan 1, 2026'`, or `'2026年1月1日'`.
 *
 * The tag comes from the catalogue rather than from the host, deliberately: a
 * date printed beside a game is part of the game's own voice, so it follows
 * the language the player chose and not whatever the browser is set to.
 */
function formatPlayedAt(playedAt: string, t: UiText): string {
  const date = new Date(playedAt)
  if (Number.isNaN(date.getTime())) return t.format.unknownDate
  return date.toLocaleString(t.format.dateLocale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
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
  const t = useUi()
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
            {t.common.backToTitle}
          </ChunkyButton>
        </div>
        <span className={styles.eyebrow}>{t.records.eyebrow}</span>
        <h1 className={styles.heading} data-text={t.records.heading} tabIndex={-1} ref={headingRef}>
          {t.records.heading}
        </h1>
      </header>

      {sorted.length === 0 ? (
        <div className={styles.empty}>
          <span className={styles.emptyBadge} aria-hidden="true">
            <UiIcon name="ribbon" size={40} />
          </span>
          <p className={styles.emptyTitle}>{t.records.emptyTitle}</p>
          <p className={styles.emptyBody}>{t.records.emptyBody}</p>
        </div>
      ) : (
        <>
          {leaders.length > 0 ? (
            <section className={styles.leaders} aria-label={t.records.winsAria}>
              <span className={styles.sectionLabel}>{t.records.tableLeaders}</span>
              <ol className={styles.leaderList}>
                {leaders.map((leader, index) => (
                  <li key={leader.name} className={styles.leaderChip}>
                    <span className={styles.leaderMedal} aria-hidden="true">
                      {MEDALS[index] ? <UiIcon name={MEDALS[index] as UiIconName} size={18} /> : null}
                    </span>
                    <span className={styles.leaderName}>{leader.name}</span>
                    <span className={styles.leaderWins}>{t.records.wins(leader.wins)}</span>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}

          <ul className={styles.history} aria-label={t.records.historyAria}>
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
                      {editionDisplayName(editionFor(record.editionId), t)}
                    </span>
                    <span className={styles.cardTurns}>{t.records.turns(record.turns)}</span>
                    <span className={styles.cardDate}>{formatPlayedAt(record.playedAt, t)}</span>
                  </span>
                </div>

                <ol className={styles.standings}>
                  {record.standings.map((entry) => (
                    <li key={entry.name} className={styles.standingRow} style={entryColorVars(entry.color)}>
                      <span className={styles.standingRank}>{formatOrdinal(entry.rank, t)}</span>
                      <span className={styles.standingDot} aria-hidden="true" />
                      <span className={styles.standingName}>
                        {entry.name}
                        {entry.isCpu ? (
                          <span className={styles.standingCpu}>{t.common.cpu}</span>
                        ) : null}
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
