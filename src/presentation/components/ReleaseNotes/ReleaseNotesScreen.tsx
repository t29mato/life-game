import { useEffect, useRef, type KeyboardEvent, type ReactElement } from 'react'
import { ChunkyButton } from '../ChunkyButton/ChunkyButton'
import { RELEASE_NOTES, type ReleaseNote } from './releaseNotes'
import styles from './ReleaseNotesScreen.module.css'

export interface ReleaseNotesScreenProps {
  readonly onClose: () => void
}

interface NoteSection {
  readonly label: string
  readonly items: readonly string[]
}

function sectionsFor(note: ReleaseNote): readonly NoteSection[] {
  return [
    { label: "What's new", items: note.whatsNew },
    { label: 'Changed', items: note.changes },
    { label: 'Fixed', items: note.fixes },
  ].filter((section) => section.items.length > 0)
}

/** `phase === 'setup'`, opened from the title screen: the player-facing changelog. */
export function ReleaseNotesScreen({ onClose }: ReleaseNotesScreenProps): ReactElement {
  const headingRef = useRef<HTMLHeadingElement>(null)

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
        <span className={styles.eyebrow}>What has changed on the way here</span>
        <h1 className={styles.heading} data-text="Release Notes" tabIndex={-1} ref={headingRef}>
          Release Notes
        </h1>
      </header>

      <ul className={styles.history} aria-label="Version history">
        {RELEASE_NOTES.map((note) => (
          <li key={note.version} className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.cardVersion}>Version {note.version}</span>
              <span className={styles.cardDate}>{note.date}</span>
            </div>

            {sectionsFor(note).map((section) => (
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
