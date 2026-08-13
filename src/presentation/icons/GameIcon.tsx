import { type ReactElement } from 'react'

import type { IconName } from '@domain/model/icons'

import { glyphArt } from './art/glyphs'
import { categoryOf } from './categories'
import { iconRegistry } from './registry'

/**
 * Below this rendered size the bespoke illustrations blur into noise, so the
 * subject's category glyph is drawn instead: bold silhouettes that stay
 * legible at the 16–28px the panels and lists use. At and above it — the
 * event card, the career/house/stock choices — the full drawing, with all its
 * character, is worth the pixels.
 */
const BESPOKE_MIN_PX = 34

export interface GameIconProps {
  readonly name: IconName
  /** Rendered size in px. The art is drawn on a 64×64 grid and scales freely. */
  readonly size?: number
  readonly className?: string | undefined
  /**
   * Accessible label. Omit for decoration that sits beside its own text — the
   * icon is then hidden from assistive technology instead of repeating it.
   */
  readonly title?: string | undefined
}

/**
 * Draws one of the game's illustrations.
 *
 * Art is looked up by the domain's semantic `IconName`, so content decides
 * *what* is shown and this layer decides *how* it is drawn — including how
 * much of it: small renderings get the subject's category glyph, large ones
 * the bespoke illustration. Every name in the union has both; the tests in
 * `registry.test.tsx` fail the build if either goes missing.
 */
export function GameIcon({ name, size = 32, className, title }: GameIconProps): ReactElement {
  const Art = size >= BESPOKE_MIN_PX ? iconRegistry[name] : glyphArt[categoryOf[name]]

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {title ? <title>{title}</title> : null}
      <Art />
    </svg>
  )
}

export interface GameIconGlyphProps {
  readonly name: IconName
  /** Width and height of the drawn box, in the surrounding SVG's user units. */
  readonly size: number
  /** Centre of the box, in the surrounding SVG's user units. */
  readonly x?: number
  readonly y?: number
}

/**
 * The board's version: a bare `<g>` for callers already inside an SVG — the
 * board draws sixty-eight of these and cannot nest a document per tile.
 *
 * It always draws the category glyph, never the bespoke art. `size` here is
 * in the board's user units, which the camera scales freely, so on-screen a
 * tile may be a couple of dozen pixels — precisely where only the sixteen
 * bold silhouettes stay tellable apart.
 */
export function GameIconGlyph({ name, size, x = 0, y = 0 }: GameIconGlyphProps): ReactElement {
  const Art = glyphArt[categoryOf[name]]
  const scale = size / 64

  return (
    <g transform={`translate(${x - size / 2} ${y - size / 2}) scale(${scale})`}>
      <Art />
    </g>
  )
}
