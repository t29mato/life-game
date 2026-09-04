/**
 * --- the spinner's physics ------------------------------------------------
 *
 * One flick of a six-segment wheel with a flexible ticker riding its pegs:
 * angular velocity under drag, a peg barrier the ticker has to be bent over
 * at every segment boundary, and a stop that happens where the energy runs
 * out rather than where a curve was told to end.
 *
 * **The number is not decided here.** The store has already rolled
 * (`SpinValue`, `src/domain/rules/spin.ts`); this module is handed that value
 * and its job is to produce a *believable way of arriving at it*. It does
 * that honestly, and the distinction matters enough to spell out:
 *
 * - It never overshoots the answer and snaps back. There is no correction
 *   leg at all — the wheel is flicked once and coasts to a stop.
 * - It never re-decides. The one free parameter is the launch speed, and it
 *   is *solved for* before the first frame: `createWheelSpin` searches for
 *   the band of launch speeds whose free run comes to rest inside the segment
 *   the domain already picked, then deals a speed from inside that band.
 *   Everything after that is a fixed integration nobody touches.
 *
 * So the tension is real in the only sense that matters to a player: what
 * they are watching genuinely is a wheel running out of energy, and where it
 * runs out is genuinely where it stops. What was chosen up front is *how* it
 * runs out — and that is where the drama lives, because the far end of the
 * band is a wheel that climbs the *next* peg, stalls on it and falls back,
 * and the near end is a wheel that scrapes over the last one with nothing to
 * spare. Both land on the same, already-decided number.
 *
 * ### The model
 *
 * One degree of freedom (the wheel's angle), unit moment of inertia.
 *
 * - **Resistance** is `FRICTION + DRAG · ω`. The Coulomb term is what lets a
 *   wheel actually stop in finite time; the viscous term is what makes the
 *   first second so much faster than the last. Pure Coulomb decays ω
 *   linearly, which is a mild ritardando — with the drag term the wheel loses
 *   most of its speed early and then crawls, and the gap between the final
 *   two clicks comes out around eight times the gap between the first two —
 *   measured over two hundred spins, not hoped for. That ratio *is* the
 *   feature; see `TEMPO.wheelSpinSeconds`.
 * - **Each peg** is a potential barrier `PEG_BARRIER` wide `PEG_SPAN` either
 *   side of the boundary — the work of bending the ticker aside. Climbing it
 *   costs; cresting it pays back, which is the ticker's spring snapping the
 *   wheel forward. A crest also skims `1 - PEG_KEEP` off the speed, because
 *   a bent ticker is not a perfect spring.
 * - **Stalling** falls out of that rather than being scripted. A wheel that
 *   reaches a peg without the energy to crest it stops partway up, and the
 *   barrier's own slope then pushes it back down — the ticker straining and
 *   the wheel rocking back off the peg, which is the shape of the whole
 *   childhood memory this replaced a die for.
 *
 * Integration is fixed-step semi-implicit Euler in *normalized* seconds, and
 * the trajectory is recorded as it goes: playback replays the recorded run
 * rather than re-integrating, so the frames a player sees cannot drift from
 * the run whose landing segment was verified. Wall-clock length comes from
 * scaling the recorded run once (see `scale`), which changes nothing
 * about its shape.
 */

import type { SpinValue } from '@domain/model/types'

/** Faces on the wheel, and therefore pegs — one at every segment boundary. */
export const SEGMENT_COUNT = 6
/** Degrees of rim per face. */
export const SEGMENT_DEGREES = 360 / SEGMENT_COUNT

/**
 * How far either side of a peg the ticker is in contact with it. Two of these
 * out of a 60° segment, so the ticker is riding a peg for a bit under a third
 * of every segment and running free for the rest.
 */
export const PEG_SPAN = 9

/** Constant resistance, in degrees per second squared. Sets where it stops. */
const FRICTION = 1
/** Speed-proportional resistance. Sets how much slower the end is than the start. */
const DRAG = 0.06
/**
 * The work of bending the ticker over one peg, per unit inertia. Deliberately
 * modest against the 42° of free rim between pegs (which costs ~42 of the same
 * units): big enough that the last peg is a real obstacle a dying wheel can
 * fail at, small enough that a wheel which does clear it still carries far
 * enough past to rest well inside the segment rather than leaning on the
 * boundary, where a player would have to squint to read the answer.
 */
const PEG_BARRIER = 18
/** Share of speed surviving a crest — a bent ticker is not a perfect spring. */
const PEG_KEEP = 0.98

/** Integration step, normalized seconds. ~0.5° of rim at launch speed. */
const STEP = 0.01
/** A stalled-solid wheel must not integrate forever; ~200 normalized seconds. */
const MAX_STEPS = 20000

/**
 * Whole turns of rim the flick is worth before the segment the domain asked
 * for is taken into account. Three turns is enough that no eye tracks a
 * particular peg all the way round, and few enough that every click is a
 * distinct event rather than a buzz.
 */
const BASE_PEGS = SEGMENT_COUNT * 3

