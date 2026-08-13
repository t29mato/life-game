import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { AudioProvider } from '../../hooks/useAudio'
import { createFakeAudioPort } from '../../dev/fakeAudio'
import { AudioToggle } from './AudioToggle'

describe('AudioToggle', () => {
  it('reflects the initial enabled state from the audio port', () => {
    const audio = createFakeAudioPort()
    render(
      <AudioProvider audio={audio}>
        <AudioToggle />
      </AudioProvider>,
    )
    expect(screen.getByRole('button', { name: /music on/i })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /sfx on/i })).toHaveAttribute('aria-pressed', 'true')
  })

  it('toggles music independently of sfx', async () => {
    const user = userEvent.setup()
    const audio = createFakeAudioPort()
    render(
      <AudioProvider audio={audio}>
        <AudioToggle />
      </AudioProvider>,
    )

    await user.click(screen.getByRole('button', { name: /music on/i }))

    expect(audio.isMusicEnabled()).toBe(false)
    expect(audio.isSfxEnabled()).toBe(true)
    expect(screen.getByRole('button', { name: /music off/i })).toHaveAttribute('aria-pressed', 'false')
  })

  it('toggles sfx independently of music', async () => {
    const user = userEvent.setup()
    const audio = createFakeAudioPort()
    render(
      <AudioProvider audio={audio}>
        <AudioToggle />
      </AudioProvider>,
    )

    await user.click(screen.getByRole('button', { name: /sfx on/i }))

    expect(audio.isSfxEnabled()).toBe(false)
    expect(audio.isMusicEnabled()).toBe(true)
  })
})
