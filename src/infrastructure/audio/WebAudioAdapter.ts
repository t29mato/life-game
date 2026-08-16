import type { AudioPort, BgmTrack, SfxName } from '@application/ports/AudioPort'
import { BOARD_TRACK, RESULTS_TRACK, TITLE_TRACK, noteToFrequency } from './theory'
import type { Track, Voice, NoteEvent, Waveform } from './theory'
import { BOLIVIA_BOARD_TRACK } from './theory.bolivia'
import { FRANCE_BOARD_TRACK } from './theory.france'
import { INDIA_BOARD_TRACK } from './theory.india'
import { JAPAN_BOARD_TRACK } from './theory.japan'

const TRACKS: Record<BgmTrack, Track> = {
  title: TITLE_TRACK,
  board: BOARD_TRACK,
  results: RESULTS_TRACK,
}

/**
 * The one track that varies by country. Title and results stay shared —
 * those are heard for a few seconds each, where `'board'` plays for most of
 * a session and is where a country's own sound is actually lived in.
 */
const EDITION_BOARD_TRACKS: Readonly<Record<string, Track>> = {
  japan: JAPAN_BOARD_TRACK,
  france: FRANCE_BOARD_TRACK,
  india: INDIA_BOARD_TRACK,
  bolivia: BOLIVIA_BOARD_TRACK,
}

/** USA (and any id with no arrangement of its own) plays the default `TRACKS[trackName]`. */
function resolveTrack(trackName: BgmTrack, editionId?: string): Track {
  if (trackName !== 'board' || !editionId) return TRACKS[trackName]
  return EDITION_BOARD_TRACKS[editionId] ?? TRACKS[trackName]
}

/** How long a track cross-fades in/out when switching or stopping. */
const CROSSFADE_SECONDS = 0.3
/** How long a music/sfx mute toggle takes to ramp — snappier than a track crossfade. */
const PREF_RAMP_SECONDS = 0.12
/** The scheduler wakes up this often... */
const LOOKAHEAD_INTERVAL_MS = 25
/** ...to schedule any note that starts within this many seconds from now. */
const SCHEDULE_AHEAD_SECONDS = 0.1

const AUDIO_PREFS_KEY = 'life-journey:audio'

interface AudioPrefs {
  readonly music: boolean
  readonly sfx: boolean
}

const DEFAULT_PREFS: AudioPrefs = { music: true, sfx: true }

function resolveStorage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch {
    return null
  }
}

function readPersistedPrefs(): AudioPrefs {
  const storage = resolveStorage()
  if (!storage) return DEFAULT_PREFS
  try {
    const raw = storage.getItem(AUDIO_PREFS_KEY)
    if (!raw) return DEFAULT_PREFS
    const parsed: unknown = JSON.parse(raw)
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      typeof (parsed as Record<string, unknown>).music === 'boolean' &&
      typeof (parsed as Record<string, unknown>).sfx === 'boolean'
    ) {
      return { music: (parsed as AudioPrefs).music, sfx: (parsed as AudioPrefs).sfx }
    }
    return DEFAULT_PREFS
  } catch {
    return DEFAULT_PREFS
  }
}

function writePersistedPrefs(prefs: AudioPrefs): void {
  const storage = resolveStorage()
  if (!storage) return
  try {
    storage.setItem(AUDIO_PREFS_KEY, JSON.stringify(prefs))
  } catch {
    // Best effort — a failed save must never interrupt playback.
  }
}

function getAudioContextConstructor(): (new () => AudioContext) | undefined {
  const withVendorPrefix = globalThis as typeof globalThis & {
    AudioContext?: new () => AudioContext
    webkitAudioContext?: new () => AudioContext
  }
  return withVendorPrefix.AudioContext ?? withVendorPrefix.webkitAudioContext
}

// ---------------------------------------------------------------------------
// Low-level synthesis helpers. Every one of these takes an explicit `ctx` and
// `destination` so they never touch adapter state directly — they're just
// "make this sound happen", and every gain move is a scheduled ramp so
// nothing ever clicks.
// ---------------------------------------------------------------------------

