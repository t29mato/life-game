import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ALL_ICON_NAMES } from '@domain/model/icons'
import { CareerPlaque } from './CareerPlaque'
import { CAREER_FAMILY, FAMILY_PALETTE, isCareerIcon } from './families'

const CAREER_ICONS = ALL_ICON_NAMES.filter(isCareerIcon)

describe('CareerPlaque', () => {
  it('renders the full bespoke portrait, not the list-size category glyph', () => {
    const { container } = render(<CareerPlaque icon="career:salon-apprentice" size={48} />)
    // The bespoke drawings all open on their scene's Backdrop — a full-bleed
    // 64×64 rounded rect — where a category glyph is a lone silhouette path.
    // Its presence is what says the plaque asked for the portrait even
    // though its own CSS box is below GameIcon's bespoke threshold.
    const svg = container.querySelector('svg')
    expect(svg).not.toBeNull()
    expect(svg!.getAttribute('viewBox')).toBe('0 0 64 64')
    expect(svg!.querySelector('rect[width="64"][height="64"]')).not.toBeNull()
  })

  it('is decoration by default, and labelled art when given a title', () => {
    const { container } = render(<CareerPlaque icon="career:surgeon" />)
    expect(container.querySelector('svg')!.getAttribute('aria-hidden')).toBe('true')

    render(<CareerPlaque icon="career:surgeon" title="Surgeon" />)
    expect(screen.getByRole('img', { name: 'Surgeon' })).toBeInTheDocument()
  })

  it('every trade in the icon union has a family, and every family a palette', () => {
    // The Record types already make a gap a compile error; this keeps the
    // guarantee visible at runtime too, against the union as actually shipped.
    expect(CAREER_ICONS.length).toBeGreaterThan(0)
    for (const icon of CAREER_ICONS) {
      const family = CAREER_FAMILY[icon]
      expect(family, icon).toBeDefined()
      expect(FAMILY_PALETTE[family].label.length).toBeGreaterThan(0)
    }
  })

  it('renders every trade without throwing', () => {
    for (const icon of CAREER_ICONS) {
      const { container, unmount } = render(<CareerPlaque icon={icon} />)
      expect(container.querySelector('svg'), icon).not.toBeNull()
      unmount()
    }
  })

  it('stamps the family on the plaque so a fair can be eyeballed in tests and dev tools', () => {
    const { container } = render(<CareerPlaque icon="career:line-cook" />)
    expect(container.querySelector('[data-family="kitchen"]')).not.toBeNull()
  })
})
