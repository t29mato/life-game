/**
 * Bolivia edition BGM, as plain data in the same shape as the tracks in
 * `./theory`. Kept in its own module so the edition-specific music can be
 * swapped in without touching the shared theory helpers.
 */

import { chord, transpose } from './theory'
import type { ChordQuality, NoteEvent, Track } from './theory'

// ---------------------------------------------------------------------------
// Bolivia board — an original huayno-flavoured loop, not a quotation of any
// existing tune. Everything melodic sits in A minor pentatonic (A C D E G),
// the scale that gives Andean music its open, hollow colour. The groove is the
// huayno "skip": a long note followed by a short one (0.75 + 0.25 of a beat),
// repeated twice per bar, so the bar always leans forward. Underneath it the
// harmony walks i-i-III-VII-i-VI-VII-i, which returns home on bar 8 and lets
// the loop restart without a seam.
// ---------------------------------------------------------------------------

/** One bar of harmony, as a triad root plus quality. */
const BOLIVIA_CHORD_BARS: readonly (readonly [string, ChordQuality])[] = [
  ['A3', 'minor'],
  ['A3', 'minor'],
  ['C4', 'major'],
  ['G3', 'major'],
  ['A3', 'minor'],
  ['F3', 'major'],
  ['G3', 'major'],
  ['A3', 'minor'],
]

/**
 * Charango-style strum: four short chords across every two beats, with an
 * extra flick just before the halfway point so the chord voice syncopates
 * against the bass instead of doubling it.
 */
function boliviaChordCell(offset: number, notes: readonly string[]): NoteEvent[] {
  return [
    { startBeat: offset + 0, durationBeats: 0.4, notes },
    { startBeat: offset + 0.75, durationBeats: 0.2, notes },
    { startBeat: offset + 1.25, durationBeats: 0.2, notes },
    { startBeat: offset + 1.5, durationBeats: 0.4, notes },
  ]
}

function boliviaChordEvents(): NoteEvent[] {
  const events: NoteEvent[] = []
  BOLIVIA_CHORD_BARS.forEach(([root, quality], index) => {
    const bar = index * 4
    const notes = chord(root, quality)
    events.push(...boliviaChordCell(bar + 0, notes), ...boliviaChordCell(bar + 2, notes))
  })
  return events
}

/** Bass root per bar; the fifth above it is derived, so the two always agree. */
const BOLIVIA_BASS_ROOTS: readonly string[] = ['A2', 'A2', 'C3', 'G2', 'A2', 'F2', 'G2', 'A2']

/**
 * The huayno cell itself: a long root, the same root again as a short kick
 * off the back of it, then the fifth to close the two-beat phrase.
 */
function boliviaBassCell(offset: number, root: string): NoteEvent[] {
  return [
    { startBeat: offset + 0, durationBeats: 0.7, note: root },
    { startBeat: offset + 0.75, durationBeats: 0.2, note: root },
    { startBeat: offset + 1.5, durationBeats: 0.45, note: transpose(root, 7) },
  ]
}

function boliviaBassEvents(): NoteEvent[] {
  const events: NoteEvent[] = []
  BOLIVIA_BASS_ROOTS.forEach((root, index) => {
    const bar = index * 4
    events.push(...boliviaBassCell(bar + 0, root), ...boliviaBassCell(bar + 2, root))
  })
  return events
}

/**
 * The quena (Andean flute) line, one entry per bar as `[offset, duration,
 * note]`. The engine has no vibrato, so the character comes from register and
 * from alternating long held notes with quick stepwise runs. Bar 8 walks down
 * to a two-beat A4 that hands straight back to the high E5 of bar 1.
 */