function toOscillatorType(waveform: Waveform): OscillatorType {
  // Only drum-role voices ever use 'noise', and those are routed to
  // scheduleNoiseBurst instead — this branch is a defensive fallback only.
  return waveform === 'noise' ? 'sine' : waveform
}

interface ToneOptions {
  readonly waveform: OscillatorType
  readonly startTime: number
  readonly duration: number
  readonly frequency: number
  readonly frequencyEnd?: number
  readonly peakGain: number
  readonly attack?: number
  readonly release?: number
}

/** Schedules one oscillator with a click-free attack/release envelope, and cleans itself up when done. */
function scheduleTone(ctx: AudioContext, destination: AudioNode, options: ToneOptions): void {
  const attack = options.attack ?? 0.015
  const release = options.release ?? 0.05
  const duration = Math.max(options.duration, attack + 0.01)

  const osc = ctx.createOscillator()
  osc.type = options.waveform
  osc.frequency.setValueAtTime(options.frequency, options.startTime)
  if (options.frequencyEnd !== undefined) {
    osc.frequency.linearRampToValueAtTime(options.frequencyEnd, options.startTime + duration)
  }

  const gainNode = ctx.createGain()
  gainNode.gain.setValueAtTime(0, options.startTime)
  gainNode.gain.linearRampToValueAtTime(options.peakGain, options.startTime + attack)
  const releaseStart = Math.max(options.startTime + attack, options.startTime + duration - release)
  gainNode.gain.linearRampToValueAtTime(options.peakGain, releaseStart)
  gainNode.gain.linearRampToValueAtTime(0, options.startTime + duration)

  osc.connect(gainNode)
  gainNode.connect(destination)
  osc.onended = () => {
    osc.disconnect()
    gainNode.disconnect()
  }
  osc.start(options.startTime)
  osc.stop(options.startTime + duration + 0.02)
}

const NOISE_BUFFER_SECONDS = 1
const NOISE_SAMPLE_RATE = 44_100
const noiseBufferCache = new WeakMap<AudioContext, AudioBuffer>()

function getSharedNoiseBuffer(ctx: AudioContext): AudioBuffer {
  const cached = noiseBufferCache.get(ctx)
  if (cached) return cached
  const length = NOISE_BUFFER_SECONDS * NOISE_SAMPLE_RATE
  const buffer = ctx.createBuffer(1, length, NOISE_SAMPLE_RATE)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < length; i++) {
    data[i] = Math.random() * 2 - 1
  }
  noiseBufferCache.set(ctx, buffer)
  return buffer
}

interface NoiseOptions {
  readonly startTime: number
  readonly duration: number
  readonly peakGain: number
  readonly attack?: number
  readonly release?: number
}

/** Schedules a short filtered-by-envelope burst of white noise — the basis for every percussive sound. */
function scheduleNoiseBurst(ctx: AudioContext, destination: AudioNode, options: NoiseOptions): void {
  const attack = options.attack ?? 0.002
  const duration = Math.max(options.duration, attack + 0.01)
  const release = options.release ?? duration * 0.8

  const source = ctx.createBufferSource()
  source.buffer = getSharedNoiseBuffer(ctx)

  const gainNode = ctx.createGain()
  gainNode.gain.setValueAtTime(0, options.startTime)
  gainNode.gain.linearRampToValueAtTime(options.peakGain, options.startTime + attack)
  const releaseStart = Math.max(options.startTime + attack, options.startTime + duration - release)
  gainNode.gain.linearRampToValueAtTime(options.peakGain, releaseStart)
  gainNode.gain.linearRampToValueAtTime(0, options.startTime + duration)

  source.connect(gainNode)
  gainNode.connect(destination)
  source.onended = () => {
    source.disconnect()
    gainNode.disconnect()
  }
  source.start(options.startTime)
  source.stop(options.startTime + duration + 0.02)
}

