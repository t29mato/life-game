import { useEffect, type ReactElement } from 'react'
import type { Space, SpaceKind } from '@domain/model/types'
import { GameIcon } from '../../icons/GameIcon'
import type { Point } from './boardLayout'
import styles from './TilePopover.module.css'

export interface TilePopoverProps {
  readonly space: Space
  /** Where the tap landed, in viewport pixels — the card opens from there. */
  readonly anchor: Point
  readonly onClose: () => void
}

const KIND_LABEL: Readonly<Record<SpaceKind, string>> = {
  start: 'Start',
  normal: 'Space',
  payday: 'Payday',
  stop: 'Stop',
  retirement: 'Retirement',
}

/**
 * What a tapped tile actually is, read straight off its own space
 * definition — the same `title`/`description` the event card already shows
 * once a player lands here, offered early to anyone curious enough to ask.
 *
 * Opens from wherever the tap landed rather than centred on the screen —
 * `useEffect` here reads the actual viewport once on mount instead of
 * fighting layout with pure CSS, since which side of the tap the card has
 * room to open on depends on where on the screen that tap was.
 */
export function TilePopover({ space, anchor, onClose }: TilePopoverProps): ReactElement {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const opensAbove = anchor.y > window.innerHeight * 0.6
  const opensLeft = anchor.x > window.innerWidth * 0.65

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div
        className={styles.card}
        data-side={opensAbove ? 'above' : 'below'}
        data-align={opensLeft ? 'left' : 'right'}
        style={{ left: anchor.x, top: anchor.y }}
        role="dialog"
        aria-label={space.title}
        onClick={(event) => event.stopPropagation()}
      >
        <header className={styles.header}>
          <span className={styles.icon}>
            <GameIcon name={space.icon} size={28} />
          </span>
          <div className={styles.headText}>
            <span className={styles.kind}>{KIND_LABEL[space.kind]}</span>
            <h2 className={styles.title}>{space.title}</h2>
          </div>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Close">
            <span aria-hidden="true">×</span>
          </button>
        </header>
        <p className={styles.description}>{space.description}</p>
      </div>
    </div>
  )
}
