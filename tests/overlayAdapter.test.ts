import { describe, it, expect } from 'vitest';
import { overlayFromRaw } from '../src/overlay/adapter';

describe('overlayFromRaw', () => {
  it('normalizes common provider keys', () => {
    const snap = overlayFromRaw({
      ZONE_CODE: 'r2',
      BUSHFIRE_BAL: '12.5',
      FLOOD_CATEGORY: 'flow path',
    });
    expect(snap.zone).toBe('R2');
    expect(snap.bal).toBe('BAL-12.5');
    expect(snap.floodCategory).toBe('FLOW_PATH');
    expect(snap.floodControlLot).toBe(true);
  });

  it('marks unknowns when inputs are missing', () => {
    const snap = overlayFromRaw({});
    expect(snap.zone).toBe('UNKNOWN');
    expect(snap.bal).toBe('UNKNOWN');
    expect(snap.floodCategory).toBe('UNKNOWN');
    expect(typeof snap.floodControlLot).toBe('boolean');
  });
});
