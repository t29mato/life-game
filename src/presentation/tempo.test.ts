import { describe, expect, it } from 'vitest'
import { TEMPO } from './tempo'

/*
 * Pacing is tested here as *relationships between beats*, never as wall-clock
 * behaviour. A test that presses a die and samples a hundred-millisecond
 * window on a loaded machine is the exact flake this repo has already paid
 * for once (see AGENTS.md §3); a test that states what a number is for, and
 * what it must stay equal to, costs nothing and survives the machine.
 */
describe('TEMPO', () => {
  /*
   * The whole argument for `eventDieHoldMs`, in one assertion.
   *
   * It is not a new pause. The board's own die has always had
   * `dieReturnDelaySeconds` of sitting on the number it rolled before it
   * glides back under the button, because it is docked beside the map and
   * nothing ever takes it away. A die inside `EventSpinModal` got none of it:
   * `Dice` painted the settled face and called back in the same commit, and
   * `App` unmounted the modal on the next one — so the answer was on screen
   * for somewhere between zero and one frame, which is what a player
   * reported on a pay-per-pip payday where the face *is* the wage.
   *
   * Equal, and deliberately not "at least": the card leaves at the moment the
   * die stops being still, so the last thing on screen is always the number
   * and never a cube gliding off with the answer still on it. If somebody
   * retunes the die's return, this beat moves with it or this test says so.
   */
  it('holds a card’s die for exactly the dwell the board’s die already gets', () => {
    expect(TEMPO.eventDieHoldMs).toBe(TEMPO.dieReturnDelaySeconds * 1000)
  })

  /*
   * A dwell, not an animation: it is the time a number stays readable, which
   * is not a motion preference and not something the test clock may collapse
   * to nothing either. `SCALE` divides it like every other authored beat —
   * the point here is only that dividing never reaches zero.
   */
  it('keeps a real hold on whichever clock is running', () => {
    expect(TEMPO.eventDieHoldMs).toBeGreaterThan(0)
  })

  /*
   * And it stays inside rule 1's budget on the other side: the card behind
   * waits `overlayHandoverMs` after the die's card goes, and the two together
   * are the whole gap between one screen and the next.
   */
  it('leaves the handover to the card shorter than the hold before it', () => {
    expect(TEMPO.overlayHandoverMs).toBeLessThan(TEMPO.eventDieHoldMs)
  })
})
