/**
 * FM-27 — simple rules engine with three checks:
 *  - Area ≤ 20 m²
 *  - Height ≤ 3.0 m
 *  - Nearest boundary distance ≥ 0.5 m
 */
import type { RuleInput, RuleResult } from './types';

const r1 = (n: number) => Math.round(n * 10) / 10;
const area = (i: RuleInput) => i.length * i.width;

function checkArea(i: RuleInput): string | null {
  const a = area(i);
  return a <= 20 ? null : `Area ${r1(a)} m² exceeds 20 m²`;
}
function checkHeight(i: RuleInput): string | null {
  return i.height <= 3 ? null : `Height ${r1(i.height)} m exceeds 3.0 m`;
}
function checkSetback(i: RuleInput): string | null {
  return i.setback >= 0.5
    ? null
    : `Nearest boundary distance ${r1(i.setback)} m is under 0.5 m`;
}

/**
 * Pure assessment function (no I/O, deterministic).
 * Returns LIKELY_EXEMPT only if all three checks pass.
 */
export function assess(input: RuleInput): RuleResult {
  const failures = [checkArea(input), checkHeight(input), checkSetback(input)]
    .filter((m): m is string => Boolean(m));

  if (failures.length === 0) {
    return {
      verdict: 'LIKELY_EXEMPT',
      reasons: [
        'Area (≤ 20 m²) satisfied',
        'Height (≤ 3.0 m) satisfied',
        'Nearest boundary distance (≥ 0.5 m) satisfied',
      ],
    };
  }
  return { verdict: 'NOT_EXEMPT', reasons: failures };
}

// (Optional) export internals for unit tests/debugging
export const _internal = { area, checkArea, checkHeight, checkSetback, r1 };