/**
 * A drum "voice" event carries a pitch even though it is percussive — low
 * notes read as a kick-style thump (a sine sweeping quickly downward), mid
 * notes as a snare-style hit (noise plus a short thump), and high notes as a
 * hat-style tick (a very short noise burst). This keeps every event in a
 * track — including the drums — real, parseable pitch data.
 */
function scheduleDrumHit(
  ctx: AudioContext,
  destination: AudioNode,
  note: string | undefined,
  startTime: number,
  duration: number,
  voiceGain: number,
): void {
  const freq = noteToFrequency(note ?? 'C4')
  if (freq < 100) {
    const kickDuration = Math.min(duration, 0.18)
    scheduleTone(ctx, destination, {
      waveform: 'sine',
      startTime,
      duration: kickDuration,
      frequency: freq * 2.4,
      frequencyEnd: freq * 0.6,
      peakGain: voiceGain,
      attack: 0.002,
      release: kickDuration * 0.75,
    })
  } else if (freq < 500) {
    const snareDuration = Math.min(duration, 0.12)
    scheduleNoiseBurst(ctx, destination, {
      startTime,
      duration: snareDuration,
      peakGain: voiceGain * 0.75,
      attack: 0.001,
      release: snareDuration * 0.8,
    })
    scheduleTone(ctx, destination, {
      waveform: 'triangle',
      startTime,
      duration: Math.min(duration, 0.08),
      frequency: freq,
      peakGain: voiceGain * 0.55,
      attack: 0.001,
      release: 0.06,
    })
  } else {
    const hatDuration = Math.min(duration, 0.06)
    scheduleNoiseBurst(ctx, destination, {
      startTime,
      duration: hatDuration,
      peakGain: voiceGain,
      attack: 0.001,
      release: hatDuration * 0.8,
    })
  }
}

function scheduleVoiceEvent(
  ctx: AudioContext,
  destination: AudioNode,
  voice: Voice,
  event: NoteEvent,
  startTime: number,
  secondsPerBeat: number,
): void {
  const duration = event.durationBeats * secondsPerBeat
  if (voice.role === 'drum') {
    scheduleDrumHit(ctx, destination, event.note, startTime, duration, voice.gain)
    return
  }

  const notes: readonly string[] = event.notes ?? (event.note ? [event.note] : [])
  if (notes.length === 0) return
  const perNoteGain = voice.gain / notes.length
  const waveform = toOscillatorType(voice.waveform)
  for (const note of notes) {
    scheduleTone(ctx, destination, {
      waveform,
      startTime,
      duration,
      frequency: noteToFrequency(note),
      peakGain: perNoteGain,
      attack: 0.015,
      release: Math.min(0.08, duration * 0.4),
    })
  }
}

// ---------------------------------------------------------------------------
// BGM: a lookahead scheduler. Every event's absolute time is computed fresh
// from a fixed anchor (`loopStartTime`) and an integer loop-iteration count,
// never accumulated turn by turn — that is what keeps the loop from drifting
// even if a scheduler tick fires a little late.
// ---------------------------------------------------------------------------

interface BgmSession {
  readonly trackName: BgmTrack
  /** Which edition's arrangement this session is playing — `undefined` for the shared title/results tracks. */
  readonly editionId: string | undefined
  readonly track: Track
  readonly secondsPerBeat: number
  readonly loopDurationSeconds: number
  readonly loopStartTime: number
  scheduledUntilTime: number
  readonly busGain: GainNode
}

function scheduleSessionEvents(ctx: AudioContext, session: BgmSession, scheduleUntil: number): void {
  const from = session.scheduledUntilTime
  if (from >= scheduleUntil) return

  const iterMin = Math.floor((from - session.loopStartTime) / session.loopDurationSeconds)
  const iterMax = Math.floor((scheduleUntil - session.loopStartTime) / session.loopDurationSeconds)

  for (let iter = iterMin; iter <= iterMax; iter++) {
    const iterBase = session.loopStartTime + iter * session.loopDurationSeconds
    for (const voice of session.track.voices) {
      for (const event of voice.events) {
        const eventTime = iterBase + event.startBeat * session.secondsPerBeat
        if (eventTime >= from && eventTime < scheduleUntil) {
          scheduleVoiceEvent(ctx, session.busGain, voice, event, eventTime, session.secondsPerBeat)
        }
      }
    }
  }

  session.scheduledUntilTime = scheduleUntil
}

