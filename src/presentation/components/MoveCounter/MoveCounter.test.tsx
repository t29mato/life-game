import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { MoveCounter } from './MoveCounter'

function mockReducedMotion(matches: boolean): void {
  window.matchMedia = vi.fn().mockReturnValue({
    matches,
    media: '(prefers-reduced-motion: reduce)',
    addEventListener: () => {},
    removeEventListener: () => {},
  })
}

describe('MoveCounter', () => {
  it('reads the spaces still to travel', () => {
    mockReducedMotion(false)
    render(<MoveCounter spacesLeft={4} />)
    expect(screen.getByText('4')).toBeInTheDocument()
  })

  it('says the count in words for a screen reader, which cannot see the tab', () => {
    mockReducedMotion(false)
    render(<MoveCounter spacesLeft={2} />)
    expect(screen.getByRole('status', { name: '2 spaces to go' })).toBeInTheDocument()
  })

  it('counts one space in the singular, because a screen reader reads it aloud', () => {
    mockReducedMotion(false)
    render(<MoveCounter spacesLeft={1} />)
    expect(screen.getByRole('status', { name: '1 space to go' })).toBeInTheDocument()
  })

  it('shows nought rather than disappearing once the car is parked', () => {
    mockReducedMotion(false)
    render(<MoveCounter spacesLeft={0} />)
    expect(screen.getByText('0')).toBeInTheDocument()
  })
})