/**
 * Where in the band of viable launch speeds one flick is dealt, kept off both
 * razor edges. At the low end the wheel crests the final peg with almost
 * nothing left; at the high end it climbs the *next* one and falls back off
 * it. Everything between is a clean stop somewhere in the same segment.
 */
const BAND_MARGIN = 0.04

/**
 * The normalized length of a typical flick, used to price one normalized
 * second in real ones. Measured from this model rather than assumed — see
 * `wheelPhysics.test.ts`, which fails if the model drifts away from it.
 */
export const REFERENCE_UNITS = 32

/** Guard rails on the realised length, as multiples of the nominal spin. */
const MIN_SCALE = 0.7
const MAX_SCALE = 1.45

/** The face the pointer is over at this angle. The pointer sits at the top of
 *  the wheel and the disc is drawn rotated by `-angle`, so the rim under it
 *  is exactly `angle` degrees round from face 1's leading edge. */
export function faceAtAngle(angle: number): SpinValue {
  const wrapped = ((angle % 360) + 360) % 360
  return ((Math.floor(wrapped / SEGMENT_DEGREES) % SEGMENT_COUNT) + 1) as SpinValue
}

/** Signed degrees from `angle` to the nearest peg — negative while the peg is
 *  still ahead of the ticker, positive once it has been crossed. */
function offsetFromPeg(angle: number): number {
  const within = ((angle % SEGMENT_DEGREES) + SEGMENT_DEGREES) % SEGMENT_DEGREES
  return within <= SEGMENT_DEGREES / 2 ? within : within - SEGMENT_DEGREES
}

/**
 * How far the ticker is bent aside at this angle, 0 (free of every peg) to 1
 * (fully bent, the peg exactly under it). A pure function of the wheel's
 * angle, so the blade and the wheel can never disagree about what is
 * happening — and so a stalled wheel holds the ticker at whatever bend it
 * stalled at, which is the strain the whole thing is for.
 *
 * The blade always bends the way the wheel is travelling; on the rock-back it
 * simply relaxes as the peg retreats, rather than flicking to the other side.
 */
export function tickerBend(angle: number): number {
  const d = offsetFromPeg(angle)
  if (Math.abs(d) >= PEG_SPAN) return 0
  return (1 + Math.cos((Math.PI * d) / PEG_SPAN)) / 2
}

/** Angular acceleration the peg under the ticker contributes. Negative on the
 *  way up (the ticker resisting), positive on the way down (it snapping past). */
function pegAcceleration(angle: number): number {
  const d = offsetFromPeg(angle)
  if (Math.abs(d) >= PEG_SPAN) return 0
  return ((PEG_BARRIER * Math.PI) / (2 * PEG_SPAN)) * Math.sin((Math.PI * d) / PEG_SPAN)
}

interface Run {
  /** Pegs crossed forwards, which is what the landing segment is counted in. */
  readonly pegs: number
  readonly restAngle: number
  /** Normalized seconds from flick to rest. */
  readonly units: number
  /** Angle at every step, for playback. Only filled when asked for. */
  readonly angles: number[]
  /** Normalized seconds of each peg crossing. Only filled when asked for. */
  readonly clicks: number[]
}

/**
 * Integrate one flick to a standstill. `record` off is the calibration mode —
 * the search below runs dozens of these and only wants the peg count.
 */
function run(fromAngle: number, launchSpeed: number, record: boolean): Run {
  let angle = fromAngle
  let speed = launchSpeed
  let peg = Math.floor(angle / SEGMENT_DEGREES)
  let pegs = 0
  let step = 0
  const angles: number[] = record ? [angle] : []
  const clicks: number[] = []

  while (step < MAX_STEPS) {
    const fromPeg = pegAcceleration(angle)
    const resistance = Math.sign(speed) * FRICTION + DRAG * speed
    const next = speed + (fromPeg - resistance) * STEP
    // Coulomb friction cannot reverse a body, only stop it: if the resistance
    // alone would flip the sign this step and the peg has not got the slope to
    // move it on its own, the wheel is simply at rest. Without this the
    // integrator chatters about zero forever instead of stopping.
    if (speed !== 0 && Math.sign(next) !== Math.sign(speed) && Math.abs(fromPeg) <= FRICTION) break
    speed = next
    angle += speed * STEP
    step += 1

    // Crossings, counted off the boundary the ticker has actually passed. The
    // barrier makes a backwards crossing impossible — a wheel that failed to
    // crest a peg has, by construction, less than a barrier's worth of energy
    // to climb the one behind it with, and 42° of rim to lose it over — but
    // the loop is written to survive one anyway rather than to assume it.
    const nowPeg = Math.floor(angle / SEGMENT_DEGREES)
    while (nowPeg > peg) {
      peg += 1
      pegs += 1
      speed *= PEG_KEEP
      if (record) clicks.push(step * STEP)
    }
    while (nowPeg < peg) {
      peg -= 1
      pegs -= 1
    }
    if (record) angles.push(angle)
  }

  return { pegs, restAngle: angle, units: step * STEP, angles, clicks }
}

