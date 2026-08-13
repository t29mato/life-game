import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { Player } from '@domain/model/types'
import { AudioProvider } from '../../hooks/useAudio'
import { createFakeAudioPort } from '../../dev/fakeAudio'
import { TurnHandoff } from './TurnHandoff'

function mockReducedMotion(matches: boolean): void {
  window.matchMedia = vi.fn().mockReturnValue({
    matches,
    media: '(prefers-reduced-motion: reduce)',
    addEventListener: () => {},
    removeEventListener: () => {},
  })
}

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: 'p1',
    name: 'Priya',
    color: 'green',
    spaceId: 'start',
    money: 10_000,
    loans: 0,
    career: null,
    hasDegree: false,
    isMarried: false,
    children: 0,
    house: null,
    lifeTiles: [],
    stocks: [],
    insurance: [],
    isCpu: false,
    isRetired: false,
    retirementRank: null,
    ...overrides,
  }
}

function renderHandoff(onReady = vi.fn()) {
  return render(
    <AudioProvider audio={createFakeAudioPort()}>
      <TurnHandoff player={makePlayer()} turn={4} rank={2} totalPlayers={3} onReady={onReady} />
    </AudioProvider>,
  )
}

describe('TurnHandoff', () => {
  it('announces whose turn it is and their current rank', () => {
    mockReducedMotion(true)
    renderHandoff()
    expect(screen.getByText('Priya')).toBeInTheDocument()
    expect(screen.getByText(/2nd place of 3/)).toBeInTheDocument()
    expect(screen.getByText('Turn 4')).toBeInTheDocument()
  })

  it('is a labelled dialog announced live', () => {
    mockReducedMotion(true)
    const { container } = render(
      <AudioProvider audio={createFakeAudioPort()}>
        <TurnHandoff player={makePlayer()} turn={1} rank={1} totalPlayers={2} onReady={() => {}} />
      </AudioProvider>,
    )
    expect(screen.getByRole('dialog', { name: 'Priya' })).toBeInTheDocument()
    expect(container.querySelector('[aria-live="polite"]')).not.toBeNull()
  })

  it('focuses the ready button on mount', () => {
    mockReducedMotion(true)
    renderHandoff()
    expect(screen.getByRole('button', { name: /ready/i })).toHaveFocus()
  })

  it('calls onReady when the ready button is clicked', async () => {
    mockReducedMotion(true)
    const user = userEvent.setup()
    const onReady = vi.fn()
    renderHandoff(onReady)
    await user.click(screen.getByRole('button', { name: /ready/i }))
    expect(onReady).toHaveBeenCalledTimes(1)
  })

  it('calls onReady when Enter is pressed on the focused ready button', async () => {
    mockReducedMotion(true)
    const user = userEvent.setup()
    const onReady = vi.fn()
    renderHandoff(onReady)
    await user.keyboard('{Enter}')
    expect(onReady).toHaveBeenCalledTimes(1)
  })

  it('traps focus within the panel', async () => {
    mockReducedMotion(true)
    const user = userEvent.setup()
    renderHandoff()
    const button = screen.getByRole('button', { name: /ready/i })
    expect(button).toHaveFocus()
    await user.tab()
    expect(button).toHaveFocus()
  })
})
