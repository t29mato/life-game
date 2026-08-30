import type { PlayerColor } from '@domain/model/types'

/**
 * The curated colour catalogue: which colours the setup screen offers, and in
 * what order.
 *
 * The domain union in `types.ts` says what *can* exist; this module says what
 * the picker *shows* — the order a tray is laid out in. Kept here, pure and
 * tested, rather than inlined in the component that paints them — the same
 * bargain `passengers.ts` already strikes for the back seat.
 */

/** Every colour the tray offers, first six in their historical order. */
export const PLAYER_COLORS: readonly PlayerColor[] = [
  'red',
  'blue',
  'green',
  'yellow',
  'purple',
  'orange',
  'teal',
  'pink',
  'navy',
  'brown',
  'charcoal',
  'cream',
]
