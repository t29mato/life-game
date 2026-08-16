/**
 * Board BGM for the India edition. Kept in its own module so the shared
 * `theory.ts` stays the neutral engine plus the default-edition tracks.
 */

import { transpose } from './theory'
import type { NoteEvent, Track } from './theory'

// ---------------------------------------------------------------------------
// Scale
// ---------------------------------------------------------------------------

/**
 * The tonic ("Sa") everything is built from. D sits low enough for a fat drone
 * and puts the melody in a comfortable 4th–5th octave range.
 */
const SA = 'D'

/**
 * A raga-inspired seven-note scale on D with a flattened 2nd and flattened 6th:
 * D Eb F# G A Bb C#. The Eb–F# gap (an augmented 2nd) and the Bb–C# gap are
 * what make it read as distinctly *not* Western major or minor, and the whole
 * thing is playable on plain twelve-tone oscillators — no microtones required.
 */
const SCALE_DEGREES: Readonly<Record<string, number>> = {
  sa: 0, // tonic
  re: 1, // flattened 2nd
  ga: 4, // major 3rd
  ma: 5, // perfect 4th
  pa: 7, // perfect 5th
  dha: 8, // flattened 6th
  ni: 11, // major 7th — pulls hard back to Sa
}

/** `degree('ga', 4) -> 'F#4'`. Octave numbers follow the Sa of that octave. */
function degree(name: keyof typeof SCALE_DEGREES | string, octave: number): string {
  const semitones = SCALE_DEGREES[name]
  if (semitones === undefined) {
    throw new Error(`"${name}" is not a degree of the India board scale`)
  }
  return transpose(`${SA}${octave}`, semitones)
}

// ---------------------------------------------------------------------------
// Drone — bass and "chord" voices
// ---------------------------------------------------------------------------

const BARS = 8
const BEATS_PER_BAR = 4

/**
 * The chord role is used as a tanpura-style drone rather than a progression:
 * a fixed Sa + Pa open fifth, re-struck once a bar, with only the top string
 * moving. Bars 4 and 8 raise it to Ni, which leans back towards Sa and marks
 * the halfway point and the loop point without ever changing the harmony.
 */
function indiaDroneEvents(): NoteEvent[] {
  const sa = degree('sa', 3)
  const pa = degree('pa', 3)
  const events: NoteEvent[] = []
  for (let bar = 0; bar < BARS; bar++) {
    const isTurnaround = bar === 3 || bar === 7
    const top = isTurnaround ? degree('ni', 3) : degree('sa', 4)
    events.push({
      startBeat: bar * BEATS_PER_BAR,
      durationBeats: BEATS_PER_BAR,
      notes: [sa, pa, top],
    })
  }
  return events
}

/**
 * A held low tonic instead of a walking line — the bass never leaves Sa except
 * to touch Pa on the last beat of the two turnaround bars, which gives the
 * drone a breath before it settles back.
 */
function indiaBassEvents(): NoteEvent[] {
  const sa = degree('sa', 2)
  const pa = degree('pa', 2)
  const events: NoteEvent[] = []
  for (let bar = 0; bar < BARS; bar++) {
    const base = bar * BEATS_PER_BAR
    if (bar === 3 || bar === 7) {
      events.push(
        { startBeat: base, durationBeats: 3, note: sa },
        { startBeat: base + 3, durationBeats: 1, note: pa },
      )
      continue
    }
    events.push({ startBeat: base, durationBeats: BEATS_PER_BAR, note: sa })
  }
  return events
}

// ---------------------------------------------------------------------------
// Melody
// ---------------------------------------------------------------------------

/** How long each grace note gets. Short enough to read as an ornament, not a note. */
const GRACE_BEATS = 0.125

/**
 * One melodic gesture: up to two very quick approach notes played *on* the beat,
 * followed by the note the phrase actually lands on. This is how the engine
 * approximates the sliding ornaments the style leans on — the ear hears a
 * decorated arrival rather than three separate pitches.
 */
interface Ornament {
  /** Offset from the start of the bar, in beats. */
  readonly beat: number
  readonly graces: readonly string[]
  readonly note: string
  /** Length of the landing note, after the graces have taken their time. */
  readonly hold: number
}

/**
 * Eight bars that climb from Sa up to the octave and back down, saving the two
 * most characteristic notes for late: the flattened 6th arrives in bar 3, and
 * the flattened 2nd only gets its own long note in bar 7, just before the
 * phrase resolves.
 */
