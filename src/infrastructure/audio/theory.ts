/**
 * Pure, DOM-free music theory helpers plus the game's BGM tracks as plain
 * data. Nothing here touches `AudioContext` — that keeps the musical content
 * unit-testable and lets `WebAudioAdapter` stay a thin scheduler over it.
 */

// ---------------------------------------------------------------------------
// Pitch
// ---------------------------------------------------------------------------

/** Semitone offset from C, within an octave. */
const SEMITONE_FROM_C: Readonly<Record<string, number>> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
}

/** Canonical (sharps-only) spelling used whenever a note name is generated rather than parsed. */
const CHROMATIC_SCALE: readonly string[] = [
  'C',
  'C#',
  'D',
  'D#',
  'E',
  'F',
  'F#',
  'G',
  'G#',
  'A',
  'A#',
  'B',
]

const NOTE_PATTERN = /^([A-Ga-g])(#|b)?(-?\d+)$/

/** MIDI note number for scientific pitch notation, e.g. 'C4' -> 60, 'A4' -> 69. */
function noteToMidi(note: string): number {
  const match = NOTE_PATTERN.exec(note.trim())
  if (!match) {
    throw new Error(`"${note}" is not a valid note in scientific pitch notation (e.g. "A4", "C#3", "Bb5")`)
  }
  const [, letter, accidental, octaveText] = match
  const base = SEMITONE_FROM_C[(letter as string).toUpperCase()]
  if (base === undefined) {
    throw new Error(`"${note}" has an unrecognised note letter`)
  }
  const accidentalOffset = accidental === '#' ? 1 : accidental === 'b' ? -1 : 0
  const octave = Number(octaveText)
  return (octave + 1) * 12 + base + accidentalOffset
}

function midiToNote(midi: number): string {
  const octave = Math.floor(midi / 12) - 1
  const index = ((midi % 12) + 12) % 12
  return `${CHROMATIC_SCALE[index]}${octave}`
}

/** Converts scientific pitch notation ('A4', 'C#3', 'Bb5', …) to a frequency in Hz, A4 = 440. */
export function noteToFrequency(note: string): number {
  const midi = noteToMidi(note)
  return 440 * Math.pow(2, (midi - 69) / 12)
}

/** Shifts a note by a number of semitones (negative moves down), re-spelling with sharps. */
export function transpose(note: string, semitones: number): string {
  return midiToNote(noteToMidi(note) + semitones)
}

// ---------------------------------------------------------------------------
// Chords
// ---------------------------------------------------------------------------

export type ChordQuality = 'major' | 'minor'

const CHORD_INTERVALS: Readonly<Record<ChordQuality, readonly number[]>> = {
  major: [0, 4, 7],
  minor: [0, 3, 7],
}

/** Builds a triad above `root`, e.g. `chord('C4', 'major') -> ['C4', 'E4', 'G4']`. */
export function chord(root: string, quality: ChordQuality): string[] {
  return CHORD_INTERVALS[quality].map((interval) => transpose(root, interval))
}

// ---------------------------------------------------------------------------
// Tracks
// ---------------------------------------------------------------------------

export type VoiceRole = 'bass' | 'chord' | 'melody' | 'drum'

/**
 * 'noise' is a filtered white-noise burst rather than a tonal oscillator —
 * used for the drum voice, where `note` still picks a pitch centre (low
 * notes read as a kick-ish thud, high notes as a hat-ish tick) so percussion
 * stays data-driven and testable like everything else.
 */
export type Waveform = 'sine' | 'square' | 'sawtooth' | 'triangle' | 'noise'

export interface NoteEvent {
  /** Offset from the start of the loop, in beats. */
  readonly startBeat: number
  readonly durationBeats: number
  /** A single pitch, for bass/melody/drum voices. */
  readonly note?: string
  /** Multiple simultaneous pitches, for the chord/pad voice. */
  readonly notes?: readonly string[]
}

export interface Voice {
  readonly role: VoiceRole
  readonly waveform: Waveform
  /** Relative mix level in (0, 1], scaled further by the music bus gain. */
  readonly gain: number
  readonly events: readonly NoteEvent[]
}

export interface Track {
  readonly bpm: number
  readonly bars: number
  readonly beatsPerBar: number
  readonly voices: readonly Voice[]
}

// ---------------------------------------------------------------------------
// Title — bright, welcoming, unhurried. Classic I-V-vi-IV in C major.
// ---------------------------------------------------------------------------

export const TITLE_TRACK: Track = {
  bpm: 96,
  bars: 4,
  beatsPerBar: 4,
  voices: [
    {
      role: 'chord',
      waveform: 'triangle',
      gain: 0.16,
      events: [
        { startBeat: 0, durationBeats: 4, notes: chord('C4', 'major') },
        { startBeat: 4, durationBeats: 4, notes: chord('G3', 'major') },
        { startBeat: 8, durationBeats: 4, notes: chord('A3', 'minor') },
        { startBeat: 12, durationBeats: 4, notes: chord('F3', 'major') },
      ],
    },
    {
      // Root, then a gentle lift to the fifth each bar — an easy, unhurried walk.
      role: 'bass',
      waveform: 'sine',
      gain: 0.3,
      events: [
        { startBeat: 0, durationBeats: 1.5, note: 'C3' },
        { startBeat: 2, durationBeats: 1.5, note: transpose('C3', 7) },
        { startBeat: 4, durationBeats: 1.5, note: 'G2' },
        { startBeat: 6, durationBeats: 1.5, note: transpose('G2', 7) },
        { startBeat: 8, durationBeats: 1.5, note: 'A2' },
        { startBeat: 10, durationBeats: 1.5, note: transpose('A2', 7) },
        { startBeat: 12, durationBeats: 1.5, note: 'F2' },
        { startBeat: 14, durationBeats: 1.5, note: transpose('F2', 7) },
      ],
    },
    {
      // A bright, singable four-bar phrase that resolves back to C, ready to loop.
      role: 'melody',
      waveform: 'square',
      gain: 0.14,
      events: [
        { startBeat: 0, durationBeats: 0.5, note: 'E4' },
        { startBeat: 0.5, durationBeats: 0.5, note: 'G4' },
        { startBeat: 1, durationBeats: 1, note: 'A4' },
        { startBeat: 2, durationBeats: 0.5, note: 'G4' },
        { startBeat: 2.5, durationBeats: 0.5, note: 'E4' },
        { startBeat: 3, durationBeats: 1, note: 'C4' },

        { startBeat: 4, durationBeats: 0.5, note: 'D4' },
        { startBeat: 4.5, durationBeats: 0.5, note: 'G4' },
        { startBeat: 5, durationBeats: 1, note: 'B4' },
        { startBeat: 6, durationBeats: 0.5, note: 'A4' },
        { startBeat: 6.5, durationBeats: 0.5, note: 'G4' },
        { startBeat: 7, durationBeats: 1, note: 'D4' },

        { startBeat: 8, durationBeats: 0.5, note: 'E4' },
        { startBeat: 8.5, durationBeats: 0.5, note: 'A4' },
        { startBeat: 9, durationBeats: 1, note: 'C5' },
        { startBeat: 10, durationBeats: 0.5, note: 'B4' },
        { startBeat: 10.5, durationBeats: 0.5, note: 'A4' },
        { startBeat: 11, durationBeats: 1, note: 'E4' },

        { startBeat: 12, durationBeats: 0.5, note: 'F4' },
        { startBeat: 12.5, durationBeats: 0.5, note: 'A4' },
        { startBeat: 13, durationBeats: 1, note: 'C5' },
        { startBeat: 14, durationBeats: 0.5, note: 'A4' },
        { startBeat: 14.5, durationBeats: 0.5, note: 'G4' },
        { startBeat: 15, durationBeats: 1, note: 'C4' },
      ],
    },
    {
      // A very light pulse: a soft downbeat kick every other bar and a sparse tick.
      role: 'drum',
      waveform: 'noise',
      gain: 0.1,
      events: [
        { startBeat: 0, durationBeats: 0.25, note: 'C2' },
        { startBeat: 8, durationBeats: 0.25, note: 'C2' },
        { startBeat: 2, durationBeats: 0.15, note: 'C6' },
        { startBeat: 6, durationBeats: 0.15, note: 'C6' },
        { startBeat: 10, durationBeats: 0.15, note: 'C6' },
        { startBeat: 14, durationBeats: 0.15, note: 'C6' },
      ],
    },
  ],
}

// ---------------------------------------------------------------------------
// Board — bouncy, curious, mid-tempo. This is heard for most of the game, so
// it gets the longest loop (8 bars) and a little melodic development instead
// of one bar repeated four times, to stay pleasant after many repeats.
// ---------------------------------------------------------------------------

const BOARD_BASS_BARS: readonly [string, string][] = [
  ['G2', 'D3'],
  ['D2', 'A2'],
  ['E2', 'B2'],
  ['B2', 'F#3'],
  ['C3', 'G3'],
  ['G2', 'D3'],
  ['A2', 'E3'],
  ['D2', 'A2'],
]

function boardBassEvents(): NoteEvent[] {
  const events: NoteEvent[] = []
  BOARD_BASS_BARS.forEach(([root, fifth], index) => {
    const bar = index * 4
    events.push(
      { startBeat: bar + 0, durationBeats: 0.35, note: root },
      { startBeat: bar + 1, durationBeats: 0.35, note: fifth },
      { startBeat: bar + 2, durationBeats: 0.35, note: root },
      { startBeat: bar + 2.5, durationBeats: 0.25, note: transpose(root, 12) },
      { startBeat: bar + 3, durationBeats: 0.35, note: fifth },
    )
  })
  return events
}

const BOARD_CHORD_BARS: readonly [string, ChordQuality][] = [
  ['G3', 'major'],
  ['D3', 'major'],
  ['E3', 'minor'],
  ['B3', 'minor'],
  ['C4', 'major'],
  ['G3', 'major'],
  ['A3', 'minor'],
  ['D3', 'major'],
]

function boardChordEvents(): NoteEvent[] {
  return BOARD_CHORD_BARS.map(([root, quality], index) => ({
    startBeat: index * 4,
    durationBeats: 4,
    notes: chord(root, quality),
  }))
}

// A curious call-and-response shape reused across all eight bars, so the
// melody feels composed rather than random while still moving with each
// chord underneath it.
const BOARD_MELODY_BARS: readonly (readonly [string, string, string, string, string, string])[] = [
  ['B4', 'D5', 'B4', 'G4', 'A4', 'B4'],
  ['D5', 'C5', 'B4', 'A4', 'G4', 'F#4'],
  ['E4', 'G4', 'B4', 'A4', 'G4', 'E4'],
  ['F#4', 'A4', 'B4', 'A4', 'F#4', 'D4'],
  ['E4', 'G4', 'C5', 'B4', 'G4', 'E4'],
  ['D4', 'G4', 'B4', 'A4', 'G4', 'D4'],
  ['C5', 'A4', 'E4', 'F#4', 'G4', 'A4'],
  ['B4', 'A4', 'G4', 'F#4', 'D4', 'D4'],
]

function boardMelodyEvents(): NoteEvent[] {
  const events: NoteEvent[] = []
  BOARD_MELODY_BARS.forEach((notes, index) => {
    const bar = index * 4
    const [a, b, c, d, e, f] = notes
    if (index === 7) {
      // Bar 8 resolves on the last two beats held long, leading back to bar 1.
      events.push(
        { startBeat: bar + 0, durationBeats: 0.5, note: a },
        { startBeat: bar + 0.5, durationBeats: 0.5, note: b },
        { startBeat: bar + 1, durationBeats: 1, note: c },
        { startBeat: bar + 2, durationBeats: 1, note: d },
        { startBeat: bar + 3, durationBeats: 1, note: f },
      )
      return
    }
    events.push(
      { startBeat: bar + 0, durationBeats: 0.5, note: a },
      { startBeat: bar + 0.5, durationBeats: 0.5, note: b },
      { startBeat: bar + 1, durationBeats: 1, note: c },
      { startBeat: bar + 2, durationBeats: 0.5, note: d },
      { startBeat: bar + 2.5, durationBeats: 0.5, note: e },
      { startBeat: bar + 3, durationBeats: 1, note: f },
    )
  })
  return events
}

function boardDrumEvents(): NoteEvent[] {
  const events: NoteEvent[] = []
  for (let bar = 0; bar < 8; bar++) {
    const base = bar * 4
    events.push(
      { startBeat: base, durationBeats: 0.2, note: 'C2' },
      { startBeat: base + 2, durationBeats: 0.18, note: 'G3' },
      { startBeat: base + 1.5, durationBeats: 0.12, note: 'C6' },
      { startBeat: base + 3.5, durationBeats: 0.12, note: 'C6' },
    )
  }
  return events
}

export const BOARD_TRACK: Track = {
  bpm: 116,
  bars: 8,
  beatsPerBar: 4,
  voices: [
    { role: 'chord', waveform: 'triangle', gain: 0.15, events: boardChordEvents() },
    { role: 'bass', waveform: 'triangle', gain: 0.26, events: boardBassEvents() },
    { role: 'melody', waveform: 'triangle', gain: 0.15, events: boardMelodyEvents() },
    { role: 'drum', waveform: 'noise', gain: 0.11, events: boardDrumEvents() },
  ],
}

// ---------------------------------------------------------------------------
// Results — warm and triumphant. A stately IV-V-I-ish resolution in F major,
// with the final chord voiced an octave higher for a lift on the loop.
// ---------------------------------------------------------------------------

export const RESULTS_TRACK: Track = {
  bpm: 92,
  bars: 4,
  beatsPerBar: 4,
  voices: [
    {
      role: 'chord',
      waveform: 'triangle',
      gain: 0.18,
      events: [
        { startBeat: 0, durationBeats: 4, notes: chord('F3', 'major') },
        { startBeat: 4, durationBeats: 4, notes: chord('Bb3', 'major') },
        { startBeat: 8, durationBeats: 4, notes: chord('C4', 'major') },
        { startBeat: 12, durationBeats: 4, notes: chord('F4', 'major') },
      ],
    },
    {
      role: 'bass',
      waveform: 'sine',
      gain: 0.32,
      events: [
        { startBeat: 0, durationBeats: 2, note: 'F2' },
        { startBeat: 2, durationBeats: 2, note: transpose('F2', 7) },
        { startBeat: 4, durationBeats: 2, note: 'Bb2' },
        { startBeat: 6, durationBeats: 2, note: transpose('Bb2', 7) },
        { startBeat: 8, durationBeats: 2, note: 'C3' },
        { startBeat: 10, durationBeats: 2, note: transpose('C3', 7) },
        // A long held root to close the phrase with confidence.
        { startBeat: 12, durationBeats: 4, note: 'F2' },
      ],
    },
    {
      // A brassy, rising fanfare that lands on a held high note each bar.
      role: 'melody',
      waveform: 'sawtooth',
      gain: 0.15,
      events: [
        { startBeat: 0, durationBeats: 0.5, note: 'F4' },
        { startBeat: 0.5, durationBeats: 0.5, note: 'A4' },
        { startBeat: 1, durationBeats: 1, note: 'C5' },
        { startBeat: 2, durationBeats: 2, note: 'F5' },

        { startBeat: 4, durationBeats: 0.5, note: 'Bb4' },
        { startBeat: 4.5, durationBeats: 0.5, note: 'D5' },
        { startBeat: 5, durationBeats: 1, note: 'F5' },
        { startBeat: 6, durationBeats: 1, note: 'D5' },
        { startBeat: 7, durationBeats: 1, note: 'Bb4' },

        { startBeat: 8, durationBeats: 0.5, note: 'C5' },
        { startBeat: 8.5, durationBeats: 0.5, note: 'E5' },
        { startBeat: 9, durationBeats: 1, note: 'G5' },
        { startBeat: 10, durationBeats: 0.5, note: 'E5' },
        { startBeat: 10.5, durationBeats: 0.5, note: 'C5' },
        { startBeat: 11, durationBeats: 1, note: 'G4' },

        { startBeat: 12, durationBeats: 1, note: 'F4' },
        { startBeat: 13, durationBeats: 1, note: 'A4' },
        { startBeat: 14, durationBeats: 1, note: 'C5' },
        { startBeat: 15, durationBeats: 1, note: 'F5' },
      ],
    },
    {
      // A stately march pulse with a triumphant accent at the top of the loop.
      role: 'drum',
      waveform: 'noise',
      gain: 0.13,
      events: [
        { startBeat: 0, durationBeats: 0.3, note: 'C6' },
        { startBeat: 0, durationBeats: 0.2, note: 'C2' },
        { startBeat: 2, durationBeats: 0.2, note: 'C2' },
        { startBeat: 4, durationBeats: 0.2, note: 'C2' },
        { startBeat: 6, durationBeats: 0.2, note: 'C2' },
        { startBeat: 8, durationBeats: 0.2, note: 'C2' },
        { startBeat: 10, durationBeats: 0.2, note: 'C2' },
        { startBeat: 12, durationBeats: 0.3, note: 'C6' },
        { startBeat: 12, durationBeats: 0.2, note: 'C2' },
        { startBeat: 14, durationBeats: 0.2, note: 'C2' },
      ],
    },
  ],
}
