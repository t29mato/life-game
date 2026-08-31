import type { Difficulty } from '@domain/model/types'
import { CPU_THINK_MS } from '@application/cpu/decideCpuCommand'

/**
 * Mean rounds to finish a game, measured rather than guessed: 60 seeded
 * all-CPU games per cell on the harness `src/test/gameBalance.test.ts` drives,
 * across 2–4 seats, came out at 17.8–18.7 rounds on normal, 18.7–20.7 on hard
 * and 20.1–21.5 on very hard. A round is one lap through every seat (`turn`
 * in `endTurn.ts` increments once per wrap to the first seat), so the count
 * barely moves with how many seats there are — more seats mean more real time
 * *per* round, which is what the arithmetic below prices, not more rounds.
 */
const ROUNDS: Readonly<Record<Difficulty, number>> = {
  normal: 18,
  hard: 20,
  veryHard: 21,
}

/**
 * What a human seat costs per turn, in seconds. Unknowable exactly — it is a
 * person reading an event card, weighing the occasional decision, and
 * physically passing the device (`TurnHandoff` exists for that real second) —
 * so it is carried as a modest range and the estimate stays a range too.
 */
const HUMAN_TURN_SECONDS: readonly [number, number] = [20, 30]

/** The die's roll and settle (`Dice.tsx` `rollDuration` + `settleDuration`). */
const DIE_SECONDS = 1.4 + 0.42

/** One pawn hop (`Pawn.tsx` `hopDuration`) times the die's average roll of 3.5. */
const TRAVEL_SECONDS = 3.5 * 0.32

/**
 * A representative computer turn, summed from the pauses its turn actually
 * takes rather than assumed: the think beats in `CPU_THINK_MS`, the die's own
 * animation, and the pawn's travel. A decision or a pass-through card does not
 * happen every turn, so those two beats are counted at half weight.
 */
const CPU_TURN_SECONDS =
  (CPU_THINK_MS.awaitingSpin +
    CPU_THINK_MS.resolved +
    (CPU_THINK_MS.awaitingDecision + CPU_THINK_MS.passingEvent) / 2) /
    1000 +
  DIE_SECONDS +
  TRAVEL_SECONDS

/**
 * Raw minutes for a table of this mix, low and high ends of the human range.
 * Exported unrounded so the tests can pin the arithmetic itself — including
 * that adding a seat of either kind always raises the estimate.
 */
export function estimateMinutes(
  humans: number,
  cpus: number,
  difficulty: Difficulty,
): readonly [number, number] {
  const rounds = ROUNDS[difficulty]
  const cpuSeconds = cpus * CPU_TURN_SECONDS
  return [
    (rounds * (humans * HUMAN_TURN_SECONDS[0] + cpuSeconds)) / 60,
    (rounds * (humans * HUMAN_TURN_SECONDS[1] + cpuSeconds)) / 60,
  ]
}

/** Nearest five minutes, floored at five — "about", never "27.4 minutes". */
const roundMinutes = (minutes: number): number => Math.max(5, Math.round(minutes / 5) * 5)

const seatPhrase = (count: number, kind: string): string =>
  `${count} ${kind} seat${count === 1 ? '' : 's'}`

/**
 * One honest line about how long this table will sit, for the title screen:
 * "About 10–20 min for 2 human seats." The two ends collapse to a single
 * figure when rounding brings them together — an all-CPU table has no human
 * range at all.
 */
export function estimatePlaytime(humans: number, cpus: number, difficulty: Difficulty): string {
  const [low, high] = estimateMinutes(humans, cpus, difficulty)
  const [lowRounded, highRounded] = [roundMinutes(low), roundMinutes(high)]
  const span = lowRounded === highRounded ? `${lowRounded}` : `${lowRounded}–${highRounded}`
  const seats = [
    humans > 0 ? seatPhrase(humans, 'human') : null,
    cpus > 0 ? seatPhrase(cpus, 'CPU') : null,
  ]
    .filter((part): part is string => part !== null)
    .join(' and ')
  return `About ${span} min for ${seats}.`
}
