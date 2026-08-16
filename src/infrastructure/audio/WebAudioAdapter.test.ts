import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryStorage } from '../persistence/memoryStorage'
import { SFX_NAMES, createWebAudioAdapter } from './WebAudioAdapter'

// ---------------------------------------------------------------------------
// A hand-written fake Web Audio graph. jsdom does not implement AudioContext,
// so this stands in for it — every node records what was asked of it so
// tests can assert on scheduling and gain automation without real audio time
// ever needing to pass.
// ---------------------------------------------------------------------------

interface ParamCall {
  readonly method: string
  readonly value: number
  readonly time: number
}

class FakeAudioParam {
  value: number
  readonly calls: ParamCall[] = []

  constructor(initial: number) {
    this.value = initial
  }

  setValueAtTime(value: number, time: number) {
    this.value = value
    this.calls.push({ method: 'setValueAtTime', value, time })
    return this
  }

  linearRampToValueAtTime(value: number, time: number) {
    this.value = value
    this.calls.push({ method: 'linearRampToValueAtTime', value, time })
    return this
  }

  exponentialRampToValueAtTime(value: number, time: number) {
    this.value = value
    this.calls.push({ method: 'exponentialRampToValueAtTime', value, time })
    return this
  }

  setTargetAtTime(value: number, time: number) {
    this.value = value
    this.calls.push({ method: 'setTargetAtTime', value, time })
    return this
  }

  cancelScheduledValues() {
    return this
  }
}

class FakeAudioNode {
  readonly connections: FakeAudioNode[] = []
  disconnected = false

  connect(node: FakeAudioNode) {
    this.connections.push(node)
    return node
  }

  disconnect() {
    this.disconnected = true
  }
}

class FakeGainNode extends FakeAudioNode {
  gain = new FakeAudioParam(1)
}

class FakeOscillatorNode extends FakeAudioNode {
  type = 'sine'
  frequency = new FakeAudioParam(440)
  onended: (() => void) | null = null
  startCalls: number[] = []
  stopCalls: number[] = []

  start(time = 0) {
    this.startCalls.push(time)
  }

  stop(time = 0) {
    this.stopCalls.push(time)
    // Simulate the node reaching its scheduled end immediately — tests don't
    // wait on real audio-clock time to pass.
    this.onended?.()
  }
}

class FakeAudioBuffer {
  private readonly channels: Float32Array[]
  readonly sampleRate: number

  constructor(numberOfChannels: number, length: number, sampleRate: number) {
    this.sampleRate = sampleRate
    this.channels = Array.from({ length: numberOfChannels }, () => new Float32Array(length))
  }

  getChannelData(channel: number) {
    return this.channels[channel] as Float32Array
  }
}

class FakeBufferSourceNode extends FakeAudioNode {
  buffer: FakeAudioBuffer | null = null
  onended: (() => void) | null = null
  startCalls: number[] = []
  stopCalls: number[] = []

  start(time = 0) {
    this.startCalls.push(time)
  }

  stop(time = 0) {
    this.stopCalls.push(time)
    this.onended?.()
  }
}

class FakeAudioContext {
  /** Every instance registers itself here so tests can grab whichever one the adapter under test constructed. */
  static readonly instances: FakeAudioContext[] = []

  currentTime = 0
  destination = new FakeAudioNode()
  resumeCalls = 0
  state: 'suspended' | 'running' = 'suspended'
  readonly createdOscillators: FakeOscillatorNode[] = []
  readonly createdGains: FakeGainNode[] = []
  readonly createdBufferSources: FakeBufferSourceNode[] = []
  readonly createdBuffers: FakeAudioBuffer[] = []

  constructor() {
    FakeAudioContext.instances.push(this)
  }

  createOscillator() {
    const node = new FakeOscillatorNode()
    this.createdOscillators.push(node)
    return node
  }

  createGain() {
    const node = new FakeGainNode()
    this.createdGains.push(node)
    return node
  }

  createBufferSource() {
    const node = new FakeBufferSourceNode()
    this.createdBufferSources.push(node)
    return node
  }

