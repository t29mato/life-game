/**
 * --- tempo -----------------------------------------------------------------
 *
 * Every number in this file is a *pacing* number: how long one beat of the
 * play loop is allowed to hold the table up. They were scattered across five
 * components before — a die's throw length in `Dice.tsx`, a hop's in
 * `Pawn.tsx`, a card's dwell nowhere at all because there wasn't one — which
 * made the one question a playtest actually asks ("why does a turn take
 * thirty seconds?") unanswerable without reading all five and adding them up.
 * They live together now so the sum can be read, and tuned, in one place.
 *
 * The judgement they encode came from a playtest against Nintendo's house
 * pacing, and it is worth stating because it is what these numbers are for:
 * **the distance between a player's input and the game's answer is the whole
 * feel of the game.** Mario Party has the token hopping 0.3s after the die is
 * struck. Anything longer than about half a second with nothing moving on
 * screen does not read as anticipation — it reads as a hang.
 *
 * So the rules the numbers below obey:
 *
 * 1. Result to motion: ≤ 500ms. Whatever a die has to say, the car starts
 *    moving within half a second of it saying it.
 * 2. No dead air. If a beat genuinely needs time — a result worth reading,
 *    a passed tile worth seeing — something moves during it. A still screen
 *    is a bug even when it is deliberate.
 * 3. Nothing a player did not choose asks for a press. A card is what a
 *    *choice* looks like; a thing that merely happened gets a pop and gets
 *    out of the way.
 *
 * Seconds where framer-motion wants seconds, milliseconds where `setTimeout`
 * does, and the unit is in the name so nobody has to guess. Reduced motion is
 * handled at each call site rather than here: some of these are motion (which
 * collapses to nothing) and some are *dwell* (which must not, or the pop a
 * reduced-motion player is meant to read would flash past unread).
 *
 * Every number below is authored for a person at the table; `SCALE` divides
 * the lot of them under the test runner. See the note on it for why.
 */

/**
 * How fast the clock these beats are quoted on actually runs: one under a
 * player, a quarter of that under `vitest`.
 *
 * This is *not* "turn the animations off in tests". Every beat still happens,
 * in the same order, asynchronously, spread over many animation frames — and
 * that ordering is the entire thing the presentation tests assert: the card
 * is held back while the die is still in the air, the final standings are not
 * readable over the throw that decided them, a computer seat's answer reaches
 * the die by itself. Reduced motion, the other lever available here, *would*
 * weaken those: it collapses a throw to a synchronous assignment, so a test
 * that presses the die and then checks the results are not showing yet would
 * be checking nothing. Dividing the clock keeps the shape and drops only the
 * wall-clock cost.
 *
 * The cost was the bug (issue #45). A `waitFor` re-runs its callback on every
 * DOM mutation, an animating frame is a DOM mutation, and each re-run is a
 * whole-document query over this app's ~5,500-node board — so a wait spanning
 * one 2-second die throw pays for a dozen of them, and pays more the busier
 * the machine is. `App.test.tsx`'s two worst tests measured 11–13 s against
 * `waitFor` budgets of 8–15 s on an idle machine and 16–20 s on a loaded one,
 * which is why the file came up red at random. The polls are synchronous, so
 * this compounds: a poll blocks the timers and frames of the very beat it is
 * waiting for. Shortening the beats cuts the frames, the polls, and the
 * blocking together.
 *
 * A quarter and no further on purpose. A handful of tests press the die and
 * assert, in the very next statement, that the result is *not* on screen yet
 * — so the beat has to outlast the gap between React committing the press
 * (where `Dice`'s effect starts the throw) and the assertion running, which
 * is a single `setTimeout(0)` inside `userEvent`. At a quarter the die still
 * owes ~250 ms of throw and settle there. Cutting to zero, or reaching for
 * `prefers-reduced-motion`, would not make those assertions fast — it would
 * make them vacuous, since the result would already be on screen.
 *
 * `import.meta.env.MODE` and not a mutable setter because several components
 * read a tempo at module scope (`Dice.tsx`'s `RETURN_DELAY`, and others), so
 * the value has to be right at import time, before any test body runs. Vite
 * replaces it statically, so a production bundle folds `SCALE` to 1 and keeps
 * none of this.
 */
