import { type CSSProperties, type ReactElement } from 'react'

import { GameIcon } from '../../icons/GameIcon'
import { CAREER_FAMILY, FAMILY_PALETTE, type CareerIconName } from './families'
import styles from './CareerPlaque.module.css'

export interface CareerPlaqueProps {
  readonly icon: CareerIconName
  /** Rendered width in px; the plaque is slightly taller than wide. */
  readonly size?: number
  /**
   * Accessible label. Omit when the plaque sits beside its own text — the
   * art is then decoration, hidden from AT rather than read twice.
   */
  readonly title?: string | undefined
}

/**
 * A trade as a manufactured object: the portrait set into an arch-topped
 * tile of moulded plastic, cast in its family's colour.
 *
 * This is what a career renders as anywhere there is room for more than a
 * list row — a fair's roll-outcome table, a decision card, the handbook's
 * catalogue. The portrait itself is the same bespoke drawing `GameIcon`
 * serves; what the plaque adds is material (gradient plastic, a lip below,
 * a gloss above, per `docs/DESIGN.md`'s moulded family) and the family
 * colour, so two offers read as two different worlds before either name is.
 * At list-chip size none of that survives the pixels — the small contexts
 * keep drawing the bare category glyph, exactly as before.
 */
export function CareerPlaque({ icon, size = 64, title }: CareerPlaqueProps): ReactElement {
  const palette = FAMILY_PALETTE[CAREER_FAMILY[icon]]
  return (
    <span
      className={styles.plaque}
      data-family={CAREER_FAMILY[icon]}
      style={
        {
          '--plaque-size': `${size}px`,
          '--family-light': palette.light,
          '--family-base': palette.base,
          '--family-dark': palette.dark,
        } as CSSProperties
      }
    >
      {/* size=64 keeps `GameIcon` on the bespoke drawing whatever the CSS
          box measures — a plaque is precisely the context the full portrait
          was drawn for, and it is never rendered below legible size. */}
      <GameIcon name={icon} size={64} className={styles.art} title={title} />
      <span className={styles.gloss} aria-hidden="true" />
    </span>
  )
}