const BOLIVIA_MELODY_BARS: readonly (readonly (readonly [number, number, string])[])[] = [
  [
    [0, 1.5, 'E5'],
    [1.5, 0.5, 'D5'],
    [2, 1, 'C5'],
    [3, 1, 'A4'],
  ],
  [
    [0, 0.5, 'A4'],
    [0.5, 0.5, 'C5'],
    [1, 0.5, 'D5'],
    [1.5, 0.5, 'E5'],
    [2, 2, 'G5'],
  ],
  [
    [0, 1, 'G5'],
    [1, 0.5, 'E5'],
    [1.5, 0.5, 'D5'],
    [2, 1.5, 'C5'],
    [3.5, 0.5, 'D5'],
  ],
  [
    [0, 1, 'E5'],
    [1, 0.75, 'D5'],
    [1.75, 0.25, 'C5'],
    [2, 2, 'D5'],
  ],
  [
    [0, 0.75, 'A4'],
    [0.75, 0.25, 'C5'],
    [1, 1, 'E5'],
    [2, 0.5, 'D5'],
    [2.5, 0.5, 'C5'],
    [3, 1, 'A4'],
  ],
  [
    [0, 1.5, 'C5'],
    [1.5, 0.5, 'A4'],
    [2, 1, 'G4'],
    [3, 1, 'A4'],
  ],
  [
    [0, 0.5, 'D5'],
    [0.5, 0.5, 'E5'],
    [1, 1, 'G5'],
    [2, 0.5, 'E5'],
    [2.5, 0.5, 'D5'],
    [3, 1, 'C5'],
  ],
  [
    [0, 0.5, 'E5'],
    [0.5, 0.5, 'D5'],
    [1, 1, 'C5'],
    [2, 2, 'A4'],
  ],
]

function boliviaMelodyEvents(): NoteEvent[] {
  const events: NoteEvent[] = []
  BOLIVIA_MELODY_BARS.forEach((phrase, index) => {
    const bar = index * 4
    phrase.forEach(([offset, durationBeats, note]) => {
      events.push({ startBeat: bar + offset, durationBeats, note })
    })
  })
  return events
}

/**
 * Bombo and hats. The low hits trace the same long-short skip as the bass so
 * the groove reads clearly even when the melody rests, and bars 4 and 8 get a
 * short sixteenth fill to push into the next phrase.
 */
function boliviaDrumEvents(): NoteEvent[] {
  const events: NoteEvent[] = []
  for (let index = 0; index < 8; index++) {
    const bar = index * 4
    events.push(
      { startBeat: bar + 0, durationBeats: 0.22, note: 'C2' },
      { startBeat: bar + 0.75, durationBeats: 0.14, note: 'C2' },
      { startBeat: bar + 1.5, durationBeats: 0.16, note: 'G3' },
      { startBeat: bar + 2, durationBeats: 0.22, note: 'C2' },
      { startBeat: bar + 2.75, durationBeats: 0.14, note: 'C2' },
      { startBeat: bar + 3.5, durationBeats: 0.16, note: 'G3' },
      { startBeat: bar + 0.5, durationBeats: 0.1, note: 'C6' },
      { startBeat: bar + 1, durationBeats: 0.1, note: 'C6' },
      { startBeat: bar + 2.5, durationBeats: 0.1, note: 'C6' },
      { startBeat: bar + 3, durationBeats: 0.1, note: 'C6' },
    )
    if (index === 3 || index === 7) {
      events.push(
        { startBeat: bar + 3.25, durationBeats: 0.1, note: 'C6' },
        { startBeat: bar + 3.75, durationBeats: 0.1, note: 'C6' },
      )
    }
  }
  return events
}

/**
 * Bolivia's gameplay loop: eight bars of original huayno-style music at 124
 * BPM in A minor pentatonic. A charango-like square-wave voice strums the
 * i-III-VII-VI harmony, a triangle bass drives the long-short huayno skip, a
 * sustained triangle melody stands in for a quena, and a busier-than-usual
 * bombo pulse carries the dance rhythm that gives the style its identity.
 */
export const BOLIVIA_BOARD_TRACK: Track = {
  bpm: 124,
  bars: 8,
  beatsPerBar: 4,
  voices: [
    // Square reads as a plucked charango, but it is perceptually louder than
    // the triangle the other tracks use here, so its gain sits a little under
    // BOARD_TRACK's 0.15 to keep the editions level with each other.
    { role: 'chord', waveform: 'square', gain: 0.11, events: boliviaChordEvents() },
    { role: 'bass', waveform: 'triangle', gain: 0.26, events: boliviaBassEvents() },
    { role: 'melody', waveform: 'triangle', gain: 0.15, events: boliviaMelodyEvents() },
    { role: 'drum', waveform: 'noise', gain: 0.13, events: boliviaDrumEvents() },
  ],
}
