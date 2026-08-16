/**
 * BGM for the Japan edition board, kept in its own module so the shared
 * `theory.ts` stays the engine + the default tracks. Data only — no
 * `AudioContext` here either.
 */

import { chord, transpose, type ChordQuality, type NoteEvent, type Track } from './theory'

// ---------------------------------------------------------------------------
// Japan board — an original tune built on the yonanuki major scale (a major
// scale with the 4th and 7th degrees removed), here D-E-F#-A-B. Dropping the
// leading tone kills the pull of a Western dominant, so the harmony leans on
// plagal motion instead and the whole loop stays open and slightly wistful
// rather than driving. Everything else serves that space: the pad breathes out
// on the last beat of most bars, the bass states a root and a fifth and then
// gets out of the way, and the percussion is a woodblock tick with an
// occasional temple-bell swell instead of a kit.
// ---------------------------------------------------------------------------

/** One chord per bar. No C# anywhere — the omitted 7th stays omitted in the harmony too. */
const JAPAN_CHORD_BARS: readonly (readonly [string, ChordQuality])[] = [
  ['D3', 'major'],
  ['B3', 'minor'],
  ['E3', 'minor'],
  ['G3', 'major'],
  ['B3', 'minor'],
  ['D3', 'major'],
  ['E3', 'minor'],
  ['G3', 'major'],
]

/** Bars that close a four-bar phrase: the pad holds through beat 4 to support the melody's long note. */
const PHRASE_END_BARS: readonly number[] = [3, 7]

function japanChordEvents(): NoteEvent[] {
  return JAPAN_CHORD_BARS.map(([root, quality], index) => ({
    startBeat: index * 4,
    durationBeats: PHRASE_END_BARS.includes(index) ? 4 : 3,
    notes: chord(root, quality),
  }))
}

const JAPAN_BASS_ROOTS: readonly string[] = ['D2', 'B2', 'E2', 'G2', 'B2', 'D2', 'E2', 'G2']

function japanBassEvents(): NoteEvent[] {
  const events: NoteEvent[] = []
  JAPAN_BASS_ROOTS.forEach((root, index) => {
    const bar = index * 4
    events.push({ startBeat: bar + 0, durationBeats: 1.8, note: root })
    if (PHRASE_END_BARS.includes(index)) {
      // A two-note lift out of the phrase, the only busy moment the bass gets.
      events.push(
        { startBeat: bar + 2, durationBeats: 0.5, note: transpose(root, 7) },
        { startBeat: bar + 3, durationBeats: 0.9, note: transpose(root, 12) },
      )
      return
    }
    events.push({ startBeat: bar + 2.5, durationBeats: 0.8, note: transpose(root, 7) })
  })
  return events
}

type MelodyShape = 'run' | 'settle'

/**
 * `run` is the koto-ish figure: two plucks, a held note, a quick flick of two
 * sixteenths, then a longer landing. `settle` ends a phrase by dropping to one
 * note held for the back half of the bar.
 */
const MELODY_RHYTHMS: Readonly<Record<MelodyShape, readonly (readonly [number, number])[]>> = {
  run: [
    [0, 0.45],
    [0.5, 0.45],
    [1, 0.9],
    [2, 0.25],
    [2.25, 0.25],
    [2.5, 0.45],
    [3, 0.9],
  ],
  settle: [
    [0, 0.5],
    [0.5, 0.5],
    [1, 0.9],
    [2, 2],
  ],
}

/**
 * Strictly D yonanuki (D E F# A B) in every bar. Bars 1-4 arc up and settle on
 * the open fifth; bars 5-8 climb higher, peak on F#5, then fall back to a held
 * low tonic that hands cleanly back to bar 1.
 */
const JAPAN_MELODY_BARS: readonly (readonly [MelodyShape, readonly string[]])[] = [
  ['run', ['A4', 'B4', 'D5', 'B4', 'A4', 'F#4', 'A4']],
  ['run', ['B4', 'D5', 'F#5', 'E5', 'D5', 'B4', 'A4']],
  ['run', ['E5', 'D5', 'B4', 'A4', 'B4', 'D5', 'B4']],
  ['settle', ['A4', 'B4', 'D5', 'A4']],
  ['run', ['D5', 'E5', 'F#5', 'E5', 'D5', 'B4', 'A4']],
  ['run', ['A4', 'B4', 'D5', 'E5', 'D5', 'B4', 'A4']],
  ['run', ['E4', 'F#4', 'A4', 'B4', 'D5', 'E5', 'F#5']],
  ['settle', ['E5', 'D5', 'B4', 'D4']],
]

function japanMelodyEvents(): NoteEvent[] {
  const events: NoteEvent[] = []
  JAPAN_MELODY_BARS.forEach(([shape, notes], index) => {
    const bar = index * 4
    MELODY_RHYTHMS[shape].forEach(([offset, durationBeats], slot) => {
      events.push({ startBeat: bar + offset, durationBeats, note: notes[slot] as string })
    })
  })
  return events
}

function japanDrumEvents(): NoteEvent[] {
  const events: NoteEvent[] = []
  for (let bar = 0; bar < 8; bar++) {
    const base = bar * 4
    events.push(
      { startBeat: base + 2, durationBeats: 0.1, note: 'C6' },
      { startBeat: base + 3.5, durationBeats: 0.08, note: 'C6' },
    )
    if (bar % 4 === 0) {
      // Top of each four-bar phrase: a long, soft ring over the low hit.
      events.push(
        { startBeat: base, durationBeats: 0.6, note: 'G4' },
        { startBeat: base, durationBeats: 0.22, note: 'C2' },
      )
    } else if (bar % 2 === 0) {
      events.push({ startBeat: base, durationBeats: 0.18, note: 'C2' })
    }
    if (PHRASE_END_BARS.includes(bar)) {
      events.push(
        { startBeat: base + 3.25, durationBeats: 0.08, note: 'C6' },
        { startBeat: base + 3.75, durationBeats: 0.08, note: 'C6' },
      )
    }
  }
  return events
}

export const JAPAN_BOARD_TRACK: Track = {
  bpm: 104,
  bars: 8,
  beatsPerBar: 4,
  voices: [
    { role: 'chord', waveform: 'triangle', gain: 0.15, events: japanChordEvents() },
    { role: 'bass', waveform: 'sine', gain: 0.26, events: japanBassEvents() },
    { role: 'melody', waveform: 'triangle', gain: 0.15, events: japanMelodyEvents() },
    { role: 'drum', waveform: 'noise', gain: 0.11, events: japanDrumEvents() },
  ],
}