/** The slowest flick in `[low, high]` that still crosses `pegs` pegs. Peg
 *  count is monotone in the launch speed, so a bisection is exact to the
 *  resolution it is run to — fifteen halvings put it a thousandth of a band
 *  width from the edge, and the band is what a flick is dealt from. */
function slowestFlickFor(fromAngle: number, pegs: number, low: number, high: number): number {
  let lo = low
  let hi = high
  for (let i = 0; i < 15; i += 1) {
    const mid = (lo + hi) / 2
    if (run(fromAngle, mid, false).pegs >= pegs) hi = mid
    else lo = mid
  }
  return hi
}

export interface WheelSpin {
  /** Seconds from flick to standstill, known before the first frame. */
  readonly duration: number
  /** Where the wheel ends up. `faceAtAngle` of it is the domain's own value. */
  readonly restAngle: number
  /** Seconds at which the ticker clicks past each peg, in order. */
  readonly clickTimes: readonly number[]
  /** The wheel's angle this many seconds after the flick. */
  angleAt(seconds: number): number
}

export interface WheelSpinRequest {
  /** Where the wheel is sitting now — every flick carries on from there. */
  readonly fromAngle: number
  /** The value the domain already rolled. The spin is built to arrive at it. */
  readonly result: SpinValue
  /** Nominal seconds for a spin; the realised length varies a little with how
   *  far this particular flick has to travel. */
  readonly targetSeconds: number
  readonly random?: () => number
}

/**
 * Deal one flick that comes to rest showing `result`.
 *
 * The travel is fixed first: whole turns, plus however much further round the
 * rim is needed for the pointer to end up in `result`'s segment. Only then is
 * a launch speed searched for — the band between "just crests the final peg"
 * and "just fails to crest the one after it", every speed in which stops in
 * that same segment. The realised run is recorded and its landing segment
 * checked; on the off chance the integrator disagrees with the search (it
 * should not, both being the same fixed-step run), the fallback below is
 * still driven to the domain's value rather than to whatever came out.
 */
export function createWheelSpin({
  fromAngle,
  result,
  targetSeconds,
  random = Math.random,
}: WheelSpinRequest): WheelSpin {
  const startPeg = Math.floor(fromAngle / SEGMENT_DEGREES)
  // Resting between peg k and peg k+1 shows face (k mod 6) + 1, so the pegs
  // this flick must cross are fixed modulo six by the answer, and the whole
  // turns on top of that are the flick's own generosity.
  const toResult = (((result - 1 - startPeg) % SEGMENT_COUNT) + SEGMENT_COUNT) % SEGMENT_COUNT
  const pegs = BASE_PEGS + toResult

  // Bracketed once, for both edges: a flick hard enough to clear one peg more
  // than this one needs is an upper bound on the band as well as above it.
  let ceiling = 20
  while (ceiling < 4000 && run(fromAngle, ceiling, false).pegs < pegs + 1) ceiling *= 1.6
  const low = slowestFlickFor(fromAngle, pegs, 0, ceiling)
  const high = slowestFlickFor(fromAngle, pegs + 1, low, ceiling)
  const band = BAND_MARGIN + (1 - 2 * BAND_MARGIN) * random()
  const launch = low + (high - low) * band

  const flick = run(fromAngle, launch, true)
  const honest = faceAtAngle(flick.restAngle) === result

  // One normalized second in real ones. Fixed, so a flick with further to
  // travel genuinely takes longer, and bounded so the tempo cannot run away.
  const scale = Math.min(
    (targetSeconds * MAX_SCALE) / flick.units,
    Math.max((targetSeconds * MIN_SCALE) / flick.units, targetSeconds / REFERENCE_UNITS),
  )

  if (!honest) {
    // Never reached in practice, and never allowed to be wrong if it is: a
    // plain eased glide to the middle of the segment the domain named. Less
    // of a spinner, still the same number, and still no snapping back.
    const restAngle = (startPeg + pegs) * SEGMENT_DEGREES + SEGMENT_DEGREES / 2
    const travel = restAngle - fromAngle
    const duration = targetSeconds
    return {
      duration,
      restAngle,
      clickTimes: [],
      angleAt: (seconds) => {
        const p = Math.min(1, Math.max(0, seconds / duration))
        return fromAngle + travel * (1 - (1 - p) ** 3)
      },
    }
  }

  const duration = flick.units * scale
  const frame = STEP * scale
  const { angles, restAngle } = flick

  return {
    duration,
    restAngle,
    clickTimes: flick.clicks.map((unit) => unit * scale),
    angleAt: (seconds) => {
      if (seconds <= 0) return angles[0] ?? fromAngle
      if (seconds >= duration) return restAngle
      const at = seconds / frame
      const i = Math.floor(at)
      const a = angles[i] ?? restAngle
      const b = angles[i + 1] ?? restAngle
      return a + (b - a) * (at - i)
    },
  }
}
