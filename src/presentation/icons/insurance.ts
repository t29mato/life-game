import type { IconName } from '@domain/model/icons'
import type { InsuranceKind } from '@domain/model/types'

/**
 * How a policy is drawn and named, shared by every surface that lists one —
 * the sidebar's chips and the status modal's policy row — so `home` can never
 * mean one glyph in the rail and another in the modal.
 */
export const INSURANCE_ICON: Record<InsuranceKind, IconName> = {
  home: 'finance:policy-home',
  auto: 'finance:policy-auto',
  life: 'finance:policy-life',
}

export const INSURANCE_LABEL: Record<InsuranceKind, string> = {
  home: 'Home',
  auto: 'Auto',
  life: 'Life',
}
