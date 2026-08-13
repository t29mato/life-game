import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { AudioProvider } from '../../hooks/useAudio'
import { createFakeAudioPort } from '../../dev/fakeAudio'
import { ChunkyButton } from './ChunkyButton'

function renderButton(
  props: Partial<React.ComponentProps<typeof ChunkyButton>> = {},
  audio = createFakeAudioPort(),
) {
  render(
    <AudioProvider audio={audio}>
      <ChunkyButton {...props}>Spin</ChunkyButton>
    </AudioProvider>,
  )
  return { audio }
}

describe('ChunkyButton', () => {
  it('renders its label', () => {
    renderButton()
    expect(screen.getByRole('button', { name: 'Spin' })).toBeInTheDocument()
  })

  it('renders an optional leading icon', () => {
    const { container } = render(
      <AudioProvider audio={createFakeAudioPort()}>
        <ChunkyButton icon="dice">Spin</ChunkyButton>
      </AudioProvider>,
    )
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('calls onClick and plays the confirm sfx when clicked', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    const { audio } = renderButton({ onClick })

    await user.click(screen.getByRole('button', { name: 'Spin' }))

    expect(onClick).toHaveBeenCalledTimes(1)
    expect(audio.sfxLog).toContain('confirm')
  })

  it('plays the select sfx on keyboard focus', () => {
    const { audio } = renderButton()
    fireEvent.focus(screen.getByRole('button', { name: 'Spin' }))
    expect(audio.sfxLog).toEqual(['select'])
  })

  it('does not play the select sfx when focus arrives via a pointer click', async () => {
    const user = userEvent.setup()
    const { audio } = renderButton()

    await user.click(screen.getByRole('button', { name: 'Spin' }))

    expect(audio.sfxLog).not.toContain('select')
    expect(audio.sfxLog).toEqual(['confirm'])
  })

  it('does not call onClick or play sfx when disabled', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    const { audio } = renderButton({ onClick, disabled: true })

    await user.click(screen.getByRole('button', { name: 'Spin' }))

    expect(onClick).not.toHaveBeenCalled()
    expect(audio.sfxLog).toEqual([])
  })

  it('is disabled in the accessibility tree when disabled', () => {
    renderButton({ disabled: true })
    expect(screen.getByRole('button', { name: 'Spin' })).toBeDisabled()
  })
})