// ---------------------------------------------------------------------------
// SFX: one-shot builders. `state` is per-adapter-instance mutable scratch
// space (currently just the spin ratchet's tick counter).
// ---------------------------------------------------------------------------

interface SfxState {
  spinTicks: number
}

type SfxBuilder = (ctx: AudioContext, destination: AudioNode, state: SfxState) => void

const SFX_BUILDERS: Record<SfxName, SfxBuilder> = {
  // A single ratchet click. The presentation layer calls this once per wedge
  // as the wheel passes it, so the pitch climbing with each call is what
  // turns repeated clicks into "a rising ratchet loop".
  spin: (ctx, destination, state) => {
    const now = ctx.currentTime
    const step = Math.min(state.spinTicks, 14)
    state.spinTicks += 1
    const freq = 900 + step * 40
    scheduleNoiseBurst(ctx, destination, { startTime: now, duration: 0.05, peakGain: 0.16, attack: 0.001, release: 0.04 })
    scheduleTone(ctx, destination, { waveform: 'square', startTime: now, duration: 0.05, frequency: freq, peakGain: 0.1, attack: 0.001, release: 0.04 })
  },

  spinStop: (ctx, destination, state) => {
    state.spinTicks = 0
    const now = ctx.currentTime
    scheduleTone(ctx, destination, {
      waveform: 'sine',
      startTime: now,
      duration: 0.18,
      frequency: 180,
      frequencyEnd: 55,
      peakGain: 0.35,
      attack: 0.002,
      release: 0.14,
    })
    scheduleNoiseBurst(ctx, destination, { startTime: now, duration: 0.09, peakGain: 0.2, attack: 0.001, release: 0.08 })
  },

  hop: (ctx, destination) => {
    const now = ctx.currentTime
    scheduleTone(ctx, destination, {
      waveform: 'sine',
      startTime: now,
      duration: 0.09,
      frequency: 500,
      frequencyEnd: 880,
      peakGain: 0.22,
      attack: 0.004,
      release: 0.06,
    })
  },

  coinGain: (ctx, destination) => {
    const now = ctx.currentTime
    ;['C5', 'E5', 'G5', 'C6'].forEach((note, i) => {
      scheduleTone(ctx, destination, {
        waveform: 'square',
        startTime: now + i * 0.055,
        duration: 0.11,
        frequency: noteToFrequency(note),
        peakGain: 0.22,
        attack: 0.004,
        release: 0.07,
      })
    })
  },

  coinLose: (ctx, destination) => {
    const now = ctx.currentTime
    const steps: readonly [string, number][] = [
      ['G4', 0],
      ['E4', 0],
      // The final note is detuned down slightly for a deliberately "sour" landing.
      ['C4', -30],
    ]
    steps.forEach(([note, cents], i) => {
      const freq = noteToFrequency(note) * Math.pow(2, cents / 1200)
      scheduleTone(ctx, destination, {
        waveform: 'sawtooth',
        startTime: now + i * 0.09,
        duration: 0.16,
        frequency: freq,
        peakGain: 0.18,
        attack: 0.004,
        release: 0.12,
      })
    })
  },

  lifeTile: (ctx, destination) => {
    const now = ctx.currentTime
    ;['C6', 'E6', 'G6'].forEach((note, i) => {
      scheduleTone(ctx, destination, {
        waveform: 'sine',
        startTime: now + i * 0.03,
        duration: 0.5,
        frequency: noteToFrequency(note),
        peakGain: 0.14,
        attack: 0.005,
        release: 0.4,
      })
    })
  },

  milestone: (ctx, destination) => {
    const now = ctx.currentTime
    ;['C5', 'E5', 'G5', 'C6'].forEach((note, i) => {
      scheduleTone(ctx, destination, {
        waveform: 'triangle',
        startTime: now + i * 0.11,
        duration: 0.18,
        frequency: noteToFrequency(note),
        peakGain: 0.24,
        attack: 0.005,
        release: 0.12,
      })
    })
  },

  select: (ctx, destination) => {
    const now = ctx.currentTime
    scheduleNoiseBurst(ctx, destination, { startTime: now, duration: 0.03, peakGain: 0.12, attack: 0.001, release: 0.025 })
  },

  confirm: (ctx, destination) => {
    const now = ctx.currentTime
    scheduleTone(ctx, destination, { waveform: 'triangle', startTime: now, duration: 0.1, frequency: noteToFrequency('C5'), peakGain: 0.2, attack: 0.004, release: 0.07 })
    scheduleTone(ctx, destination, { waveform: 'triangle', startTime: now + 0.09, duration: 0.14, frequency: noteToFrequency('G5'), peakGain: 0.22, attack: 0.004, release: 0.1 })
  },

  fanfare: (ctx, destination) => {
    const now = ctx.currentTime
    const phrase: readonly [string, number, number][] = [
      ['C5', 0, 0.15],
      ['E5', 0.15, 0.15],
      ['G5', 0.3, 0.15],
      ['C6', 0.45, 0.3],
      ['G5', 0.8, 0.15],
      ['C6', 0.95, 0.5],
    ]
    for (const [note, offset, duration] of phrase) {
      scheduleTone(ctx, destination, {
        waveform: 'sawtooth',
        startTime: now + offset,
        duration,
        frequency: noteToFrequency(note),
        peakGain: 0.24,
        attack: 0.006,
        release: Math.min(0.12, duration * 0.5),
      })
    }
  },

  gameOver: (ctx, destination) => {
    const now = ctx.currentTime
    // A warm subdominant -> tonic resolution.
    const chords: readonly [readonly string[], number, number][] = [
      [['F4', 'A4', 'C5'], 0, 0.7],
      [['C4', 'E4', 'G4'], 0.6, 1.0],
    ]
    for (const [notes, offset, duration] of chords) {
      for (const note of notes) {
        scheduleTone(ctx, destination, {
          waveform: 'triangle',
          startTime: now + offset,
          duration,
          frequency: noteToFrequency(note),
          peakGain: 0.16 / notes.length,
          attack: 0.01,
          release: duration * 0.4,
        })
      }
    }
  },

  // A rising sweep plus a swelling noise bed under it — the whoosh that
  // precedes an event cut-in taking over the screen.
  cutIn: (ctx, destination) => {
    const now = ctx.currentTime
    scheduleTone(ctx, destination, {
      waveform: 'sawtooth',
      startTime: now,
      duration: 0.32,
      frequency: 130,
      frequencyEnd: 760,
      peakGain: 0.2,
      attack: 0.06,
      release: 0.08,
    })
    scheduleNoiseBurst(ctx, destination, { startTime: now, duration: 0.32, peakGain: 0.13, attack: 0.08, release: 0.14 })
  },

  // A single short, bright blip — the ticker moving as a share is bought or a
  // dividend lands.
  stockTick: (ctx, destination) => {
    const now = ctx.currentTime
    scheduleTone(ctx, destination, {
      waveform: 'square',
      startTime: now,
      duration: 0.05,
      frequency: noteToFrequency('A6'),
      peakGain: 0.14,
      attack: 0.002,
      release: 0.035,
    })
  },

  // A low thump sweeping down (the stamp striking) plus a very short noise
  // slap (paper) — a policy signed or a loan repaid.
  stamp: (ctx, destination) => {
    const now = ctx.currentTime
    scheduleTone(ctx, destination, {
      waveform: 'sine',
      startTime: now,
      duration: 0.12,
      frequency: 170,
      frequencyEnd: 55,
      peakGain: 0.32,
      attack: 0.001,
      release: 0.09,
    })
    scheduleNoiseBurst(ctx, destination, { startTime: now, duration: 0.05, peakGain: 0.18, attack: 0.001, release: 0.04 })
  },

  // A slow-swelling, slightly dipping open chord plus a soft noise bed — a
  // comic crowd "oooh" for whoever just lost the lead.
  upset: (ctx, destination) => {
    const now = ctx.currentTime
    const notes: readonly string[] = ['G3', 'C4', 'E4']
    for (const note of notes) {
      const freq = noteToFrequency(note)
      scheduleTone(ctx, destination, {
        waveform: 'triangle',
        startTime: now,
        duration: 0.5,
        frequency: freq,
        frequencyEnd: freq * 0.94,
        peakGain: 0.11,
        attack: 0.08,
        release: 0.3,
      })
    }
    scheduleNoiseBurst(ctx, destination, { startTime: now, duration: 0.45, peakGain: 0.07, attack: 0.1, release: 0.3 })
  },

  // A friendly two-note upward chime — the device passing to the next player.
  handoff: (ctx, destination) => {
    const now = ctx.currentTime
    scheduleTone(ctx, destination, {
      waveform: 'sine',
      startTime: now,
      duration: 0.14,
      frequency: noteToFrequency('E5'),
      peakGain: 0.18,
      attack: 0.006,
      release: 0.1,
    })
    scheduleTone(ctx, destination, {
      waveform: 'sine',
      startTime: now + 0.12,
      duration: 0.18,
      frequency: noteToFrequency('A5'),
      peakGain: 0.2,
      attack: 0.006,
      release: 0.13,
    })
  },
}

