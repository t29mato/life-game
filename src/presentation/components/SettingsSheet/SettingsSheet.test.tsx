import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { createFakeAudioPort } from '../../dev/fakeAudio'
import { AudioProvider } from '../../hooks/useAudio'
import { SettingsSheet } from './SettingsSheet'

function renderSheet(onClose = vi.fn()): { readonly onClose: ReturnType<typeof vi.fn> } {
  render(
    <AudioProvider audio={createFakeAudioPort()}>
      <SettingsSheet onClose={onClose} />
    </AudioProvider>,
  )
  return { onClose }
}

describe('SettingsSheet', () => {
  it('is a labelled dialog holding both audio switches', () => {
    renderSheet()

    const sheet = screen.getByRole('dialog', { name: /settings/i })
    expect(sheet).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /music/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sfx/i })).toBeInTheDocument()
  })

  it('closes on its own Close button', async () => {
    const user = userEvent.setup()
    const { onClose } = renderSheet()

    await user.click(screen.getByRole('button', { name: /close/i }))

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('closes on Escape — there is always a way out of a settings screen', () => {
    const { onClose } = renderSheet()

    fireEvent.keyDown(screen.getByRole('dialog', { name: /settings/i }), { key: 'Escape' })

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('closes when the backdrop behind it is pressed', async () => {
    const user = userEvent.setup()
    const { onClose } = renderSheet()

    await user.click(screen.getByRole('dialog', { name: /settings/i }).parentElement as Element)

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('keeps the keyboard inside itself while it is up', () => {
    renderSheet()

    expect(screen.getByRole('button', { name: /close/i })).toHaveFocus()
  })

  it('actually flips the port it is given', async () => {
    const user = userEvent.setup()
    const audio = createFakeAudioPort()
    render(
      <AudioProvider audio={audio}>
        <SettingsSheet onClose={() => {}} />
      </AudioProvider>,
    )

    await user.click(screen.getByRole('button', { name: /music/i }))

    expect(audio.isMusicEnabled()).toBe(false)
  })
})
