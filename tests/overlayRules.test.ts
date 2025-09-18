import { describe, it, expect } from 'vitest';
import { evaluateOverlays } from '../src/overlay/overlayRules';
import type { OverlaySnapshot } from '../src/overlay/types';

const base: OverlaySnapshot = { zone: 'R2', floodControlLot: false, bal: 'BAL-12.5' };

describe('Overlay rules', () => {
  it('passes for residential, not flood, low BAL', () => {
    const res = evaluateOverlays(base);
    expect(res.ok).toBe(true);
    expect(res.reasons).toEqual([]);
  });

  it('fails for non-residential zone', () => {
    const snap: OverlaySnapshot = { ...base, zone: 'IN1' };
    const res = evaluateOverlays(snap);
    expect(res.ok).toBe(false);
    expect(res.reasons.join(' ')).toMatch(/not residential/i);
  });

  it('fails for flood control lot', () => {
    const snap: OverlaySnapshot = { ...base, floodControlLot: true };
    const res = evaluateOverlays(snap);
    expect(res.ok).toBe(false);
    expect(res.reasons.join(' ')).toMatch(/flood control/i);
  });

  it('fails for BAL-40 and BAL-FZ', () => {
    for (const bal of ['BAL-40','BAL-FZ'] as const) {
      const snap: OverlaySnapshot = { ...base, bal };
      const res = evaluateOverlays(snap);
      expect(res.ok).toBe(false);
      expect(res.reasons.join(' ')).toMatch(/bushfire.*extreme/i);
    }
  });
});
