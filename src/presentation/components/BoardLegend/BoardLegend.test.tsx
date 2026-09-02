import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { AudioProvider } from '../../hooks/useAudio'
import { createFakeAudioPort } from '../../dev/fakeAudio'
import { BoardLegend, BoardLegendList } from './BoardLegend'
import { forgetBoardLegend, hasSeenBoardLegend, markBoardLegendSeen } from './seen'

describe('BoardLegend', () => {
  it('explains the red-and-white stripe, which had no legend anywhere in the game', () => {
    render(<BoardLegendList />)

    expect(screen.getByText(/red-and-white stripe/i)).toBeInTheDocument()
    expect(screen.getByText(/always happens/i)).toBeInTheDocument()
  })

  it('names the marks a player has to tell apart', () => {
    render(<BoardLegendList />)

    for (const mark of ['The coin', 'Arrow up', 'Arrow down', 'The bank', 'The chart', 'The star']) {
      expect(screen.getByText(mark)).toBeInTheDocument()
    }
  })

  it('keeps the bank and the market as two different things', () => {
    render(<BoardLegendList />)

    expect(screen.getByText(/never the market/i)).toBeInTheDocument()
  })

  it('is one press to dismiss', async () => {
    const user = userEvent.setup()
    const onDismiss = vi.fn()
    render(
      <AudioProvider audio={createFakeAudioPort()}>
        <BoardLegend onDismiss={onDismiss} />
      </AudioProvider>,
    )

    await user.click(screen.getByRole('button', { name: /got it/i }))

    expect(onDismiss).toHaveBeenCalledTimes(1)
  })
})

describe('remembering that it has been read', () => {
  it('starts unseen on a browser that has never played', () => {
    forgetBoardLegend()
    expect(hasSeenBoardLegend()).toBe(false)
  })

  it('stays seen once it has been read', () => {
    forgetBoardLegend()
    markBoardLegendSeen()
    expect(hasSeenBoardLegend()).toBe(true)
  })
})
