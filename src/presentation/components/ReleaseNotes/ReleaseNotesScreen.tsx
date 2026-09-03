import { useEffect, useRef, type KeyboardEvent, type ReactElement } from 'react'
import { ChunkyButton } from '../ChunkyButton/ChunkyButton'
import { useBackDismiss } from '../../hooks/useBackDismiss'
import { useUi } from '../../i18n/LocaleProvider'
import type { UiText } from '../../i18n/en'
import { RELEASE_NOTES, type ReleaseNote } from './releaseNotes'
import styles from './ReleaseNotesScreen.module.css'

export interface ReleaseNotesScreenProps {
  readonly onClose: () => void
}

interface NoteSection {
  readonly label: string
  readonly items: readonly string[]
}

function sectionsFor(note: ReleaseNote, t: UiText): readonly NoteSection[] {
  return [
    { label: t.notes.whatsNew, items: note.whatsNew },
    { label: t.notes.changed, items: note.changes },
    { label: t.notes.fixed, items: note.fixes },
  ].filter((section) => section.items.length > 0)
}

/** `phase === 'setup'`, opened from the title screen: the player-facing changelog. */
export function ReleaseNotesScreen({ onClose }: ReleaseNotesScreenProps): ReactElement {
  const headingRef = useRef<HTMLHeadingElement>(null)
  const t = useUi()

  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  // A screen, not a dialog sitting over the title — but with nothing of its
  // own in the browser's history, a back gesture used to fall straight
  // through to whatever page came before the game entirely, since there was
  // no entry here for it to stop on first.
  useBackDismiss(onClose)

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
        <span className={styles.eyebrow}>{t.notes.eyebrow}</span>
        <h1 className={styles.heading} data-text={t.notes.heading} tabIndex={-1} ref={headingRef}>
          {t.notes.heading}
        </h1>
      </header>

      {/* The entries themselves stay in English in every language. They are a
          developer's changelog written per release — translating them would
          mean translating a new paragraph every time the game ships, which is
          a promise this project cannot keep, and a stale translation of a
          changelog is worse than an untranslated one. */}
      <ul className={styles.history} aria-label={t.notes.historyAria}>
        {RELEASE_NOTES.map((note) => (
          <li key={note.version} className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.cardVersion}>{t.notes.version(note.version)}</span>
              <span className={styles.cardDate}>{note.date}</span>
            </div>

            {sectionsFor(note, t).map((section) => (
              <section key={section.label} className={styles.section}>
                <span className={styles.sectionLabel}>{section.label}</span>
                <ul className={styles.itemList}>
                  {section.items.map((item) => (
                    <li key={item} className={styles.item}>
                      {item}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </li>
        ))}
      </ul>
    </div>
  )
}
