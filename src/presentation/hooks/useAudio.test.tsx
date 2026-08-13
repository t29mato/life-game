import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { createFakeAudioPort } from '../dev/fakeAudio'
import { AudioProvider, useAudio } from './useAudio'

function Probe(): React.ReactElement {
  const audio = useAudio()
  return <div>sfx enabled: {String(audio.isSfxEnabled())}</div>
}

describe('useAudio', () => {
  it('throws when used outside an AudioProvider', () => {
    // Suppress React's expected error-boundary console noise for this case.
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<Probe />)).toThrow(/AudioProvider/)
    spy.mockRestore()
  })

  it('returns the audio port supplied by the nearest AudioProvider', () => {
    const audio = createFakeAudioPort()
    render(
      <AudioProvider audio={audio}>
        <Probe />
      </AudioProvider>,
    )
    expect(screen.getByText('sfx enabled: true')).toBeInTheDocument()
  })
})
