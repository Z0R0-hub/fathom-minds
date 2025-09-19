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

  it('normalizes BAL variants and spacing', () => {
    expect(overlayFromRaw({ BAL_RATING: 'LOW' }).bal).toBe('BAL-LOW');
    expect(overlayFromRaw({ BAL_RATING: 'BALLOW' }).bal).toBe('BAL-LOW');
    expect(overlayFromRaw({ BAL_RATING: 'FZ' }).bal).toBe('BAL-FZ');
    expect(overlayFromRaw({ BAL_RATING: 'BALFZ' }).bal).toBe('BAL-FZ');
    expect(overlayFromRaw({ BUSHFIRE_BAL: 'BAL 12.5' }).bal).toBe('BAL-12.5');
  });

  it('derives floodControlLot from strings and booleans', () => {
    // positive cases
    expect(overlayFromRaw({ FLOOD_CONTROL: 'yes' }).floodControlLot).toBe(true);
    expect(overlayFromRaw({ FLOOD: true }).floodControlLot).toBe(true);
    // negative cases
    expect(overlayFromRaw({ FLOOD_CONTROL: 'no' }).floodControlLot).toBe(false);
    expect(overlayFromRaw({ FLOOD: false }).floodControlLot).toBe(false);
  });

  it('maps zone case/spacing and unknowns safely', () => {
    expect(overlayFromRaw({ zone: ' r3 ' }).zone).toBe('R3');
    expect(overlayFromRaw({ zone: 'X9' }).zone).toBe('UNKNOWN');
  });
});
