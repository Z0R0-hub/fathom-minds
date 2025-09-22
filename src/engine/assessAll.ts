import type { RuleInput, RuleResult, RuleCheck } from './types';
import { assess } from './assess';
import type { OverlaySnapshot, OverlayFinding } from '../overlay/types';
import { evaluateOverlays } from '../overlay/overlayRules';

export type OverallVerdict = 'LIKELY_EXEMPT' | 'NOT_EXEMPT';

export interface CombinedResult {
  verdict: OverallVerdict;
  reasons: string[];
  checks: RuleCheck[];
  details: {
    structure: RuleResult;
    overlays: OverlayFinding;
  };
}

/**
 * Combine structure checks (Sprint 2) with overlay gates (Sprint 3).
 */
export function assessAll(input: RuleInput, overlay: OverlaySnapshot): CombinedResult {
  const structure = assess(input);
  const overlayFinding = evaluateOverlays(overlay);

  const ok = structure.verdict === 'LIKELY_EXEMPT' && overlayFinding.ok;

  const reasons = [
    ...structure.reasons,
    ...(overlayFinding.ok ? [] : overlayFinding.reasons),
  ];

  const checks: RuleCheck[] = [...structure.checks];

  if (overlayFinding.reasons.length === 0) {
    checks.push({
      id: 'overlay-scope',
      ok: true,
      message: 'Overlay checks satisfied',
      clause: 'SEPP Exempt Development 2008 Part 2—General restrictions',
      citation: 'Zone/BAL/Flood constraints',
    });
  } else {
    overlayFinding.reasons.forEach((reason, index) => {
      checks.push({
        id: `overlay-${index + 1}`,
        ok: false,
        message: reason,
        clause: 'SEPP Exempt Development 2008 Part 2—General restrictions',
        citation: 'Zone/BAL/Flood constraints',
      });
    });
  }

  return {
    verdict: ok ? 'LIKELY_EXEMPT' : 'NOT_EXEMPT',
    reasons,
    checks,
    details: { structure, overlays: overlayFinding },
  };
}
