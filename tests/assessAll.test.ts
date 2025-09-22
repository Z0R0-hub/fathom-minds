import { describe, it, expect } from 'vitest';
import { assessAll } from '../src/engine/assessAll';
import type { RuleInput } from '../src/engine/types';
import type { OverlaySnapshot } from '../src/overlay/types';

const goodStructure: RuleInput = {
  type: 'shed', length: 4, width: 5, height: 2.4, setback: 1.0
};

const goodOverlay: OverlaySnapshot = {
  zone: 'R2', floodControlLot: false, bal: 'BAL-12.5'
};

describe('assessAll', () => {
  it('LIKELY_EXEMPT when structure + overlays pass', () => {
    const res = assessAll(goodStructure, goodOverlay);
    expect(res.verdict).toBe('LIKELY_EXEMPT');
    expect(res.details.overlays.ok).toBe(true);
    expect(res.checks.filter((c) => !c.ok)).toHaveLength(0);
    expect(res.checks.some((c) => c.id === 'overlay-scope')).toBe(true);
  });

  it('NOT_EXEMPT when overlays fail even if structure passes', () => {
    const badOverlay: OverlaySnapshot = { ...goodOverlay, zone: 'IN1' };
    const res = assessAll(goodStructure, badOverlay);
    expect(res.verdict).toBe('NOT_EXEMPT');
    expect(res.reasons.join(' ')).toMatch(/not residential/i);
    expect(res.checks.some((c) => c.ok === false)).toBe(true);
  });
});
