import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Player } from '@domain/model/types'
import { TurnBanner } from './TurnBanner'

function mockReducedMotion(matches: boolean): void {
  window.matchMedia = vi.fn().mockReturnValue({
    matches,
    media: '(prefers-reduced-motion: reduce)',
    addEventListener: () => {},
    removeEventListener: () => {},
  })
}

const player = {
  id: 'p1',
  name: 'Ada',
  color: 'red',
  money: 0,
  spaceId: 'start',
  isCpu: false,
} as unknown as Player

describe('TurnBanner', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('names the player and the turn', () => {
    mockReducedMotion(true)
    render(<TurnBanner player={player} turn={4} />)
    expect(screen.getByText('Ada’s turn')).toBeInTheDocument()
    expect(screen.getByText('Turn 4')).toBeInTheDocument()
  })

  /*
   * The point of the banner is that it is not the handoff card: it announces
   * and leaves, so there is nothing here to acknowledge and nothing that
   * traps focus.
   */
  it('offers nothing to press and is not a dialog', () => {
    mockReducedMotion(true)
    render(<TurnBanner player={player} turn={1} />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toBeInTheDocument()
  })
})
