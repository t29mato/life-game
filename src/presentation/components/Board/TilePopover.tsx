import { useEffect, useRef, type ReactElement } from 'react'
import type { Space, SpaceKind } from '@domain/model/types'
import type { Edition } from '@domain/edition/types'
import { editionFor } from '@domain/edition/registry'
import { effectSign } from '@domain/rules/effectSign'
import { describeEffect } from '../../effectSummary'
import { GameIcon } from '../../icons/GameIcon'
import { useEditionText, useUi } from '../../i18n/LocaleProvider'
import type { UiText } from '../../i18n/en'
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

/**
 * What a tile's `kind` is called. A switch rather than a lookup table so the
 * catalogue can keep its groups flat — a `Record<SpaceKind, string>` nested
 * inside a group would need a deeper merge than `ui.ts` does.
 */
function kindLabel(kind: SpaceKind, t: UiText): string {
  switch (kind) {
    case 'start':
      return t.tile.kindStart
    case 'payday':
      return t.tile.kindPayday
    // A milestone: its effect always happens, landed on or swept past, but it
    // never holds a turn up for it — see `SpaceKind` in `types.ts`.
    case 'event':
      return t.tile.kindEvent
    // The rare tile left that still halts a turn outright — reserved now for
    // an effect that is a real decision (which house, whether to retire), not
    // just a spin to press.
    case 'stop':
      return t.tile.kindStop
    case 'retirement':
      return t.tile.kindRetirement
    case 'normal':
      return t.tile.kindNormal
  }
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
  const cardRef = useRef<HTMLDivElement>(null)
  const t = useUi()
  /*
   * The tile's own prose, in the reader's language. The live `description` is
   * passed alongside the id so a tile currently showing its Hard-difficulty
   * sentence gets the Hard-difficulty translation rather than the one written
   * for Normal — see `editionTextFor`. Untranslated, both fall through to the
   * English already on the space.
   */
  const text = useEditionText(edition?.id)
  const translated = text.space(space.id, space.description)
  const title = translated?.title ?? space.title
  const description = translated?.description ?? space.description

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  /*
   * Dismissal by pressing elsewhere, without eating that press.
   *
   * This used to be a full-viewport backdrop with an `onClick` — which meant
   * a player who had a tile's card open and then reached for the die hit the
   * backdrop instead: the card closed, the die did nothing, and the roll took
   * two clicks (issue #34). The backdrop is `pointer-events: none` now, so
   * nothing is ever intercepted, and the outside press is heard here on the
   * document instead. The die (or whatever else was under the cursor) gets
   * the very same press it was always aimed at.
   *
   * `pointerdown`, and safe to bind immediately: the card is opened from the
   * board's `pointerup`, so the gesture that opened it is already finished by
   * the time this effect runs and cannot close it again on the way out.
   */
  useEffect(() => {
    const onPointerDown = (event: PointerEvent): void => {
      const target = event.target
      if (target instanceof Node && cardRef.current?.contains(target)) return
      onClose()
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [onClose])

  const opensAbove = anchor.y > window.innerHeight * 0.6

  return (
    <div className={styles.backdrop}>
      <div
        ref={cardRef}
        className={styles.card}
        data-side={opensAbove ? 'above' : 'below'}
        style={{ left: clampedCentreX(anchor.x), top: anchor.y }}
        role="dialog"
        aria-label={title}
      >
        <header className={styles.header}>
          <span className={styles.icon}>
            <GameIcon name={space.icon} size={28} />
          </span>
          <div className={styles.headText}>
            <span className={styles.kind}>{kindLabel(space.kind, t)}</span>
            <h2 className={styles.title}>{title}</h2>
          </div>
          <button type="button" className={styles.close} onClick={onClose} aria-label={t.common.close}>
            <span aria-hidden="true">×</span>
          </button>
        </header>
        {/* What happens, then why it is funny — in that order. The first line
            is derived from the effect itself (`describeEffect`), so it cannot
            drift from what the tile actually does; the second is the tile's
            own flavour, which is what this card used to open with and all it
            used to say. */}
        <p className={styles.effect} data-sign={effectSign(space.effect)}>
          {describeEffect(space.effect, edition ?? editionFor(undefined), t)}
        </p>
        <p className={styles.description}>{description}</p>
      </div>
    </div>
  )
}