const INDIA_MELODY_BARS: readonly (readonly Ornament[])[] = [
  // Bar 1 — settle on Sa, then open out to Ga.
  [
    { beat: 0, graces: [degree('re', 4), degree('ga', 4)], note: degree('sa', 4), hold: 1.75 },
    { beat: 2, graces: [degree('ma', 4)], note: degree('ga', 4), hold: 1.875 },
  ],
  // Bar 2 — a lift to Pa and a fall back through Ma.
  [
    { beat: 0, graces: [degree('ga', 4), degree('ma', 4)], note: degree('pa', 4), hold: 1.25 },
    { beat: 1.5, graces: [], note: degree('ma', 4), hold: 0.5 },
    { beat: 2, graces: [degree('pa', 4), degree('dha', 4)], note: degree('ma', 4), hold: 1.75 },
  ],
  // Bar 3 — the flattened 6th, rocking against Pa.
  [
    { beat: 0, graces: [degree('pa', 4)], note: degree('dha', 4), hold: 0.875 },
    { beat: 1, graces: [], note: degree('pa', 4), hold: 1 },
    { beat: 2, graces: [degree('dha', 4), degree('ni', 4)], note: degree('dha', 4), hold: 0.75 },
    { beat: 3, graces: [], note: degree('pa', 4), hold: 1 },
  ],
  // Bar 4 — reaches the upper Sa, the high point of the loop.
  [
    { beat: 0, graces: [degree('dha', 4), degree('ni', 4)], note: degree('sa', 5), hold: 1.75 },
    { beat: 2, graces: [degree('ni', 4)], note: degree('dha', 4), hold: 0.875 },
    { beat: 3, graces: [], note: degree('pa', 4), hold: 1 },
  ],
  // Bar 5 — hovers around the upper Sa before the descent begins.
  [
    { beat: 0, graces: [degree('ni', 4)], note: degree('sa', 5), hold: 0.875 },
    { beat: 1, graces: [degree('re', 5)], note: degree('sa', 5), hold: 0.875 },
    { beat: 2, graces: [degree('ni', 4), degree('dha', 4)], note: degree('pa', 4), hold: 1.75 },
  ],
  // Bar 6 — down through Ma to Ga, mirroring bar 2.
  [
    { beat: 0, graces: [degree('dha', 4), degree('pa', 4)], note: degree('ma', 4), hold: 1.25 },
    { beat: 1.5, graces: [], note: degree('pa', 4), hold: 0.5 },
    { beat: 2, graces: [degree('ma', 4)], note: degree('ga', 4), hold: 1.875 },
  ],
  // Bar 7 — the flattened 2nd finally held, the most distinctive bar of the loop.
  [
    { beat: 0, graces: [degree('ga', 4), degree('re', 4)], note: degree('ga', 4), hold: 0.75 },
    { beat: 1, graces: [], note: degree('re', 4), hold: 1 },
    { beat: 2, graces: [degree('ga', 4), degree('ma', 4)], note: degree('ga', 4), hold: 0.75 },
    { beat: 3, graces: [degree('re', 4)], note: degree('sa', 4), hold: 0.875 },
  ],
  // Bar 8 — long notes only: Ni leans into Sa, then Re falls back through Ni to
  // Sa and stops just short of the barline so bar 1 re-attacks cleanly.
  [
    { beat: 0, graces: [degree('ni', 3)], note: degree('sa', 4), hold: 1.875 },
    { beat: 2, graces: [], note: degree('re', 4), hold: 1 },
    { beat: 3, graces: [degree('ni', 3)], note: degree('sa', 4), hold: 0.75 },
  ],
]

function indiaMelodyEvents(): NoteEvent[] {
  const events: NoteEvent[] = []
  INDIA_MELODY_BARS.forEach((ornaments, barIndex) => {
    const base = barIndex * BEATS_PER_BAR
    ornaments.forEach(({ beat, graces, note, hold }) => {
      graces.forEach((grace, graceIndex) => {
        events.push({
          startBeat: base + beat + graceIndex * GRACE_BEATS,
          durationBeats: GRACE_BEATS,
          note: grace,
        })
      })
      events.push({
        startBeat: base + beat + graces.length * GRACE_BEATS,
        durationBeats: hold,
        note,
      })
    })
  })
  return events
}

// ---------------------------------------------------------------------------
// Percussion
// ---------------------------------------------------------------------------

/**
 * Named hand-drum strokes, each a pitch centre for the noise voice: low notes
 * come out as a round bass thud, high notes as a crisp fingertip tick. Naming
 * them makes the patterns below readable as rhythm rather than as numbers.
 */
const STROKES = {
  bass: { note: 'D2', durationBeats: 0.22 },
  low: { note: 'A2', durationBeats: 0.18 },
  mid: { note: 'D4', durationBeats: 0.12 },
  rim: { note: 'A5', durationBeats: 0.1 },
  tip: { note: 'D6', durationBeats: 0.09 },
} as const

