import { useEffect, useRef, type ReactElement } from 'react'
import type { GameLogEntry, LogTone } from '@domain/model/types'
import { useUi } from '../../i18n/LocaleProvider'
import { isUpsetEntry } from './upset'
import styles from './GameLog.module.css'

export interface GameLogProps {
  readonly entries: readonly GameLogEntry[]
  /**
   * Dismisses the panel. Given by whatever is showing the log as a drawer;
   * absent when the feed is simply part of a page, in which case no close
   * control is drawn at all.
   */
  readonly onClose?: (() => void) | undefined
}

/** Printed mark stamped in the rail beside each entry, one per tone. */
const TONE_MARK: Record<LogTone, string> = {
  info: '•',
  'money-in': '▲',
  'money-out': '▼',
  event: '✦',
  milestone: '★',
  upset: '⚡',
}

const TONE_CLASS: Record<LogTone, string | undefined> = {
  info: styles.info,
  'money-in': styles.moneyIn,
  'money-out': styles.moneyOut,
  event: styles.event,
  milestone: styles.milestone,
  upset: styles.upset,
}

/** Scrolling, colour-coded feed of `state.log`, newest entry on top. */
export function GameLog({ entries, onClose }: GameLogProps): ReactElement {
  const t = useUi()
  const listRef = useRef<HTMLUListElement>(null)
  const newestFirst = [...entries].reverse()

  useEffect(() => {
    const list = listRef.current
    if (!list) return
    if (typeof list.scrollTo === 'function') {
      list.scrollTo({ top: 0 })
    } else {
      list.scrollTop = 0
    }
  }, [entries.length])

  return (
    <section className={styles.panel} aria-label={t.log.panel}>
      {/* Close sits in the panel's own heading row, on the same rule as the
          title and the count. It used to float above the panel entirely,
          where it read as one more header control beside Quit rather than as
          this panel's own way out. */}
      <h2 className={styles.heading}>
        <span className={styles.headingLabel}>{t.log.heading}</span>
        <span className={styles.headingRule} aria-hidden="true" />
        <span className={styles.headingCount}>{entries.length}</span>
        {onClose ? (
          <button type="button" className={styles.close} onClick={onClose} aria-label={t.log.close}>
            <span aria-hidden="true">×</span>
          </button>
        ) : null}
      </h2>
      {newestFirst.length === 0 ? (
        <p className={styles.empty}>{t.log.empty}</p>
      ) : (
        <ul ref={listRef} className={styles.list} aria-live="polite">
          {newestFirst.map((entry, index) => {
            const upset = isUpsetEntry(entry)
            return (
              <li
                key={entry.id}
                className={[styles.entry, TONE_CLASS[entry.tone], index === 0 ? styles.newest : '']
                  .filter(Boolean)
                  .join(' ')}
              >
                <span className={styles.mark} aria-hidden="true">
                  {TONE_MARK[entry.tone]}
                </span>
                <span className={styles.turn}>{entry.turn}</span>
                <span className={styles.message}>
                  {upset ? <span className={styles.upsetTag}>{t.log.upset}</span> : null}
                  {entry.message}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
