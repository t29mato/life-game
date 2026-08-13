/**
 * Who is riding in a player's car, and how to say it.
 *
 * Marriage and children are the two things the board can *show* that a stats
 * panel can only list, so the rules for drawing them — and for describing them
 * to someone who cannot see them drawn — are kept here, pure and tested, rather
 * than buried in the component that paints them.
 */

/** Small pegs drawn in the back before the count is badged instead. */
export const CHILD_PEGS_SHOWN = 3

export interface BackSeat {
  /** How many child pegs to draw. */
  readonly pegs: number
  /** The badge beside them, e.g. `+4`, or `null` when every child has a peg. */
  readonly badge: string | null
}

/**
 * How the back seat is drawn for a given number of children.
 *
 * Past a few children the heads stop being countable at board scale, so the
 * last pegs are traded for a number: two pegs and "+4" is legible where six
 * overlapping heads are not, and it still says exactly how many.
 */
export function childPegs(childCount: number): BackSeat {
  const count = Math.max(0, Math.floor(childCount))
  if (count <= CHILD_PEGS_SHOWN) return { pegs: count, badge: null }
  const pegs = CHILD_PEGS_SHOWN - 1
  return { pegs, badge: `+${count - pegs}` }
}

/**
 * Who is in the car, in a sentence.
 *
 * The board is a single image as far as assistive technology is concerned, so
 * this is the only way a player using one learns that a rival has a full car —
 * and it always reports the true number of children, never the badged one.
 */
export function describeCar(name: string, isMarried: boolean, childCount: number): string {
  const count = Math.max(0, Math.floor(childCount))
  const seats = [
    isMarried ? 'a partner alongside' : null,
    count === 1 ? '1 child' : count > 1 ? `${count} children` : null,
  ].filter((seat): seat is string => seat !== null)

  if (seats.length === 0) return `${name}, driving alone`
  if (seats.length === 1) return `${name}, driving with ${seats[0] as string}`
  return `${name}, driving with ${seats[0] as string} and ${seats[1] as string}`
}
