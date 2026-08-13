import { describe, expect, it } from 'vitest'
import { CHILD_PEGS_SHOWN, childPegs, describeCar } from './passengers'

describe('describeCar', () => {
  /**
   * The board is one image as far as assistive technology is concerned, so a
   * player's marriage and their children — the two things the board can show
   * that a stats panel can only list — have to be sayable in words.
   */
  it('says who is driving alone', () => {
    expect(describeCar('Alice', false, 0)).toBe('Alice, driving alone')
  })

  it('names a partner', () => {
    expect(describeCar('Alice', true, 0)).toBe('Alice, driving with a partner alongside')
  })

  it('counts one child in the singular', () => {
    expect(describeCar('Bo', false, 1)).toBe('Bo, driving with 1 child')
  })

  it('counts several children in the plural', () => {
    expect(describeCar('Bo', false, 3)).toBe('Bo, driving with 3 children')
  })

  it('names a full car', () => {
    expect(describeCar('Cass', true, 2)).toBe(
      'Cass, driving with a partner alongside and 2 children',
    )
  })

  /** The badge caps what is drawn; it must never cap what is said. */
  it('reports the true number of children however many pegs are drawn', () => {
    expect(describeCar('Dee', false, 9)).toBe('Dee, driving with 9 children')
  })

  it('never invents passengers from a nonsense count', () => {
    expect(describeCar('Dee', false, -4)).toBe('Dee, driving alone')
    expect(describeCar('Dee', false, 1.7)).toBe('Dee, driving with 1 child')
  })
})

describe('childPegs', () => {
  it('draws one peg per child up to the cap', () => {
    for (let count = 0; count <= CHILD_PEGS_SHOWN; count += 1) {
      expect(childPegs(count)).toEqual({ pegs: count, badge: null })
    }
  })

  /**
   * Past the cap the heads stop being countable at board scale, so the last
   * pegs are traded for a number that still says exactly how many.
   */
  it('badges the overflow rather than crowding the back seat', () => {
    expect(childPegs(4)).toEqual({ pegs: 2, badge: '+2' })
    expect(childPegs(7)).toEqual({ pegs: 2, badge: '+5' })
  })

  it('never draws more glyphs than the cap, however big the family', () => {
    for (let count = 0; count < 40; count += 1) {
      const { pegs, badge } = childPegs(count)
      expect(pegs + (badge ? 1 : 0)).toBeLessThanOrEqual(CHILD_PEGS_SHOWN)
    }
  })

  it('never draws a negative back seat', () => {
    expect(childPegs(-3)).toEqual({ pegs: 0, badge: null })
  })

  it('is pure', () => {
    expect(childPegs(5)).toEqual(childPegs(5))
  })
})
