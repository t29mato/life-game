import { describe, expect, it } from 'vitest'
import {
  BOARD_TRACK,
  RESULTS_TRACK,
  TITLE_TRACK,
  chord,
  noteToFrequency,
  transpose,
} from './theory'
import type { Track, VoiceRole } from './theory'
import { BOLIVIA_BOARD_TRACK } from './theory.bolivia'
import { FRANCE_BOARD_TRACK } from './theory.france'
import { INDIA_BOARD_TRACK } from './theory.india'
import { JAPAN_BOARD_TRACK } from './theory.japan'

const EPSILON = 0.01

describe('noteToFrequency', () => {
  it('resolves A4 to concert pitch 440', () => {
    expect(noteToFrequency('A4')).toBeCloseTo(440, 2)
  })

  it('resolves C4 (middle C) to approximately 261.63', () => {
    expect(noteToFrequency('C4')).toBeCloseTo(261.63, 1)
  })

  it('resolves an octave up to double the frequency', () => {
    expect(noteToFrequency('A5')).toBeCloseTo(880, 2)
  })

  it('resolves an octave down to half the frequency', () => {
    expect(noteToFrequency('A3')).toBeCloseTo(220, 2)
  })

  it('handles a sharp', () => {
    // C#4 sits one semitone above C4.
    const c4 = noteToFrequency('C4')
    const cSharp4 = noteToFrequency('C#4')
    expect(cSharp4).toBeCloseTo(c4 * Math.pow(2, 1 / 12), EPSILON)
  })

  it('handles a flat', () => {
    // Db4 is enharmonically the same pitch as C#4.
    expect(noteToFrequency('Db4')).toBeCloseTo(noteToFrequency('C#4'), 2)
  })

  it('throws on an unrecognised letter', () => {
    expect(() => noteToFrequency('H4')).toThrow()
  })

  it('throws on a missing octave', () => {
    expect(() => noteToFrequency('C')).toThrow()
  })

  it('throws on garbage input', () => {
    expect(() => noteToFrequency('not-a-note')).toThrow()
    expect(() => noteToFrequency('')).toThrow()
  })
})

describe('transpose', () => {
  it('moves up an octave with +12 semitones', () => {
    expect(transpose('C4', 12)).toBe('C5')
  })

  it('moves down an octave with -12 semitones', () => {
    expect(transpose('C4', -12)).toBe('C3')
  })

  it('moves a perfect fifth up with +7 semitones', () => {
    expect(transpose('C4', 7)).toBe('G4')
  })

  it('crosses an octave boundary correctly', () => {
    expect(transpose('A4', 3)).toBe('C5')
  })

  it('produces a note that noteToFrequency can parse', () => {
    expect(() => noteToFrequency(transpose('F#3', 5))).not.toThrow()
  })
})

describe('chord', () => {
  it('builds a major triad', () => {
    expect(chord('C4', 'major')).toEqual(['C4', 'E4', 'G4'])
  })

  it('builds a minor triad', () => {
    expect(chord('A3', 'minor')).toEqual(['A3', 'C4', 'E4'])
  })

  it('every generated note parses as a frequency', () => {
    for (const note of [...chord('G3', 'major'), ...chord('B3', 'minor')]) {
      expect(() => noteToFrequency(note)).not.toThrow()
    }
  })
})

describe('BGM track data', () => {
  const tracks: readonly [string, Track][] = [
    ['title', TITLE_TRACK],
    ['board', BOARD_TRACK],
    ['results', RESULTS_TRACK],
    ['board:japan', JAPAN_BOARD_TRACK],
    ['board:france', FRANCE_BOARD_TRACK],
    ['board:india', INDIA_BOARD_TRACK],
    ['board:bolivia', BOLIVIA_BOARD_TRACK],
  ]

  it.each(tracks)('%s has a sane tempo and loop length', (_name, track) => {
    expect(track.bpm).toBeGreaterThanOrEqual(60)
    expect(track.bpm).toBeLessThanOrEqual(160)
    expect(track.bars).toBeGreaterThan(0)
    expect(track.beatsPerBar).toBeGreaterThan(0)
    const totalBeats = track.bars * track.beatsPerBar
    const loopSeconds = (totalBeats * 60) / track.bpm
    expect(loopSeconds).toBeGreaterThanOrEqual(4)
    expect(loopSeconds).toBeLessThanOrEqual(40)
  })

  it.each(tracks)('%s has all four voice roles', (_name, track) => {
    const roles = new Set<VoiceRole>(track.voices.map((voice) => voice.role))
    expect(roles.has('bass')).toBe(true)
    expect(roles.has('chord')).toBe(true)
    expect(roles.has('melody')).toBe(true)
    expect(roles.has('drum')).toBe(true)
  })

  it.each(tracks)('%s keeps every voice gain within (0, 1]', (_name, track) => {
    for (const voice of track.voices) {
      expect(voice.gain).toBeGreaterThan(0)
      expect(voice.gain).toBeLessThanOrEqual(1)
    }
  })

  it.each(tracks)('%s has at least one event per voice', (_name, track) => {
    for (const voice of track.voices) {
      expect(voice.events.length).toBeGreaterThan(0)
    }
  })

  it.each(tracks)('%s never lets an event run past the end of the loop', (_name, track) => {
    const totalBeats = track.bars * track.beatsPerBar
    for (const voice of track.voices) {
      for (const event of voice.events) {
        expect(event.startBeat).toBeGreaterThanOrEqual(0)
        expect(event.durationBeats).toBeGreaterThan(0)
        expect(event.startBeat + event.durationBeats).toBeLessThanOrEqual(totalBeats + 1e-9)
      }
    }
  })

  it.each(tracks)('%s gives every event a note or a notes list, never neither', (_name, track) => {
    for (const voice of track.voices) {
      for (const event of voice.events) {
        const hasNote = typeof event.note === 'string'
        const hasNotes = Array.isArray(event.notes) && event.notes.length > 0
        expect(hasNote || hasNotes).toBe(true)
      }
    }
  })

  it.each(tracks)('%s uses only pitches that parse as valid frequencies', (_name, track) => {
    for (const voice of track.voices) {
      for (const event of voice.events) {
        if (event.note) {
          expect(() => noteToFrequency(event.note as string)).not.toThrow()
        }
        for (const note of event.notes ?? []) {
          expect(() => noteToFrequency(note)).not.toThrow()
        }
      }
    }
  })

  it('gives the chord voice simultaneous notes, not single tones', () => {
    for (const track of [TITLE_TRACK, BOARD_TRACK, RESULTS_TRACK]) {
      const chordVoice = track.voices.find((voice) => voice.role === 'chord')
      expect(chordVoice).toBeDefined()
      for (const event of chordVoice!.events) {
        expect(event.notes && event.notes.length).toBeGreaterThanOrEqual(3)
      }
    }
  })

  it('names board as the longest loop, since it plays for most of the game', () => {
    const loopBeats = (t: Track) => t.bars * t.beatsPerBar * (60 / t.bpm)
    expect(loopBeats(BOARD_TRACK)).toBeGreaterThan(loopBeats(TITLE_TRACK))
    expect(loopBeats(BOARD_TRACK)).toBeGreaterThan(loopBeats(RESULTS_TRACK))
  })
})
