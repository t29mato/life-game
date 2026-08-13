import { render, screen, type RenderResult } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AudioProvider } from '../../hooks/useAudio'
import { createFakeAudioPort } from '../../dev/fakeAudio'
import { RELEASE_NOTES } from './releaseNotes'
import { ReleaseNotesScreen, type ReleaseNotesScreenProps } from './ReleaseNotesScreen'

function renderReleaseNotes(props: ReleaseNotesScreenProps): RenderResult {
  return render(
    <AudioProvider audio={createFakeAudioPort()}>
      <ReleaseNotesScreen {...props} />
    </AudioProvider>,
  )
}

describe('ReleaseNotesScreen', () => {
  it('shows the heading and every release, newest first', () => {
    renderReleaseNotes({ onClose: () => {} })
    expect(screen.getByRole('heading', { name: 'Release Notes' })).toBeInTheDocument()
    const versions = screen.getAllByText(/^Version /).map((el) => el.textContent)
    expect(versions).toEqual(RELEASE_NOTES.map((note) => `Version ${note.version}`))
  })

  it('shows the current build version, matching package.json via the injected constant', () => {
    renderReleaseNotes({ onClose: () => {} })
    expect(screen.getByText(`Version ${__APP_VERSION__}`)).toBeInTheDocument()
  })

  it('writes for a player, not a developer', () => {
    renderReleaseNotes({ onClose: () => {} })
    expect(screen.getByText(/play against the computer/i)).toBeInTheDocument()
    expect(screen.queryByText(/decideCpuCommand/i)).not.toBeInTheDocument()
  })

  it('groups changes into new, changed and fixed', () => {
    renderReleaseNotes({ onClose: () => {} })
    expect(screen.getByText("What's new")).toBeInTheDocument()
    expect(screen.getByText('Changed')).toBeInTheDocument()
    expect(screen.getByText('Fixed')).toBeInTheDocument()
  })

  it('calls onClose when the back button is clicked', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    renderReleaseNotes({ onClose })
    await user.click(screen.getByRole('button', { name: /back to title/i }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose on Escape, keyboard-only', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    renderReleaseNotes({ onClose })
    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('focuses the heading on mount so screen readers announce the page', () => {
    renderReleaseNotes({ onClose: () => {} })
    expect(screen.getByRole('heading', { name: 'Release Notes' })).toHaveFocus()
  })
})