const SCALE = import.meta.env.MODE === 'test' ? 0.25 : 1

/**
 * The same division, for a pacing number that lives outside the table below.
 * There is exactly one — `CPU_THINK_MS` (`decideCpuCommand.ts`), which cannot
 * simply move in here: `estimatePlaytime` prices a *real* game off it for the
 * title screen, and that estimate must not shrink just because a test is
 * running. So the constant stays honest and the timer that reads it is paced.
 */
export const paced = (ms: number): number => ms * SCALE

const AUTHORED = {
  /**
   * The die's flight, launch to flat on the table. Was 1.4s, which put the
   * settle's tail — see below — past 2.6s from press to number; measured, not
   * estimated. The physics still bounces two to four times at this length and
   * the faces are still readable mid-tumble, which is the only thing the long
   * throw was ever buying.
   */
  dieThrowSeconds: 0.85,
  /**
   * Base for the corrective settle onto the rolled face, scaled by how far
   * the cube still has to tip. This is the beat the playtest actually felt as
   * dead: the die is flat on the table, visibly stopped, and still owes up to
   * a full slow turn before the number is legible. Halved, and its per-turn
   * multiplier cut with it (`SETTLE_TIME_PER_TURN` in `Dice.tsx`).
   */
  dieSettleSeconds: 0.26,
  /** How long the number is left where the throw ended before the die glides
   * back under the button. Purely cosmetic — it runs *after* the result has
   * been reported and the car is already moving — but a die still sliding
   * around under a moving car is one motion too many, so it is shorter now. */
  dieReturnDelaySeconds: 0.5,
  dieReturnSeconds: 0.4,

  /**
   * One tile of travel. The reference is Mario Party's 0.25–0.35s hop; 280ms
   * sits in the middle of it and is what the report asked for by name. Fast
   * enough that six tiles is under two seconds, slow enough that the
   * squash-and-stretch on each landing still reads as a step rather than a
   * blur.
   */
  pawnHopSeconds: 0.28,
  /**
   * The last tile of a move, which gets a little more room — a short crouch
   * before it leaves and a slower arc across. Anticipation is how animation
   * says "this one matters", and the last hop is the one that decides the
   * turn. Deliberately only ~35% longer: a real pause here would be exactly
   * the dead beat the rest of this file exists to delete.
   */
  pawnFinalHopSeconds: 0.38,
  /** The crouch itself, before the final hop launches. */
  pawnAnticipationSeconds: 0.09,
  /** A parked car sliding aside to make room for an arriving rival. */
  pawnSettleSeconds: 0.24,

  /**
   * How long a demoted passing-event pop stays on the board before the move
   * carries on. This is a *dwell*, not an animation: it is the whole time a
   * player has to read "Payday +$37,000" before the car sets off again, so it
   * survives reduced motion. Long enough to read a short line, short enough
   * that the four pops of a bad five-tile move cost under four seconds
   * between them — where the four cards they replaced cost four presses and
   * the better part of half a minute.
   */
  passingPopMs: 900,

  /**
   * The turn banner, for a turn that opens with no device to hand over. One
   * beat of "your turn", then gone, with no press in it. Slightly over a
   * second: shorter and a player glancing up misses whose turn it is, which
   * is the one job it has.
   */
  turnBannerMs: 1200,

  /**
   * The confirm beat on a chosen option: the chosen card is held, lit and
   * alone, for this long before the game moves on. Feedback, not decoration —
   * it survives reduced motion, because "did my press register?" is a
   * question motion preference has no opinion about.
   */
  choiceConfirmMs: 400,
  /** How long the small toast naming the choice rides over the board
   * afterwards. Non-blocking: play has already carried on underneath it. */
  choiceToastMs: 1600,

  /**
   * The rolled number's flight from the die to over the car. It exists to
   * make rule 2 above structurally true rather than merely fast: even at
   * ~1.2s from press to result there is a hand-off moment between "the die
   * has spoken" and "the car has started", and something is moving through
   * all of it.
   */
  rollFlightSeconds: 0.62,

  /**
   * The title wordmark's idle breath — the attract loop. Rule 2 ("no dead
   * air") applies to a screen nobody has pressed anything on yet as much as
   * it does to a turn: a title card that is perfectly still reads as a
   * screenshot, and a player's first question becomes "has it loaded?"
   * rather than "which of these two buttons do I want?".
   *
   * Long and slow on purpose. This is the one animation on screen that is
   * *not* answering an input, so it must never compete with the two buttons
   * beneath it for attention — the eye should catch the movement only if it
   * rests there. Deliberately out of phase with the drifting scenery behind
   * it and the ring of pieces around it, for the same reason those are out
   * of phase with each other: three things breathing on one clock read as
   * one mechanism.
   */
  titleIdleSeconds: 7.2,

  /**
   * One step of the new-game flow arriving. The flow is players → country →
   * difficulty, one decision per screen, and each press swaps the whole
   * middle of the screen — so there has to be *some* motion saying which
   * direction the flow just went, or the screen appears to have teleported
   * and a player loses their place in a three-step sequence.
   *
   * Kept under a quarter of a second: this sits directly between a press and
   * its answer, which rule 1 caps at 500ms for a die and which a menu should
   * beat comfortably. It is an entrance only — the outgoing step is not
   * animated out, because waiting for a screen to leave before the next one
   * arrives is exactly the dead beat this file exists to delete.
   */
  titleStepSeconds: 0.22,

  /**
   * One breath of the idle die's bob, up and back down.
   *
   * Pure invitation, and the only thing on screen while the game is waiting
   * for a press: a die that sits perfectly still reads as a picture of a die
   * (which is exactly how the playtest read it — it also still had the
   * *previous* player's number on it). Slow on purpose. A quick bob is a
   * notification; this is an object idling, the way a Mario Party die hangs
   * over the token whose turn it is.
   */
  dieIdleBobSeconds: 1.7,

  /**
   * The gap between the board's own furniture leaving and a card arriving
   * over it.
   *
   * The playtest saw every card fade *through* the board's die and its "0 TO
   * GO" badge, because both were crossfading at once: two frames of the game
   * visible in the same pixels, which reads as a rendering fault rather than
   * as a transition. So the order is made explicit — the dock fades out over
   * this long, and the card's own entrance waits exactly this long before it
   * starts. Old out, then new in, with a beat of clean board between them.
   *
   * Short enough that it costs the turn nothing a player can name: rule 1
   * above allows 500ms between a result and the motion answering it, and
   * this spends a quarter of that budget to delete a ghost.
   */
  overlayHandoverMs: 130,

  /**
   * How long each tile of the road ahead waits before it lights, once the
   * roll has settled and the path is known.
   *
   * The lights run *ahead* of the car rather than under it — six tiles are
   * all lit inside half a second, well before a 280ms-per-hop car has
   * covered two of them — because the question they answer ("am I stopping
   * here or driving through?") is one a player wants answered before the
   * move, not narrated during it.
   */
  pathLightStepSeconds: 0.07,
} as const

/**
 * The table as everything else reads it, on whichever clock is running.
 *
 * Mapped rather than written out with a `* SCALE` on each line so that a beat
 * added later is paced by construction — a number that quietly stayed on the
 * real clock would put exactly one four-second wait back into the suite and
 * be very hard to find.
 */
export const TEMPO: { readonly [Beat in keyof typeof AUTHORED]: number } = Object.freeze(
  Object.fromEntries(Object.entries(AUTHORED).map(([beat, value]) => [beat, value * SCALE])),
) as { readonly [Beat in keyof typeof AUTHORED]: number }
