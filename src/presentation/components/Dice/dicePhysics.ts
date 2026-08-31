/**
 * The physics of one throw: a small ballistic simulation the die's animation
 * steps frame by frame, in place of the scripted flight-bounce-settle curves
 * it used to replay identically every roll.
 *
 * The model is deliberately tiny — one vertical axis under constant gravity,
 * a restitution coefficient taking its share of speed at every contact, and a
 * spin rate that loses a bite of itself each time the die touches the table.
 * That is enough for the thing a scripted curve cannot fake: bounces that
 * genuinely decay, at heights and times that differ a little every throw,
 * because the launch itself is dealt slightly differently each time.
 *
 * What the simulation does *not* decide is the number. The store has already
 * rolled; the die only reveals. So the throw here is pure motion — height,
 * travel, tumble — and `Dice.tsx` closes the last few degrees onto the exact
 * resting angle itself, once the bouncing has died out and the correction is
 * too small to tell apart from the die settling of its own accord.
 */

/**
 * Ceiling on one integration sub-step, in seconds. Semi-implicit Euler is
 * plenty stable at this size, but a display frame can arrive late — every
 * `step` call is cut into sub-steps no coarser than this, so a dropped frame
 * cannot tunnel straight through a whole bounce without touching the table.
 */
const MAX_STEP = 0.004

/**
 * Share of impact speed a bounce keeps. The heights this prints — squares of
 * it — are 30-40% of the launch apex for the first bounce, then 8-16%, then
 * a last visible shiver: two to four bounces, each unmistakably smaller than
 * the one before, at the die's actual on-screen sizes.
 */
const RESTITUTION_MIN = 0.55
const RESTITUTION_SPREAD = 0.1

/**
 * Bounce apexes below this share of the launch apex read as at rest — on a
 * 64px dock die that is about a pixel of rise, which is not a bounce anyone
 * can see. Reaching it is what hands the throw over to the settle.
 */
const REST_PEAK = 0.02

/** Full tumbling turns the launch arc itself spins through, before any
 * bounce. Fewer than the throw once took, deliberately: at over two turns
 * the faces went past as a blur, and a roll nobody can read has no suspense
 * in it. The cube still turns over whole times however the contacts bleed
 * the spin afterwards — just slowly enough that a watching player can call
 * the faces as they pass. */
const FLIGHT_TURNS_MIN = 1.6
const FLIGHT_TURNS_SPREAD = 0.4

/** Share of spin surviving each contact with the table. Kept high enough
 * that the die is still visibly turning when the bouncing dies out, so the
 * settle reads as the same momentum finishing, not a fresh push. */
const SPIN_KEPT_MIN = 0.68
const SPIN_KEPT_SPREAD = 0.1

/**
 * How far the launch speed strays from nominal, either way. Eight percent
 * moves the apex and the length of the whole throw by under a fifth — the
 * same hand throwing the same die, not a different thrower every turn.
 */
const LAUNCH_JITTER = 0.08

export interface ThrowFrame {
  /** Height above the table, as a fraction of the nominal launch apex. */
  readonly height: number
  /** Degrees tumbled about the rolling axis since launch. */
  readonly spinAngle: number
  /** 0→1 across the launch arc; drives the outward travel and corkscrew. */
  readonly flightProgress: number
  /** 0→1 from first touchdown to rest; drives the skid back to the dock. */
  readonly returnProgress: number
  /** Impact speed of any contact this frame, as a share of launch speed —
   * zero on every frame the die spends in the air. */
  readonly impact: number
  /** True once the bouncing has died out and the die is flat on the table. */
  readonly grounded: boolean
}

export interface DiceThrow {
  /** Seconds from launch to flat on the table — known before the first
   * frame, because a ballistic bounce schedule is closed-form even when the
   * frames themselves are integrated. This is what lets the caller run the
   * simulation inside a fixed-length animation leg it can await on. */
  readonly duration: number
  /** Apex of each bounce after the launch arc, as fractions of the nominal
   * apex. Exposed so a test can pin the decay rather than eyeball it. */
  readonly bouncePeaks: readonly number[]
  /** Advance the simulation by `dt` seconds and return the new frame. */
  step(dt: number): ThrowFrame
}

