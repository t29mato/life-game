import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { RollTableRow } from '@domain/model/types'
import { RollTable } from './RollTable'

const CAREER_ROWS: readonly RollTableRow[] = [
  {
    range: '1-3',
    amount: 'Second Shooter ($26,250/payday, rung 1 of 2)',
    icon: 'career:radio-runner',
  },
  {
    range: '4-6',
    amount: 'Salon Apprentice ($29,750/payday, rung 1 of 3)',
    icon: 'career:salon-apprentice',
  },
]

const MONEY_ROWS: readonly RollTableRow[] = [
  { range: '1-2', amount: '$90,000' },
  { range: '6', amount: 'Full ride' },
]

describe('RollTable', () => {
  it('renders a real table with the ranges and outcomes', () => {
    render(<RollTable rows={MONEY_ROWS} />)
    const table = screen.getByRole('table')
    expect(within(table).getByText('1-2')).toBeInTheDocument()
    expect(within(table).getByText('$90,000')).toBeInTheDocument()
    expect(within(table).getByText('Full ride')).toBeInTheDocument()
  })

  it('draws no art on a money band — an amount has no face to show', () => {
    const { container } = render(<RollTable rows={MONEY_ROWS} />)
    expect(container.querySelector('svg')).toBeNull()
  })

  /*
   * The product owner caught the alternative in play: a First Job Fair whose
   * two futures were two lines of prose, with nothing visual telling a
   * second shooter from a salon apprentice. A row that deals a job shows
   * the job.
   */
  it("draws each career row's own plaque art beside its name", () => {
    const { container } = render(<RollTable rows={CAREER_ROWS} />)
    const rows = container.querySelectorAll('tbody tr')
    expect(rows).toHaveLength(2)
    // One bespoke portrait per row — a full 64×64 scene, not a bare glyph.
    for (const row of rows) {
      const svg = row.querySelector('svg')
      expect(svg).not.toBeNull()
      expect(svg!.querySelector('rect[width="64"][height="64"]')).not.toBeNull()
    }
    // The two trades sit on different family plastics.
    expect(container.querySelector('[data-family="studio"]')).not.toBeNull()
    expect(container.querySelector('[data-family="care"]')).not.toBeNull()
  })

  it('sets an illustrated row as name over terms, both still readable as text', () => {
    render(<RollTable rows={CAREER_ROWS} />)
    expect(screen.getByText('Salon Apprentice')).toBeInTheDocument()
    expect(screen.getByText('$29,750/payday, rung 1 of 3')).toBeInTheDocument()
  })

  it('prints an illustrated row with no bracketed terms as its name alone', () => {
    render(<RollTable rows={[{ range: '1-6', amount: 'Line Cook', icon: 'career:line-cook' }]} />)
    expect(screen.getByText('Line Cook')).toBeInTheDocument()
  })
})
