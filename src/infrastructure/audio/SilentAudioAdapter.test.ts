import { describe, expect, it } from 'vitest'
import { createSilentAudioAdapter } from './SilentAudioAdapter'

describe('createSilentAudioAdapter', () => {
  it('resolves unlock() without making any sound', async () => {
    const adapter = createSilentAudioAdapter()
    await expect(adapter.unlock()).resolves.toBeUndefined()
  })

  it('defaults both music and sfx to enabled', () => {
    const adapter = createSilentAudioAdapter()
    expect(adapter.isMusicEnabled()).toBe(true)
    expect(adapter.isSfxEnabled()).toBe(true)
  })

  it('records playBgm calls without throwing', () => {
    const adapter = createSilentAudioAdapter()
    expect(() => adapter.playBgm('title')).not.toThrow()
    expect(adapter.calls.playBgm).toEqual(['title'])
  })

  it('records stopBgm calls', () => {
    const adapter = createSilentAudioAdapter()
    adapter.playBgm('board')
    adapter.stopBgm()
    expect(adapter.calls.stopBgm).toBe(1)
  })

  it('records playSfx calls with the sfx name, in order', () => {
    const adapter = createSilentAudioAdapter()
    adapter.playSfx('spin')
    adapter.playSfx('coinGain')
    expect(adapter.calls.playSfx).toEqual(['spin', 'coinGain'])
  })

  it('toggles and reports music enabled state', () => {
    const adapter = createSilentAudioAdapter()
    adapter.setMusicEnabled(false)
    expect(adapter.isMusicEnabled()).toBe(false)
    adapter.setMusicEnabled(true)
    expect(adapter.isMusicEnabled()).toBe(true)
  })

  it('toggles and reports sfx enabled state', () => {
    const adapter = createSilentAudioAdapter()
    adapter.setSfxEnabled(false)
    expect(adapter.isSfxEnabled()).toBe(false)
    adapter.setSfxEnabled(true)
    expect(adapter.isSfxEnabled()).toBe(true)
  })

  it('keeps separate instances with independent call logs', () => {
    const a = createSilentAudioAdapter()
    const b = createSilentAudioAdapter()
    a.playSfx('select')
    expect(b.calls.playSfx).toEqual([])
  })

  it('records unlock call count', async () => {
    const adapter = createSilentAudioAdapter()
    await adapter.unlock()
    await adapter.unlock()
    expect(adapter.calls.unlock).toBe(2)
  })
})
