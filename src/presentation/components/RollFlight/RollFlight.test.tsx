import { render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { RollFlight } from './RollFlight'

function mockReducedMotion(matches: boolean): void {
  window.matchMedia = vi.fn().mockReturnValue({
    matches,
    media: '(prefers-reduced-motion: reduce)',
    addEventListener: () => {},
    removeEventListener: () => {},
  })
}

describe('RollFlight', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('carries the rolled number', () => {
    mockReducedMotion(false)
    const { container } = render(<RollFlight value={5} />)
    expect(container.textContent).toBe('5')
  })

  /*
   * There is nothing here but the motion: the number it carries is on the
   * die's own face and in the hop counter it flies towards, both still there
   * and both still readable. A still version would be a third copy of the
   * same digit and nothing else.
   */
  it('renders nothing at all under reduced motion', () => {
    mockReducedMotion(true)
    const { container } = render(<RollFlight value={5} />)
    expect(container).toBeEmptyDOMElement()
  })

  /*
   * The die's own live region already announces the number. A second one
   * would have a screen reader say it twice.
   */
  it('is hidden from assistive tech', () => {
    mockReducedMotion(false)
    const { container } = render(<RollFlight value={2} />)
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true')
  })
})