type Stroke = keyof typeof STROKES

/** A stroke placed at an offset in beats from the start of its bar. */
type Hit = readonly [beat: number, stroke: Stroke]

/**
 * Four one-bar patterns, busier and more off-beat than the other editions'
 * drums. Two strokes stacked on the same beat (bass + tip) read as one full
 * two-handed hit. The sixteenth-note pickups landing just *before* the next
 * beat are what give the groove its lilt.
 */
const OPEN_BAR: readonly Hit[] = [
  [0, 'bass'],
  [0, 'tip'],
  [0.5, 'rim'],
  [0.75, 'tip'],
  [1, 'mid'],
  [1.5, 'tip'],
  [2, 'bass'],
  [2, 'tip'],
  [2.5, 'rim'],
  [2.75, 'mid'],
  [3, 'low'],
  [3.5, 'tip'],
  [3.75, 'rim'],
]

const SYNCOPATED_BAR: readonly Hit[] = [
  [0, 'bass'],
  [0, 'tip'],
  [0.75, 'rim'],
  [1, 'mid'],
  [1.25, 'tip'],
  [1.75, 'low'],
  [2, 'tip'],
  [2.5, 'mid'],
  [2.75, 'tip'],
  [3, 'bass'],
  [3.25, 'rim'],
  [3.5, 'tip'],
]

const SPARSE_BAR: readonly Hit[] = [
  [0, 'bass'],
  [0, 'tip'],
  [1, 'rim'],
  [1.5, 'tip'],
  [2, 'low'],
  [2.5, 'tip'],
  [3, 'mid'],
  [3.5, 'tip'],
  [3.75, 'rim'],
]

/**
 * The closing bar ends with a three-fold accent spaced three sixteenths apart,
 * so the pattern it implies would land exactly on the downbeat of bar 1. The
 * ear finishes the phrase across the loop point, which is what stops eight
 * bars on repeat from sounding like eight bars on repeat.
 */
const TIHAI_BAR: readonly Hit[] = [
  [0, 'bass'],
  [0, 'tip'],
  [0.5, 'rim'],
  [1, 'tip'],
  [1.25, 'mid'],
  [1.75, 'bass'],
  [1.75, 'tip'],
  [2, 'rim'],
  [2.5, 'bass'],
  [2.5, 'tip'],
  [2.75, 'rim'],
  [3.25, 'bass'],
  [3.25, 'tip'],
  [3.5, 'rim'],
]

const INDIA_DRUM_BARS: readonly (readonly Hit[])[] = [
  OPEN_BAR,
  SYNCOPATED_BAR,
  OPEN_BAR,
  SPARSE_BAR,
  OPEN_BAR,
  SYNCOPATED_BAR,
  SPARSE_BAR,
  TIHAI_BAR,
]

function indiaDrumEvents(): NoteEvent[] {
  const events: NoteEvent[] = []
  INDIA_DRUM_BARS.forEach((pattern, barIndex) => {
    const base = barIndex * BEATS_PER_BAR
    pattern.forEach(([beat, stroke]) => {
      const { note, durationBeats } = STROKES[stroke]
      events.push({ startBeat: base + beat, durationBeats, note })
    })
  })
  return events
}

// ---------------------------------------------------------------------------
// India board — an original piece in a raga-inspired mode, not an arrangement
// of any existing tune. A drone-plus-melody texture rather than a chord
// progression: the bass and the "chord" voice both sit on Sa and Pa and never
// move, so all the movement comes from the ornamented melodic line above and
// the hand-drum pattern underneath. Slightly slower than the default board
// track (104 vs 116) because the ornaments need room to be heard as ornaments.
// ---------------------------------------------------------------------------

export const INDIA_BOARD_TRACK: Track = {
  bpm: 104,
  bars: BARS,
  beatsPerBar: BEATS_PER_BAR,
  voices: [
    { role: 'chord', waveform: 'triangle', gain: 0.15, events: indiaDroneEvents() },
    { role: 'bass', waveform: 'sine', gain: 0.26, events: indiaBassEvents() },
    // Sawtooth for a reedy, double-reed-ish tone; trimmed a little against the
    // other tracks' 0.15 because sawtooth is brighter than their triangles.
    { role: 'melody', waveform: 'sawtooth', gain: 0.13, events: indiaMelodyEvents() },
    // Denser than the other drum parts, so nudged down to keep the mix even.
    { role: 'drum', waveform: 'noise', gain: 0.1, events: indiaDrumEvents() },
  ],
}
