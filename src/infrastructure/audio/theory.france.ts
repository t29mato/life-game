/**
 * Board BGM for the France edition. Pure data in the same shape as the tracks
 * in `./theory` — no `AudioContext`, no samples, just note events the shared
 * `WebAudioAdapter` schedules.
 */

import { chord, transpose, type NoteEvent, type Track } from './theory'

// ---------------------------------------------------------------------------
// France board — a musette-style café waltz. Where every other track in the
// game is in 4/4, this one is in 3/4, which is most of what makes it read as
// French before a single note is even identified. It sits in D minor and
// leans on an "oom-pah-pah": the bass takes beat 1 alone, the chord voice
// answers with two short detached stabs on beats 2 and 3.
//
// The eight bars are two four-bar sentences. The first stays diatonic
// (i - iv - V7 - i) and settles; the second lifts to the relative major and
// then turns bittersweet by borrowing a D major chord in bar 6 — a secondary
// dominant pointing at the G minor of bar 7, and the one moment where the
// tune's own F natural is contradicted by an F#. Bar 8 sits on the dominant
// with the melody holding the leading tone C#, so the loop pulls back into
// the D of bar 1 rather than stopping.
//
// The melody is deliberately singable and mostly stepwise, with small turns
// around the beat in place of an accordion player's ornaments.
// ---------------------------------------------------------------------------

const FRANCE_BEATS_PER_BAR = 3
const FRANCE_BARS = 8

/** One bass root per bar; the fifth above it is derived where the bar wants a lift. */
const FRANCE_BASS_ROOTS: readonly string[] = ['D2', 'G2', 'A2', 'D2', 'F2', 'D2', 'G2', 'A2']

function franceBassEvents(): NoteEvent[] {
  const events: NoteEvent[] = []
  FRANCE_BASS_ROOTS.forEach((root, index) => {
    const bar = index * FRANCE_BEATS_PER_BAR
    // The "oom": a short root on beat 1, leaving beats 2 and 3 to the chords.
    events.push({ startBeat: bar, durationBeats: 0.5, note: root })
    if (index % 2 === 1) {
      // Every second bar rocks up to the fifth, the gentle sway of a waltz bass.
      events.push({ startBeat: bar + 2, durationBeats: 0.4, note: transpose(root, 7) })
    }
  })
  return events
}

/**
 * Voicings kept in a narrow band around D4 so the stabs stay under the melody.
 * Bar 5 is a first-inversion F major and bar 6 a D7, both chosen so the top of
 * the chord moves by step rather than jumping.
 */
const FRANCE_CHORD_BARS: readonly (readonly string[])[] = [
  chord('D4', 'minor'),
  chord('G3', 'minor'),
  [...chord('A3', 'major'), 'G4'],
  chord('D4', 'minor'),
  ['A3', 'C4', 'F4'],
  [...chord('D4', 'major'), 'C4'],
  chord('G3', 'minor'),
  [...chord('A3', 'major'), 'G4'],
]

function franceChordEvents(): NoteEvent[] {
  const events: NoteEvent[] = []
  FRANCE_CHORD_BARS.forEach((notes, index) => {
    const bar = index * FRANCE_BEATS_PER_BAR
    // The "pah-pah": short and detached, never held into the next beat.
    events.push(
      { startBeat: bar + 1, durationBeats: 0.55, notes },
      { startBeat: bar + 2, durationBeats: 0.55, notes },
    )
  })
  return events
}

/** Each bar is a list of [offset within the bar, duration, note]. */
type MelodyCell = readonly [number, number, string]

const FRANCE_MELODY_BARS: readonly (readonly MelodyCell[])[] = [
  // i — states the tonic and turns around it.
  [
    [0, 1, 'D5'],
    [1, 0.5, 'F5'],
    [1.5, 0.5, 'E5'],
    [2, 1, 'D5'],
  ],
  // iv — the same shape a third lower, so bar 2 answers bar 1.
  [
    [0, 1, 'Bb4'],
    [1, 0.5, 'D5'],
    [1.5, 0.5, 'C5'],
    [2, 1, 'Bb4'],
  ],
  // V7 — breaks the pattern and climbs, opening the phrase out.
  [
    [0, 0.5, 'A4'],
    [0.5, 0.5, 'B4'],
    [1, 1, 'C#5'],
    [2, 1, 'E5'],
  ],
  // i — a held tonic closes the first sentence, then A4 leans into bar 5.
  [
    [0, 2, 'D5'],
    [2, 1, 'A4'],
  ],
  // III — the brightest bar; E5 over F major is a soft major-seventh glow.
  [
    [0, 0.5, 'C5'],
    [0.5, 0.5, 'D5'],
    [1, 1, 'F5'],
    [2, 1, 'E5'],
  ],
  // V7/iv — falls to F#, the borrowed note that gives the tune its ache.
  [
    [0, 1, 'D5'],
    [1, 0.5, 'C5'],
    [1.5, 0.5, 'A4'],
    [2, 1, 'F#4'],
  ],
  // iv — rises again, with an Eb turn borrowed from the natural minor.
  [
    [0, 0.5, 'G4'],
    [0.5, 0.5, 'Bb4'],
    [1, 1, 'D5'],
    [2, 0.5, 'Eb5'],
    [2.5, 0.5, 'D5'],
  ],
  // V7 — steps down onto a long leading tone that resolves into bar 1's D5.
  [
    [0, 0.5, 'E5'],
    [0.5, 0.5, 'D5'],
    [1, 2, 'C#5'],
  ],
]

function franceMelodyEvents(): NoteEvent[] {
  const events: NoteEvent[] = []
  FRANCE_MELODY_BARS.forEach((cells, index) => {
    const bar = index * FRANCE_BEATS_PER_BAR
    cells.forEach(([offset, durationBeats, note]) => {
      events.push({ startBeat: bar + offset, durationBeats, note })
    })
  })
  return events
}

function franceDrumEvents(): NoteEvent[] {
  const events: NoteEvent[] = []
  for (let index = 0; index < FRANCE_BARS; index++) {
    const bar = index * FRANCE_BEATS_PER_BAR
    events.push(
      { startBeat: bar, durationBeats: 0.16, note: 'C2' },
      { startBeat: bar + 1, durationBeats: 0.09, note: 'A5' },
      { startBeat: bar + 2, durationBeats: 0.09, note: 'A5' },
    )
    if (index % 4 === 0) {
      // A brighter brush marks the top of each four-bar sentence.
      events.push({ startBeat: bar, durationBeats: 0.2, note: 'C6' })
    }
  }
  return events
}

export const FRANCE_BOARD_TRACK: Track = {
  bpm: 132,
  bars: FRANCE_BARS,
  beatsPerBar: FRANCE_BEATS_PER_BAR,
  voices: [
    { role: 'chord', waveform: 'triangle', gain: 0.15, events: franceChordEvents() },
    { role: 'bass', waveform: 'triangle', gain: 0.26, events: franceBassEvents() },
    // Sawtooth for the reedy bite of an accordion; trimmed slightly against the
    // other tracks' melodies because it is brighter than a triangle at equal gain.
    { role: 'melody', waveform: 'sawtooth', gain: 0.14, events: franceMelodyEvents() },
    { role: 'drum', waveform: 'noise', gain: 0.11, events: franceDrumEvents() },
  ],
}
