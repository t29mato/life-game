import type { IconName } from '@domain/model/icons'
import type { InsuranceKind } from '@domain/model/types'
import { EN, type UiText } from '../i18n/en'

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

/**
 * What a policy is called, in the reader's language.
 *
 * `INSURANCE_LABEL` above stays as the English source — it is what the
 * catalogue's keys are named after, and what a caller with no locale falls
 * back to.
 */
export function insuranceLabel(kind: InsuranceKind, t: UiText = EN): string {
  return t.insurance[kind] ?? INSURANCE_LABEL[kind]
}
