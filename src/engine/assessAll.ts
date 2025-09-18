import type { RuleInput, RuleResult } from './types';
import { assess } from './assess';
import type { OverlaySnapshot, OverlayFinding } from '../overlay/types';
import { evaluateOverlays } from '../overlay/overlayRules';

export type OverallVerdict = 'LIKELY_EXEMPT' | 'NOT_EXEMPT';

export interface CombinedResult {
  verdict: OverallVerdict;
  reasons: string[];
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

  return {
    verdict: ok ? 'LIKELY_EXEMPT' : 'NOT_EXEMPT',
    reasons,
    details: { structure, overlays: overlayFinding },
  };
}
