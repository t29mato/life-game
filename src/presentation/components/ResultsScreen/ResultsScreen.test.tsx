import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { GameResults, PlayerResult } from '@domain/model/types'
import type { GameRecord } from '@application/ports/StatsRepositoryPort'
import { AudioProvider } from '../../hooks/useAudio'
import { createFakeAudioPort } from '../../dev/fakeAudio'
import { ResultsScreen } from './ResultsScreen'

function mockReducedMotion(matches: boolean): void {
  window.matchMedia = vi.fn().mockReturnValue({
    matches,
    media: '(prefers-reduced-motion: reduce)',
    addEventListener: () => {},
    removeEventListener: () => {},
  })
}

function playerResult(overrides: Partial<PlayerResult>): PlayerResult {
  return {
    playerId: overrides.playerId ?? 'p1',
    name: overrides.name ?? 'Alice',
    color: overrides.color ?? 'blue',
    cash: overrides.cash ?? 50000,
    lifeTileValue: overrides.lifeTileValue ?? 10000,
    houseValue: overrides.houseValue ?? 100000,
    stockValue: overrides.stockValue ?? 5000,
    insurancePayout: overrides.insurancePayout ?? 0,
    childrenBonus: overrides.childrenBonus ?? 0,
    retirementBonus: overrides.retirementBonus ?? 80000,
    loanPenalty: overrides.loanPenalty ?? 0,
    total: overrides.total ?? 245000,
    rank: overrides.rank ?? 1,
  }
}

function makeResults(): GameResults {
  const standings = [
    playerResult({ playerId: 'p1', name: 'Alice', total: 245000, rank: 1 }),
    playerResult({ playerId: 'p2', name: 'Bob', color: 'red', total: 180000, rank: 2 }),
  ]
  return { standings, winnerId: 'p1' }
}

function renderResults(props: Partial<React.ComponentProps<typeof ResultsScreen>> = {}) {
  return render(
    <AudioProvider audio={createFakeAudioPort()}>
      <ResultsScreen results={makeResults()} records={[]} onPlayAgain={() => {}} {...props} />
    </AudioProvider>,
  )
}

describe('ResultsScreen', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders the Game Over heading', () => {
    mockReducedMotion(true)
    renderResults()
    expect(screen.getByText('Game Over')).toBeInTheDocument()
  })

  it('renders every standing row with the player name', () => {
    mockReducedMotion(true)
    renderResults()
    expect(screen.getAllByText('Alice').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Bob').length).toBeGreaterThan(0)
  })

  // Every scoring line gets its own label and figure, including the new
  // investing and insurance lines from this round's Wii-parity work. Each
  // figure counts up via `RollingNumber`, so the final digits land a beat
  // after mount even with reduced motion.
  it('renders every scoring line in the breakdown', async () => {
    mockReducedMotion(true)
    renderResults()
    for (const label of ['Cash', 'Life tiles', 'House', 'Shares', 'Insurance', 'Kids', 'Retirement', 'Loans']) {
      expect(screen.getAllByText(label).length).toBe(2)
    }
    const cashLabels = screen.getAllByText('Cash')
    await waitFor(() => expect(cashLabels[0]?.parentElement).toHaveTextContent('Cash$50,000'))
    const shareLabels = screen.getAllByText('Shares')
    await waitFor(() => expect(shareLabels[0]?.parentElement).toHaveTextContent('Shares$5,000'))
  })

  it('renders loan penalties as a negative figure', async () => {
    mockReducedMotion(true)
    const results: GameResults = {
      standings: [playerResult({ playerId: 'p1', name: 'Alice', loanPenalty: -22000, rank: 1 })],
      winnerId: 'p1',
    }
    renderResults({ results })
    const loanLabel = screen.getByText('Loans')
    await waitFor(() => expect(loanLabel.parentElement).toHaveTextContent('Loans-$22,000'))
  })

  it('eventually reveals the totals and plays the fanfare for the winner', async () => {
    mockReducedMotion(true)
    const audio = createFakeAudioPort()
    render(
      <AudioProvider audio={audio}>
        <ResultsScreen results={makeResults()} records={[]} onPlayAgain={() => {}} />
      </AudioProvider>,
    )

    await waitFor(() => expect(screen.getByText('$245,000')).toBeInTheDocument(), { timeout: 3000 })
    await waitFor(() => expect(audio.sfxLog).toContain('fanfare'), { timeout: 3000 })
  })

  it('calls onPlayAgain when the Play Again button is clicked', async () => {
    mockReducedMotion(true)
    const user = userEvent.setup()
    const onPlayAgain = vi.fn()
    renderResults({ onPlayAgain })
    await user.click(screen.getByRole('button', { name: /play again/i }))
    expect(onPlayAgain).toHaveBeenCalledTimes(1)
  })

  describe('standing against the hall of records', () => {
    it('says nothing when there is no history at all beyond this game', async () => {
      mockReducedMotion(true)
      renderResults({ records: [] })
      await waitFor(() => expect(screen.getByText('$245,000')).toBeInTheDocument())
      expect(screen.getByText('The first game in the hall of records.')).toBeInTheDocument()
    })

    it('calls out a new table high score', async () => {
      mockReducedMotion(true)
      // records[0] is this very game (appended automatically at gameOver); the
      // rest is what came before it.
      const records: GameRecord[] = [
        {
          playedAt: '2026-08-11T12:00:00.000Z',
          editionId: 'usa',
          winnerName: 'Alice',
          turns: 24,
          standings: [{ name: 'Alice', color: 'blue', total: 245000, rank: 1, isCpu: false }],
        },
        {
          playedAt: '2026-08-01T12:00:00.000Z',
          editionId: 'usa',
          winnerName: 'Bob',
          turns: 20,
          standings: [
            { name: 'Bob', color: 'red', total: 150000, rank: 1, isCpu: false },
            { name: 'Alice', color: 'blue', total: 120000, rank: 2, isCpu: false },
          ],
        },
      ]
      renderResults({ records })
      await waitFor(() => expect(screen.getByText('$245,000')).toBeInTheDocument())
      expect(screen.getByText(/new high score for the table/i)).toBeInTheDocument()
    })

    it('marks a personal best on a losing row too', async () => {
      mockReducedMotion(true)
      const records: GameRecord[] = [
        {
          playedAt: '2026-08-11T12:00:00.000Z',
          editionId: 'usa',
          winnerName: 'Alice',
          turns: 24,
          standings: [
            { name: 'Alice', color: 'blue', total: 245000, rank: 1, isCpu: false },
            { name: 'Bob', color: 'red', total: 180000, rank: 2, isCpu: false },
          ],
        },
        {
          playedAt: '2026-08-01T12:00:00.000Z',
          editionId: 'usa',
          winnerName: 'Alice',
          turns: 20,
          standings: [
            { name: 'Alice', color: 'blue', total: 200000, rank: 1, isCpu: false },
            { name: 'Bob', color: 'red', total: 90000, rank: 2, isCpu: false },
          ],
        },
      ]
      renderResults({ records })
      await waitFor(() => expect(screen.getAllByText('Personal best').length).toBeGreaterThan(0))
    })
  })
})
