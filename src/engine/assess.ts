/**
 * FM-27 — simple rules engine with three checks:
 *  - Area ≤ 20 m²
 *  - Height ≤ 3.0 m
 *  - Nearest boundary distance ≥ 0.5 m
 */
import type { RuleInput, RuleResult, RuleCheck } from './types';

const r1 = (n: number) => Math.round(n * 10) / 10;
const area = (i: RuleInput) => i.length * i.width;

/**
 * Pure assessment function (no I/O, deterministic).
 * Returns LIKELY_EXEMPT only if all three checks pass.
 */
export function assess(input: RuleInput): RuleResult {
  const checks: RuleCheck[] = [];

  const a = area(input);
  const areaOk = a <= 20;
  checks.push({
    id: 'structure-area',
    ok: areaOk,
    message: areaOk
      ? 'Area (≤ 20 m²) satisfied'
      : `Area ${r1(a)} m² exceeds 20 m²`,
    clause: 'SEPP Exempt Development 2008 cl. 2.18(1)(a)',
    citation: 'Subdivision 7 — Development ancillary to dwelling houses (Outbuildings)',
  });

  const heightOk = input.height <= 3;
  checks.push({
    id: 'structure-height',
    ok: heightOk,
    message: heightOk
      ? 'Height (≤ 3.0 m) satisfied'
      : `Height ${r1(input.height)} m exceeds 3.0 m`,
    clause: 'SEPP Exempt Development 2008 cl. 2.18(1)(c)',
    citation: 'Subdivision 7 — Development ancillary to dwelling houses (Outbuildings)',
  });

  const setbackOk = input.setback >= 0.5;
  checks.push({
    id: 'structure-setback',
    ok: setbackOk,
    message: setbackOk
      ? 'Nearest boundary distance (≥ 0.5 m) satisfied'
      : `Nearest boundary distance ${r1(input.setback)} m is under 0.5 m`,
    clause: 'SEPP Exempt Development 2008 cl. 2.18(1)(f)',
    citation: 'Subdivision 7 — Development ancillary to dwelling houses (Outbuildings)',
  });

  const failures = checks.filter((c) => !c.ok).map((c) => c.message);

  const verdict = failures.length === 0 ? 'LIKELY_EXEMPT' : 'NOT_EXEMPT';

  return {
    verdict,
    reasons: failures.length === 0
      ? checks.map((c) => c.message)
      : failures,
    checks,
  };
}

// (Optional) export internals for unit tests/debugging
export const _internal = { area, r1 };
