import { useEffect, type ReactElement } from 'react'
import type { Space, SpaceKind } from '@domain/model/types'
import type { Edition } from '@domain/edition/types'
import { editionFor } from '@domain/edition/registry'
import { effectSign } from '@domain/rules/effectSign'
import { describeEffect } from '../../effectSummary'
import { GameIcon } from '../../icons/GameIcon'
import type { Point } from './boardLayout'
import styles from './TilePopover.module.css'

export interface TilePopoverProps {
  readonly space: Space
  /** Where the tap landed, in viewport pixels — the card opens from there. */
  readonly anchor: Point
  readonly onClose: () => void
  /** Whose money the effect line is priced in. Defaults to the original board. */
  readonly edition?: Edition
}

const KIND_LABEL: Readonly<Record<SpaceKind, string>> = {
  start: 'Start',
  normal: 'Space',
  payday: 'Payday',
  // A milestone: its effect always happens, landed on or swept past, but it
  // never holds a turn up for it — see `SpaceKind` in `types.ts`.
  event: 'Milestone',
  // The rare tile left that still halts a turn outright — reserved now for
  // an effect that is a real decision (which house, whether to retire), not
  // just a spin to press.
  stop: 'Decision',
  retirement: 'Retirement',
}

/** Matches `.card`'s own `width: min(280px, calc(100vw - 24px))` in the CSS module. */
const CARD_WIDTH = 280
const VIEWPORT_MARGIN = 12

/**
 * Where the card centres horizontally, clamped so a tap near either edge of
 * a narrow phone screen never pushes it half off-screen. Centring on the
 * tap outright, then correcting only near the two edges (the original
 * approach here), missed the case of a tap near the *left* edge entirely —
 * every screen this narrow has two edges to clamp against, not one.
 */
function clampedCentreX(anchorX: number): number {
  const width = Math.min(CARD_WIDTH, window.innerWidth - VIEWPORT_MARGIN * 2)
  const half = width / 2
  const min = half + VIEWPORT_MARGIN
  const max = window.innerWidth - half - VIEWPORT_MARGIN
  return Math.min(Math.max(anchorX, min), max)
}

/**
 * What a tapped tile actually is, read straight off its own space
 * definition — the same `title`/`description` the event card already shows
 * once a player lands here, offered early to anyone curious enough to ask.
 *
 * Opens from wherever the tap landed rather than centred on the screen —
 * reads the actual viewport once on mount instead of fighting layout with
 * pure CSS, since which side of the tap the card has room to open on
 * depends on where on the screen that tap was.
 */
export function TilePopover({ space, anchor, onClose, edition }: TilePopoverProps): ReactElement {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const opensAbove = anchor.y > window.innerHeight * 0.6

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div
        className={styles.card}
        data-side={opensAbove ? 'above' : 'below'}
        style={{ left: clampedCentreX(anchor.x), top: anchor.y }}
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
        {/* What happens, then why it is funny — in that order. The first line
            is derived from the effect itself (`describeEffect`), so it cannot
            drift from what the tile actually does; the second is the tile's
            own flavour, which is what this card used to open with and all it
            used to say. */}
        <p className={styles.effect} data-sign={effectSign(space.effect)}>
          {describeEffect(space.effect, edition ?? editionFor(undefined))}
        </p>
        <p className={styles.description}>{space.description}</p>
      </div>
    </div>
  )
}
