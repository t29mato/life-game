import { render, screen, type RenderResult } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { GameRecord } from '@application/ports/StatsRepositoryPort'
import { AudioProvider } from '../../hooks/useAudio'
import { createFakeAudioPort } from '../../dev/fakeAudio'
import { RecordsScreen, type RecordsScreenProps } from './RecordsScreen'

function renderRecordsScreen(props: RecordsScreenProps): RenderResult {
  return render(
    <AudioProvider audio={createFakeAudioPort()}>
      <RecordsScreen {...props} />
    </AudioProvider>,
  )
}

function makeRecord(overrides: Partial<GameRecord>): GameRecord {
  return {
    playedAt: overrides.playedAt ?? '2026-08-01T12:00:00.000Z',
    editionId: overrides.editionId ?? 'usa',
    winnerName: overrides.winnerName ?? 'Alice',
    turns: overrides.turns ?? 24,
    standings: overrides.standings ?? [
      { name: 'Alice', color: 'blue', total: 240000, rank: 1, isCpu: false },
      { name: 'Bob', color: 'red', total: 180000, rank: 2, isCpu: true },
    ],
  }
}

describe('RecordsScreen', () => {
  it('shows a warm empty state when there are no records', () => {
    renderRecordsScreen({ records: [], onClose: () => {} })
    expect(screen.getByText('No games finished yet')).toBeInTheDocument()
    expect(screen.getByText(/hall of records will remember every finish/i)).toBeInTheDocument()
  })

  it('renders every finished game with its winner, turn count and standings', () => {
    const records = [
      makeRecord({ playedAt: '2026-08-05T12:00:00.000Z', winnerName: 'Alice', turns: 24 }),
      makeRecord({ playedAt: '2026-08-01T12:00:00.000Z', winnerName: 'Bob', turns: 30 }),
    ]
    renderRecordsScreen({ records, onClose: () => {} })

    expect(screen.getAllByText('Alice').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Bob').length).toBeGreaterThan(0)
    expect(screen.getByText('24 turns')).toBeInTheDocument()
    expect(screen.getByText('30 turns')).toBeInTheDocument()
    expect(screen.getAllByText('$240,000').length).toBeGreaterThan(0)
    expect(screen.getAllByText('CPU').length).toBeGreaterThan(0)
  })

  it('lists newest game first regardless of input order', () => {
    const records = [
      makeRecord({ playedAt: '2026-08-01T12:00:00.000Z', winnerName: 'Older' }),
      makeRecord({ playedAt: '2026-08-05T12:00:00.000Z', winnerName: 'Newer' }),
    ]
    renderRecordsScreen({ records, onClose: () => {} })
    const names = screen.getAllByText(/^(Older|Newer)$/).map((el) => el.textContent)
    expect(names[0]).toBe('Newer')
  })

  it('tallies wins per player across the history', () => {
    const records = [
      makeRecord({ winnerName: 'Alice', playedAt: '2026-08-01T12:00:00.000Z' }),
      makeRecord({ winnerName: 'Alice', playedAt: '2026-08-02T12:00:00.000Z' }),
      makeRecord({ winnerName: 'Bob', playedAt: '2026-08-03T12:00:00.000Z' }),
    ]
    renderRecordsScreen({ records, onClose: () => {} })
    expect(screen.getByText('2 wins')).toBeInTheDocument()
    expect(screen.getByText('1 win')).toBeInTheDocument()
  })

  it('quotes each game in the money it was won in, and names the country', () => {
    // A ¥64,000,000 finish and a $240,000 one are not the same league, and the
    // hall must not present them as one: each card carries its edition's tag
    // and formats its totals in that edition's currency.
    const records = [
      makeRecord({ playedAt: '2026-08-05T12:00:00.000Z' }),
      makeRecord({
        playedAt: '2026-08-01T12:00:00.000Z',
        editionId: 'japan',
        winnerName: 'Yuki',
        standings: [{ name: 'Yuki', color: 'green', total: 64_000_000, rank: 1, isCpu: false }],
      }),
    ]
    renderRecordsScreen({ records, onClose: () => {} })

    expect(screen.getByText('$240,000')).toBeInTheDocument()
    expect(screen.getByText('¥64,000,000')).toBeInTheDocument()
    expect(screen.getByText('USA')).toBeInTheDocument()
    expect(screen.getByText('Japan')).toBeInTheDocument()
  })

  it('calls onClose when the back button is clicked', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    renderRecordsScreen({ records: [makeRecord({})], onClose })
    await user.click(screen.getByRole('button', { name: /back to title/i }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
