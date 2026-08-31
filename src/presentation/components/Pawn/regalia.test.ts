import { describe, expect, it } from 'vitest'
import { driverRegalia } from './regalia'

describe('driverRegalia', () => {
  it('caps the fresh graduate — degree in hand, no trade yet', () => {
    expect(driverRegalia(true, null)).toBe('mortarboard')
  })

  it('leaves the undecorated peg bare', () => {
    expect(driverRegalia(false, null)).toBeNull()
  })

  it('yields the head to career gear once a hire lands', () => {
    // One head, one silhouette: the trade's family colour is the live
    // gameplay signal, so the mortarboard comes off on the first day of work.
    expect(driverRegalia(true, 'kitchen')).toBeNull()
    expect(driverRegalia(true, 'office')).toBeNull()
  })

  it('never dresses an unqualified head, whatever the job', () => {
    expect(driverRegalia(false, 'science')).toBeNull()
  })
})