  createBuffer(numberOfChannels: number, length: number, sampleRate: number) {
    const buffer = new FakeAudioBuffer(numberOfChannels, length, sampleRate)
    this.createdBuffers.push(buffer)
    return buffer
  }

  async resume() {
    this.resumeCalls += 1
    this.state = 'running'
  }
}

// ---------------------------------------------------------------------------

function installFakeAudioContext(): void {
  vi.stubGlobal('AudioContext', FakeAudioContext)
}

/** The most recently constructed fake context, or null if none has been built yet. */
function lastFakeCtx(): FakeAudioContext | null {
  const { instances } = FakeAudioContext
  return instances.length > 0 ? (instances[instances.length - 1] as FakeAudioContext) : null
}

describe('createWebAudioAdapter', () => {
  beforeEach(() => {
    FakeAudioContext.instances.length = 0
    vi.stubGlobal('localStorage', createMemoryStorage())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('constructs nothing before unlock() is called', () => {
    installFakeAudioContext()
    createWebAudioAdapter()
    expect(lastFakeCtx()).toBeNull()
  })

  it('lazily constructs the AudioContext and resumes it on unlock()', async () => {
    installFakeAudioContext()
    const adapter = createWebAudioAdapter()
    await adapter.unlock()
    expect(lastFakeCtx()).not.toBeNull()
    expect(lastFakeCtx()!.resumeCalls).toBeGreaterThanOrEqual(1)
  })

  it('resumes an already-constructed context on a second unlock() without rebuilding it', async () => {
    installFakeAudioContext()
    const adapter = createWebAudioAdapter()
    await adapter.unlock()
    const ctxAfterFirst = lastFakeCtx()
    await adapter.unlock()
    expect(lastFakeCtx()).toBe(ctxAfterFirst)
    expect(lastFakeCtx()!.resumeCalls).toBeGreaterThanOrEqual(2)
  })

  it('schedules oscillators as soon as a bgm track starts playing', async () => {
    installFakeAudioContext()
    const adapter = createWebAudioAdapter()
    await adapter.unlock()
    expect(lastFakeCtx()!.createdOscillators.length).toBe(0)
    adapter.playBgm('title')
    expect(lastFakeCtx()!.createdOscillators.length).toBeGreaterThan(0)
  })

  it('does not restart a track that is already playing', async () => {
    installFakeAudioContext()
    const adapter = createWebAudioAdapter()
    await adapter.unlock()
    adapter.playBgm('title')
    const gainCountAfterFirstStart = lastFakeCtx()!.createdGains.length
    adapter.playBgm('title')
    expect(lastFakeCtx()!.createdGains.length).toBe(gainCountAfterFirstStart)
  })

  it('does not restart "board" when the same edition asks for it again', async () => {
    installFakeAudioContext()
    const adapter = createWebAudioAdapter()
    await adapter.unlock()
    adapter.playBgm('board', 'japan')
    const gainCountAfterFirstStart = lastFakeCtx()!.createdGains.length
    adapter.playBgm('board', 'japan')
    expect(lastFakeCtx()!.createdGains.length).toBe(gainCountAfterFirstStart)
  })

  it('restarts "board" when the edition changes, even though the track name did not', async () => {
    installFakeAudioContext()
    const adapter = createWebAudioAdapter()
    await adapter.unlock()
    adapter.playBgm('board', 'japan')
    const gainCountAfterFirstStart = lastFakeCtx()!.createdGains.length
    adapter.playBgm('board', 'france')
    expect(lastFakeCtx()!.createdGains.length).toBeGreaterThan(gainCountAfterFirstStart)
  })

  it("schedules a different first bass note for an edition's own board track than the default", async () => {
    // JAPAN_BOARD_TRACK's bass opens on D2 (~73.4Hz); the default BOARD_TRACK
    // opens on G2 (~98.0Hz) — different enough that this is a real content
    // check, not just "some oscillator exists".
    installFakeAudioContext()
    const defaultAdapter = createWebAudioAdapter()
    await defaultAdapter.unlock()
    defaultAdapter.playBgm('board')
    const defaultFrequencies = lastFakeCtx()!.createdOscillators.map((osc) => osc.frequency.value)

    installFakeAudioContext()
    const japanAdapter = createWebAudioAdapter()
    await japanAdapter.unlock()
    japanAdapter.playBgm('board', 'japan')
    const japanFrequencies = lastFakeCtx()!.createdOscillators.map((osc) => osc.frequency.value)

    expect(japanFrequencies).not.toEqual(defaultFrequencies)
  })

  it('falls back to the default board track for an edition with no arrangement of its own', async () => {
    installFakeAudioContext()
    const usaAdapter = createWebAudioAdapter()
    await usaAdapter.unlock()
    usaAdapter.playBgm('board', 'usa')
    const usaFrequencies = lastFakeCtx()!.createdOscillators.map((osc) => osc.frequency.value)

    installFakeAudioContext()
    const defaultAdapter = createWebAudioAdapter()
    await defaultAdapter.unlock()
    defaultAdapter.playBgm('board')
    const defaultFrequencies = lastFakeCtx()!.createdOscillators.map((osc) => osc.frequency.value)

    expect(usaFrequencies).toEqual(defaultFrequencies)
  })

  it('ramps the outgoing track down to 0 when switching to a new track', async () => {
    installFakeAudioContext()
    const adapter = createWebAudioAdapter()
    await adapter.unlock()
    // Creation order inside unlock(): masterGain, musicGain, sfxGain.
    const musicGainNode = lastFakeCtx()!.createdGains[1]!

    adapter.playBgm('title')
    const titleBus = lastFakeCtx()!.createdGains.find((g) => g.connections.includes(musicGainNode))
    expect(titleBus).toBeDefined()

    adapter.playBgm('board')
    expect(
      titleBus!.gain.calls.some((call) => call.method === 'linearRampToValueAtTime' && call.value === 0),
    ).toBe(true)
  })

  it('fades the new track in from silence rather than starting at full volume', async () => {
    installFakeAudioContext()
    const adapter = createWebAudioAdapter()
    await adapter.unlock()
    const musicGainNode = lastFakeCtx()!.createdGains[1]!
    adapter.playBgm('title')
    const titleBus = lastFakeCtx()!.createdGains.find((g) => g.connections.includes(musicGainNode))!
    expect(titleBus.gain.calls[0]).toMatchObject({ method: 'setValueAtTime', value: 0 })
    expect(titleBus.gain.calls.some((call) => call.method === 'linearRampToValueAtTime' && call.value === 1)).toBe(
      true,
    )
  })

  it('fades out rather than hard-stopping on stopBgm()', async () => {
    installFakeAudioContext()
    const adapter = createWebAudioAdapter()
    await adapter.unlock()
    const musicGainNode = lastFakeCtx()!.createdGains[1]!
    adapter.playBgm('title')
    const titleBus = lastFakeCtx()!.createdGains.find((g) => g.connections.includes(musicGainNode))!
    adapter.stopBgm()
    expect(
      titleBus.gain.calls.some((call) => call.method === 'linearRampToValueAtTime' && call.value === 0),
    ).toBe(true)
  })

  it('creates audio nodes for playSfx and disconnects them once they finish', async () => {
    installFakeAudioContext()
    const adapter = createWebAudioAdapter()
    await adapter.unlock()
    const oscBefore = lastFakeCtx()!.createdOscillators.length
    const bufferBefore = lastFakeCtx()!.createdBufferSources.length

    adapter.playSfx('confirm')

    const newOscillators = lastFakeCtx()!.createdOscillators.slice(oscBefore)
    const newBufferSources = lastFakeCtx()!.createdBufferSources.slice(bufferBefore)
    expect(newOscillators.length + newBufferSources.length).toBeGreaterThan(0)
    for (const node of [...newOscillators, ...newBufferSources]) {
      expect(node.disconnected).toBe(true)
    }
  })

  // Table-driven over SFX_NAMES (derived from SFX_BUILDERS, which TypeScript
  // requires to cover every SfxName) so a future SFX added to the port can
  // never be forgotten here.
  it.each(SFX_NAMES)('plays "%s" without throwing and produces at least one sound node', async (name) => {
    installFakeAudioContext()
    const adapter = createWebAudioAdapter()
    await adapter.unlock()
    const before = lastFakeCtx()!.createdOscillators.length + lastFakeCtx()!.createdBufferSources.length
    expect(() => adapter.playSfx(name)).not.toThrow()
    const after = lastFakeCtx()!.createdOscillators.length + lastFakeCtx()!.createdBufferSources.length
    expect(after).toBeGreaterThan(before)
  })

  it('SFX_NAMES is non-empty and has no duplicates', () => {
    // A sanity check on the derivation itself: it.each above is only a real
    // guarantee if SFX_NAMES actually lists every distinct builder key.
    expect(SFX_NAMES.length).toBeGreaterThan(0)
    expect(new Set(SFX_NAMES).size).toBe(SFX_NAMES.length)
  })

  it('ramps music gain to 0 when music is disabled, and back to 1 when re-enabled', async () => {
    installFakeAudioContext()
    const adapter = createWebAudioAdapter()
    await adapter.unlock()
    const musicGainNode = lastFakeCtx()!.createdGains[1]!

    adapter.setMusicEnabled(false)
    expect(
      musicGainNode.gain.calls.some((call) => call.method === 'linearRampToValueAtTime' && call.value === 0),
    ).toBe(true)

    adapter.setMusicEnabled(true)
    expect(
      musicGainNode.gain.calls.some((call) => call.method === 'linearRampToValueAtTime' && call.value === 1),
    ).toBe(true)
  })

  it('ramps sfx gain to 0 when sfx is disabled', async () => {
    installFakeAudioContext()
    const adapter = createWebAudioAdapter()
    await adapter.unlock()
    const sfxGainNode = lastFakeCtx()!.createdGains[2]!

    adapter.setSfxEnabled(false)
    expect(
      sfxGainNode.gain.calls.some((call) => call.method === 'linearRampToValueAtTime' && call.value === 0),
    ).toBe(true)
  })

  it('defaults music and sfx to enabled with nothing persisted', () => {
    const adapter = createWebAudioAdapter()
    expect(adapter.isMusicEnabled()).toBe(true)
    expect(adapter.isSfxEnabled()).toBe(true)
  })

  it('persists music/sfx preferences to localStorage', () => {
    const adapter = createWebAudioAdapter()
    adapter.setMusicEnabled(false)
    adapter.setSfxEnabled(false)
    const raw = localStorage.getItem('life-journey:audio')
    expect(raw).not.toBeNull()
    expect(JSON.parse(raw as string)).toEqual({ music: false, sfx: false })
  })

  it('restores persisted preferences on creation', () => {
    const first = createWebAudioAdapter()
    first.setMusicEnabled(false)
    first.setSfxEnabled(true)

    const second = createWebAudioAdapter()
    expect(second.isMusicEnabled()).toBe(false)
    expect(second.isSfxEnabled()).toBe(true)
  })

  it('is a safe no-op end to end when AudioContext is unavailable', async () => {
    vi.stubGlobal('AudioContext', undefined)
    vi.stubGlobal('webkitAudioContext', undefined)
    const adapter = createWebAudioAdapter()

    await expect(adapter.unlock()).resolves.toBeUndefined()
    expect(() => adapter.playBgm('title')).not.toThrow()
    expect(() => adapter.playSfx('confirm')).not.toThrow()
    expect(() => adapter.stopBgm()).not.toThrow()
    expect(() => adapter.setMusicEnabled(false)).not.toThrow()
    expect(adapter.isMusicEnabled()).toBe(false)
    expect(() => adapter.setSfxEnabled(false)).not.toThrow()
    expect(adapter.isSfxEnabled()).toBe(false)
  })
})
