import { describe, expect, it } from 'vitest'
import { CAREER_FAMILY, type CareerIconName } from '../CareerPlaque/families'
import { driverGearFamily } from './careerGear'

describe('driverGearFamily', () => {
  it('dresses every trade in its own plaque family — all sixty-two of them', () => {
    // The pawn must never invent a grouping of its own: whatever family the
    // plaque system files a career under is the family its gear is cut for.
    for (const [icon, family] of Object.entries(CAREER_FAMILY)) {
      expect(driverGearFamily(icon as CareerIconName)).toBe(family)
    }
  })

  it('leaves the peg bare before the first hire', () => {
    expect(driverGearFamily(null)).toBeNull()
    expect(driverGearFamily(undefined)).toBeNull()
  })

  it('fails closed on an icon that names no trade', () => {
    expect(driverGearFamily('space:big-promotion')).toBeNull()
    expect(driverGearFamily('house:tiny-cabin')).toBeNull()
  })
})