/**
 * Deal one throw. `targetDuration` is the nominal seconds from launch to
 * flat on the table; the realised figure strays from it with the launch
 * jitter, which is the point — and why `duration` is reported back.
 */
export function createDiceThrow(
  targetDuration: number,
  random: () => number = Math.random,
): DiceThrow {
  const restitution = RESTITUTION_MIN + RESTITUTION_SPREAD * random()
  const spinKept = SPIN_KEPT_MIN + SPIN_KEPT_SPREAD * random()
  const jitter = 1 + LAUNCH_JITTER * (random() * 2 - 1)
  const flightTurns = FLIGHT_TURNS_MIN + FLIGHT_TURNS_SPREAD * random()

  // Split `targetDuration` between the launch arc and its bounces before
  // picking gravity: under constant gravity an arc's time is proportional to
  // its takeoff speed, so each bounce costs `restitution` times the arc
  // before it, and the arcs above the rest threshold sum in closed form.
  let series = 1
  for (let r = restitution; r * r >= REST_PEAK; r *= restitution) series += r
  const nominalFlight = targetDuration / series

  // Units: heights in launch apexes, time in seconds. With the apex at 1 and
  // the launch arc taking `nominalFlight`, gravity and takeoff speed are
  // forced: g = 8/T² and v = 4/T. The jitter then scales the speed alone, so
  // a hard throw is genuinely higher *and* longer, as a real one is.
  const gravity = 8 / (nominalFlight * nominalFlight)
  const launchSpeed = (4 / nominalFlight) * jitter

  // The realised schedule, jitter and all: how long until the die is flat,
  // and how high each bounce will carry. The frames are still integrated —
  // this is only the timetable they are known in advance to keep.
  const flightTime = (2 * launchSpeed) / gravity
  const bouncePeaks: number[] = []
  let duration = flightTime
  for (let v = launchSpeed * restitution; (v * v) / (2 * gravity) >= REST_PEAK; v *= restitution) {
    bouncePeaks.push((v * v) / (2 * gravity))
    duration += (2 * v) / gravity
  }

  let elapsed = 0
  let height = 0
  let verticalSpeed = launchSpeed
  let spinAngle = 0
  let spinRate = (flightTurns * 360) / flightTime
  let grounded = false
  let rebounds = 0

  const step = (dt: number): ThrowFrame => {
    let impact = 0
    let remaining = Math.max(0, dt)
    while (remaining > 0 && !grounded) {
      const h = Math.min(MAX_STEP, remaining)
      remaining -= h
      elapsed += h
      // Semi-implicit Euler: speed first, then position from the new speed.
      verticalSpeed -= gravity * h
      height += verticalSpeed * h
      spinAngle += spinRate * h
      if (height <= 0 && verticalSpeed < 0) {
        height = 0
        const speed = -verticalSpeed
        impact = Math.max(impact, speed / launchSpeed)
        // The timetable, not a re-vote: whether this contact rebounds was
        // decided by the schedule above. Re-testing the threshold against
        // the integrated speed — always a shade off the closed form — can
        // drop or add a bounce and leave the die lying idle for the arc the
        // timetable still owes, a beat of dead air right before the settle.
        if (rebounds >= bouncePeaks.length || elapsed >= duration) {
          grounded = true
          verticalSpeed = 0
        } else {
          rebounds += 1
          verticalSpeed = speed * restitution
          spinRate *= spinKept
        }
      }
    }
    // A grounded die holds still while the clock runs out the leg; and if
    // integration drift leaves a last sliver of bounce past the timetable,
    // the timetable wins — the leg's end is the settle's cue either way.
    elapsed += remaining
    if (!grounded && elapsed >= duration) {
      grounded = true
      height = 0
      verticalSpeed = 0
    }
    return {
      height,
      spinAngle,
      flightProgress: Math.min(1, elapsed / flightTime),
      returnProgress: Math.min(1, Math.max(0, (elapsed - flightTime) / (duration - flightTime))),
      impact,
      grounded,
    }
  }

  return { duration, bouncePeaks, step }
}
