import { describe, expect, it } from 'vitest'
import { TEMPO } from './tempo'

/*
 * Pacing is tested here as *relationships between beats*, never as wall-clock
 * behaviour. A test that presses the wheel and samples a hundred-millisecond
 * window on a loaded machine is the exact flake this repo has already paid
 * for once (see AGENTS.md §3); a test that states what a number is for, and
 * what it must stay equal to, costs nothing and survives the machine.
 */
describe('TEMPO', () => {
  /*
   * The whole argument for `eventWheelHoldMs`, in one assertion.
   *
   * The board's own wheel sits in its tray and nothing takes it away, so a
   * player can look at what it stopped on for as long as they like. A wheel
   * inside `EventSpinModal` got none of that: `Wheel` lit the winning segment
   * and called back in the same commit, and `App` unmounted the modal on the
   * next one — so the answer was on screen for somewhere between zero and one
   * frame, which is what a player reported on a pay-per-pip payday where the
   * face *is* the wage.
   *
   * A dwell, not an animation: it is the time a number stays readable, which
   * is not a motion preference and not something the test clock may collapse
   * to nothing either. `SCALE` divides it like every other authored beat —
   * the point here is only that dividing never reaches zero.
   */
  it('keeps a real hold on whichever clock is running', () => {
    expect(TEMPO.eventWheelHoldMs).toBeGreaterThan(0)
  })

  /*
   * And it stays inside rule 1's budget on the other side: the card behind
   * waits `overlayHandoverMs` after the wheel's card goes, and the two
   * together are the whole gap between one screen and the next.
   */
  it('leaves the handover to the card shorter than the hold before it', () => {
    expect(TEMPO.overlayHandoverMs).toBeLessThan(TEMPO.eventWheelHoldMs)
  })

  /*
   * The one beat that got longer when the die became a wheel, and the reason
   * it is allowed to: a spin is not a gap before the answer, it *is* the
   * answer arriving, in front of the player, slowly enough to hope over. It
   * has to be clearly longer than the beat a *result* is then held for, or
   * the wheel would be over before the tension it exists for got started.
   */
  it('spends longer on the spin than on the dwell after it', () => {
    expect(TEMPO.wheelSpinSeconds * 1000).toBeGreaterThan(TEMPO.eventWheelHoldMs * 2)
  })
})
