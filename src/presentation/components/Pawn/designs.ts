import type { DriverFace, PlayerColor } from '@domain/model/types'

/**
 * The curated design catalogue: which faces and colours the setup screen
 * offers, in what order, and what to call each one out loud.
 *
 * The domain unions in `types.ts` say what *can* exist; this module says what
 * the pickers *show* — the order a tray is laid out in, and the words a
 * screen reader (or an aria-label assertion) gets for each chip. Kept here,
 * pure and tested, rather than inlined in the component that paints them —
 * the same bargain `passengers.ts` already strikes for the back seat.
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

/** The plain factory look leads, so "no choice" and "first option" agree. */
export const DRIVER_FACES: readonly DriverFace[] = [
  'classic',
  'cheerful',
  'determined',
  'cool',
  'surprised',
  'sleepy',
]

/** What an absent choice reads as — on old saves and on untouched rows alike. */
export const DEFAULT_DRIVER_FACE: DriverFace = 'classic'

const FACE_LABELS: Record<DriverFace, string> = {
  classic: 'Classic face',
  cheerful: 'Cheerful face',
  determined: 'Determined face',
  cool: 'Cool face, sunglasses on',
  surprised: 'Surprised face',
  sleepy: 'Sleepy face',
}

/** The accessible name for a face chip — and the only prose a face carries. */
export function faceLabel(face: DriverFace): string {
  return FACE_LABELS[face]
}
