import { describe, it, expect } from 'vitest';
import { evaluateOverlays } from '../src/overlay/overlayRules';
import type { OverlaySnapshot } from '../src/overlay/types';

const base: OverlaySnapshot = {
  zone: 'R2',
  bal: 'BAL-12.5',
  floodControlLot: false,
  floodCategory: 'NONE',
};

describe('Overlay rules', () => {
  it('passes for all permitted zones (R1, R2, R3, R5, B1, B2, B4)', () => {
    const allowed = ['R1', 'R2', 'R3', 'R5', 'B1', 'B2', 'B4'] as const;
    for (const z of allowed) {
      const res = evaluateOverlays({ ...base, zone: z });
      expect(res.ok).toBe(true);
      expect(res.reasons).toHaveLength(0);
    }
  });

  it('fails for a non-permitted zone with a helpful message', () => {
    const res = evaluateOverlays({ ...base, zone: 'IN1' });
    expect(res.ok).toBe(false);

    // Updated assertion: accept either phrasing variant
    const msg = res.reasons.join(' ');
    expect(
      msg.includes('not residential/permitted') ||
      msg.includes('outside the Part 10 residential context')
    ).toBe(true);
  });

  it('fails for flood control/hazard lots', () => {
    const res = evaluateOverlays({ ...base, floodControlLot: true });
    expect(res.ok).toBe(false);
    expect(res.reasons.join(' ')).toMatch(/flood control\/hazard/i);
  });

  it('fails for explicit flood categories other than NONE/UNKNOWN', () => {
    const res = evaluateOverlays({ ...base, floodCategory: 'FLOODWAY' });
    expect(res.ok).toBe(false);
    expect(res.reasons.join(' ')).toMatch(/Flood category/i);
  });

  it('fails for extreme BAL ratings (BAL-40, BAL-FZ)', () => {
    for (const bal of ['BAL-40', 'BAL-FZ'] as const) {
      const r = evaluateOverlays({ ...base, bal });
      expect(r.ok).toBe(false);
      expect(r.reasons.join(' ')).toMatch(/Bushfire category .* \(extreme\)/i);
    }
  });

  it('surfaces unknown zone/BAL as not ok with explanatory reasons', () => {
    const r1 = evaluateOverlays({ ...base, zone: 'UNKNOWN' });
    const r2 = evaluateOverlays({ ...base, bal: 'UNKNOWN' });
    expect(r1.ok).toBe(false);
    expect(r1.reasons.join(' ')).toMatch(/Zone is unknown/i);
    expect(r2.ok).toBe(false);
    expect(r2.reasons.join(' ')).toMatch(/BAL rating is unknown/i);
  });

  //ensure multiple failing gates stack reasons (order-agnostic)
  it('stacks reasons when multiple gates fail', () => {
    const r = evaluateOverlays({
      ...base,
      zone: 'IN1',
      floodControlLot: true,
      bal: 'BAL-40',
      floodCategory: 'FLOODWAY',
    });
    expect(r.ok).toBe(false);
    const msg = r.reasons.join(' ');
    expect(msg).toMatch(/not residential|outside the Part 10/i);
    expect(msg).toMatch(/flood control\/hazard/i);
    expect(msg).toMatch(/Flood category/i);
    expect(msg).toMatch(/Bushfire category .*extreme/i);
  });
});
