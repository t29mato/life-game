import { render, screen, within, type RenderResult } from '@testing-library/react'
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
    // Every release repeats these headings, so count rather than expect one:
    // the assertion is that the grouping exists, not that only one release does.
    expect(screen.getAllByText("What's new").length).toBe(
      RELEASE_NOTES.filter((note) => note.whatsNew.length > 0).length,
    )
    expect(screen.getAllByText('Changed').length).toBe(
      RELEASE_NOTES.filter((note) => note.changes.length > 0).length,
    )
    expect(screen.getAllByText('Fixed').length).toBe(
      RELEASE_NOTES.filter((note) => note.fixes.length > 0).length,
    )
  })

  it('leaves out a section a release has nothing to put in', () => {
    // The newest release fixed nothing this time, and an empty "Fixed"
    // heading reads as a page that failed to load rather than a release
    // that was entirely new features and rewrites.
    renderReleaseNotes({ onClose: () => {} })
    const current = screen.getByText(`Version ${__APP_VERSION__}`).closest('li')
    expect(current).not.toBeNull()
    expect(within(current!).queryByText('Fixed')).not.toBeInTheDocument()
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
