import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DRIVER_FACES } from './designs'
import { FaceFeatures } from './FaceFeatures'

function renderFace(face: (typeof DRIVER_FACES)[number]): HTMLElement {
  const { container } = render(
    <svg>
      <FaceFeatures face={face} r={10} />
    </svg>,
  )
  return container
}

describe('FaceFeatures', () => {
  it('draws nothing for the classic face — the factory look is the absence of one', () => {
    expect(renderFace('classic').querySelector('[data-face]')).toBeNull()
  })

  it('draws visible geometry for every other face, tagged with its name', () => {
    for (const face of DRIVER_FACES) {
      if (face === 'classic') continue
      const group = renderFace(face).querySelector(`[data-face="${face}"]`)
      expect(group, face).not.toBeNull()
      expect(group!.children.length, face).toBeGreaterThan(0)
    }
  })

  it('scales with the head radius rather than being drawn at one fixed size', () => {
    const small = renderFace('surprised').querySelector('circle')!
    const { container } = render(
      <svg>
        <FaceFeatures face="surprised" r={20} />
      </svg>,
    )
    const large = container.querySelector('circle')!
    expect(Number(large.getAttribute('r'))).toBeCloseTo(Number(small.getAttribute('r')) * 2)
  })
})