/**
 * Every `SfxName` the adapter can play, derived from `SFX_BUILDERS` itself
 * rather than hand-typed — `SFX_BUILDERS` is typed as `Record<SfxName,
 * SfxBuilder>`, so TypeScript already refuses to compile if a union member is
 * missing a builder. Exporting the keys this way means a table-driven test
 * can walk the full union without a second, hand-maintained list that could
 * drift out of sync.
 */
export const SFX_NAMES: readonly SfxName[] = Object.keys(SFX_BUILDERS) as SfxName[]

// ---------------------------------------------------------------------------
// The adapter itself
// ---------------------------------------------------------------------------

/** `AudioPort` backed by real Web Audio — fully procedural, no binary assets. */
export function createWebAudioAdapter(): AudioPort {
  let ctx: AudioContext | null = null
  let masterGain: GainNode | null = null
  let musicGain: GainNode | null = null
  let sfxGain: GainNode | null = null
  let currentSession: BgmSession | null = null
  let schedulerHandle: ReturnType<typeof setInterval> | null = null
  const sfxState: SfxState = { spinTicks: 0 }

  const persisted = readPersistedPrefs()
  let musicEnabled = persisted.music
  let sfxEnabled = persisted.sfx

  function tick(): void {
    if (!ctx || !currentSession) return
    scheduleSessionEvents(ctx, currentSession, ctx.currentTime + SCHEDULE_AHEAD_SECONDS)
  }

  function ensureSchedulerRunning(): void {
    if (schedulerHandle !== null) return
    schedulerHandle = setInterval(tick, LOOKAHEAD_INTERVAL_MS)
    // Never let this background timer keep a Node process (tests, SSR) alive.
    const unrefable = schedulerHandle as unknown as { unref?: () => void }
    unrefable.unref?.()
  }

  function createSession(trackName: BgmTrack, editionId?: string): BgmSession {
    const track = resolveTrack(trackName, editionId)
    const bus = ctx!.createGain()
    const startAt = ctx!.currentTime
    bus.gain.setValueAtTime(0, startAt)
    bus.connect(musicGain!)
    // A tiny lead-in so the very first scheduling window cleanly captures beat 0.
    const loopStartTime = startAt + 0.02
    return {
      trackName,
      editionId,
      track,
      secondsPerBeat: 60 / track.bpm,
      loopDurationSeconds: track.bars * track.beatsPerBar * (60 / track.bpm),
      loopStartTime,
      scheduledUntilTime: loopStartTime,
      busGain: bus,
    }
  }

  function fadeSessionTo(session: BgmSession, target: number): void {
    if (!ctx) return
    const now = ctx.currentTime
    session.busGain.gain.setValueAtTime(session.busGain.gain.value, now)
    session.busGain.gain.linearRampToValueAtTime(target, now + CROSSFADE_SECONDS)
  }

  function teardownSessionAfterFade(session: BgmSession): void {
    const handle = setTimeout(
      () => {
        session.busGain.disconnect()
      },
      CROSSFADE_SECONDS * 1000 + 30,
    )
    const unrefable = handle as unknown as { unref?: () => void }
    unrefable.unref?.()
  }

  async function unlock(): Promise<void> {
    if (!ctx) {
      const Ctor = getAudioContextConstructor()
      if (!Ctor) return
      try {
        ctx = new Ctor()
        masterGain = ctx.createGain()
        masterGain.gain.setValueAtTime(1, ctx.currentTime)
        masterGain.connect(ctx.destination)

        musicGain = ctx.createGain()
        musicGain.gain.setValueAtTime(musicEnabled ? 1 : 0, ctx.currentTime)
        musicGain.connect(masterGain)

        sfxGain = ctx.createGain()
        sfxGain.gain.setValueAtTime(sfxEnabled ? 1 : 0, ctx.currentTime)
        sfxGain.connect(masterGain)
      } catch {
        ctx = null
        masterGain = null
        musicGain = null
        sfxGain = null
        return
      }
    }
    try {
      await ctx.resume()
    } catch {
      // A context that is already running (or an environment quirk) may
      // reject here; playback still degrades safely either way.
    }
  }

  function playBgm(trackName: BgmTrack, editionId?: string): void {
    if (!ctx || !musicGain) return
    if (currentSession && currentSession.trackName === trackName && currentSession.editionId === editionId) return

    const outgoing = currentSession
    const incoming = createSession(trackName, editionId)
    currentSession = incoming

    if (outgoing) {
      fadeSessionTo(outgoing, 0)
      teardownSessionAfterFade(outgoing)
    }
    fadeSessionTo(incoming, 1)

    ensureSchedulerRunning()
    // Prime the very first window immediately rather than waiting for the
    // next 25ms tick, so playback starts without an audible gap.
    tick()
  }

  function stopBgm(): void {
    if (!ctx || !currentSession) return
    const outgoing = currentSession
    currentSession = null
    fadeSessionTo(outgoing, 0)
    teardownSessionAfterFade(outgoing)
  }

  function playSfx(name: SfxName): void {
    if (!ctx || !sfxGain) return
    try {
      SFX_BUILDERS[name](ctx, sfxGain, sfxState)
    } catch {
      // A synthesis edge case should never take gameplay down with it.
    }
  }

  function setMusicEnabled(enabled: boolean): void {
    musicEnabled = enabled
    writePersistedPrefs({ music: musicEnabled, sfx: sfxEnabled })
    if (ctx && musicGain) {
      const now = ctx.currentTime
      musicGain.gain.setValueAtTime(musicGain.gain.value, now)
      musicGain.gain.linearRampToValueAtTime(enabled ? 1 : 0, now + PREF_RAMP_SECONDS)
    }
  }

  function setSfxEnabled(enabled: boolean): void {
    sfxEnabled = enabled
    writePersistedPrefs({ music: musicEnabled, sfx: sfxEnabled })
    if (ctx && sfxGain) {
      const now = ctx.currentTime
      sfxGain.gain.setValueAtTime(sfxGain.gain.value, now)
      sfxGain.gain.linearRampToValueAtTime(enabled ? 1 : 0, now + PREF_RAMP_SECONDS)
    }
  }

  return {
    unlock,
    playBgm,
    stopBgm,
    playSfx,
    setMusicEnabled,
    setSfxEnabled,
    isMusicEnabled: () => musicEnabled,
    isSfxEnabled: () => sfxEnabled,
  }
}
