import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { RollTableRow } from '@domain/model/types'
import { RollTable } from './RollTable'

const CAREER_ROWS: readonly RollTableRow[] = [
  {
    range: '1-3',
    career: 'Second Shooter',
    pay: '$26,250',
    period: 'payday',
    rung: '1 of 2',
    icon: 'career:radio-runner',
  },
  {
    range: '4-6',
    career: 'Salon Apprentice',
    pay: '$29,750',
    period: 'payday',
    rung: '1 of 3',
    icon: 'career:salon-apprentice',
  },
]

const MONEY_ROWS: readonly RollTableRow[] = [
  { range: '1-2', amount: '$90,000' },
  { range: '6', amount: 'Full ride' },
]

/** A die that pays per pip: one row per face, six of them. */
const PER_PIP_ROWS: readonly RollTableRow[] = [
  { range: '1', amount: '¥750,000' },
  { range: '2', amount: '¥1,500,000' },
  { range: '3', amount: '¥3,000,000' },
  { range: '4', amount: '¥3,750,000' },
  { range: '5', amount: '¥4,500,000' },
  { range: '6', amount: '¥5,250,000' },
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

  /*
   * The point of the split. The product owner asked for the pay and the rung
   * to be columns, not clauses inside a sentence — so each offer's three
   * facts land in three cells of their own row.
   */
  it("gives an offer's trade, pay and rung a cell each", () => {
    const { container } = render(<RollTable rows={CAREER_ROWS} />)
    const cells = [...container.querySelectorAll('tbody tr')].map((row) =>
      [...row.querySelectorAll('td')].map((cell) => cell.textContent),
    )
    expect(cells).toEqual([
      ['1-3', 'Second Shooter', '$26,250', '1 of 2'],
      ['4-6', 'Salon Apprentice', '$29,750', '1 of 3'],
    ])
  })

  it("heads the money column with the edition's own salary period", () => {
    render(<RollTable rows={CAREER_ROWS} />)
    expect(screen.getByRole('columnheader', { name: 'Per payday' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Career' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Rung' })).toBeInTheDocument()
  })

  it('reads a monthly edition by its own period instead', () => {
    render(<RollTable rows={CAREER_ROWS.map((row) => ({ ...row, period: 'month' }))} />)
    expect(screen.getByRole('columnheader', { name: 'Per month' })).toBeInTheDocument()
  })

  /*
   * A calling has nothing above it and a one-rung trade is its own ceiling.
   * Neither has a rung to print, and a column standing there full of dashes
   * would be a heading that never says anything.
   */
  it('builds no rung column when neither offer stands on a ladder', () => {
    render(
      <RollTable
        rows={[
          { range: '1-3', career: 'Line Cook', pay: '$28,000', period: 'payday', icon: 'career:line-cook' },
          { range: '4-6', career: 'Second Shooter', pay: '$26,250', period: 'payday', icon: 'career:radio-runner' },
        ]}
      />,
    )
    expect(screen.queryByRole('columnheader', { name: 'Rung' })).not.toBeInTheDocument()
    expect(screen.getByText('Line Cook')).toBeInTheDocument()
    expect(screen.getByText('$28,000')).toBeInTheDocument()
  })

  it('keeps the rung column when only one of the two offers has one', () => {
    render(
      <RollTable
        rows={[
          { range: '1-3', career: 'Line Cook', pay: '$28,000', period: 'payday', icon: 'career:line-cook' },
          {
            range: '4-6',
            career: 'Salon Apprentice',
            pay: '$29,750',
            period: 'payday',
            rung: '1 of 3',
            icon: 'career:salon-apprentice',
          },
        ]}
      />,
    )
    expect(screen.getByRole('columnheader', { name: 'Rung' })).toBeInTheDocument()
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  /* A money band keeps the two plain columns it always had — no empty
     career or rung cells bolted onto a die that never deals a job. */
  it('leaves a money table at two columns', () => {
    const { container } = render(<RollTable rows={MONEY_ROWS} />)
    expect(container.querySelectorAll('thead th')).toHaveLength(2)
    expect(screen.getByRole('columnheader', { name: 'Outcome' })).toBeInTheDocument()
    for (const row of container.querySelectorAll('tbody tr')) {
      expect(row.querySelectorAll('td')).toHaveLength(2)
    }
  })

  /*
   * Read out before the columns are, so somebody hearing "1 … ¥750,000"
   * knows they are listening to a die and not to a price list. Silent on
   * screen: the card above has just said it in words.
   */
  it('names itself to a screen reader without printing the name', () => {
    const { container } = render(<RollTable rows={MONEY_ROWS} />)
    const caption = container.querySelector('caption')
    expect(caption?.textContent).toBe('What each spin of the wheel is worth')
    expect(caption?.className).toBe('visually-hidden')
  })

  /*
   * A die that pays per pip publishes a row per face, and six rows at the
   * base sizing pushes the die itself off the bottom of a phone. Four bands
   * (a tuition bill) or two (a career fair) stay as they were.
   */
  it('sets a table longer than four money rows tighter', () => {
    const { container } = render(<RollTable rows={PER_PIP_ROWS} />)
    expect(container.querySelector('table')!.className).toContain('dense')
  })

  it('leaves a four-band table at its full sizing', () => {
    const { container } = render(<RollTable rows={PER_PIP_ROWS.slice(0, 4)} />)
    expect(container.querySelector('table')!.className).not.toContain('dense')
  })

  /* Tighter, not restructured — six faces are still six rows of two cells,
     because the widest sum a die deals runs to twelve characters and six of
     those side by side want a screen no phone has. */
  it('keeps all six faces as their own rows when it tightens', () => {
    const { container } = render(<RollTable rows={PER_PIP_ROWS} />)
    const cells = [...container.querySelectorAll('tbody tr')].map((row) =>
      [...row.querySelectorAll('td')].map((cell) => cell.textContent),
    )
    expect(cells).toEqual([
      ['1', '¥750,000'],
      ['2', '¥1,500,000'],
      ['3', '¥3,000,000'],
      ['4', '¥3,750,000'],
      ['5', '¥4,500,000'],
      ['6', '¥5,250,000'],
    ])
  })
})
