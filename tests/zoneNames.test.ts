import { describe, it, expect } from 'vitest';
import { getZoneFriendlyName, ZONE_CODE_TO_LABEL } from '../src/overlay/zoneNames';

describe('zoneNames helpers', () => {
  it('returns friendly names for included residential zones', () => {
    expect(getZoneFriendlyName('R1')).toBe(ZONE_CODE_TO_LABEL.R1);
    expect(getZoneFriendlyName('R2')).toBe(ZONE_CODE_TO_LABEL.R2);
    expect(getZoneFriendlyName('R3')).toBe(ZONE_CODE_TO_LABEL.R3);
    expect(getZoneFriendlyName('R5')).toBe(ZONE_CODE_TO_LABEL.R5);
  });

  it('returns friendly names for included business zones (Division D scope)', () => {
    expect(getZoneFriendlyName('B1')).toBe(ZONE_CODE_TO_LABEL.B1);
    expect(getZoneFriendlyName('B2')).toBe(ZONE_CODE_TO_LABEL.B2);
    expect(getZoneFriendlyName('B4')).toBe(ZONE_CODE_TO_LABEL.B4);
  });

  it('is case/whitespace agnostic for the code input', () => {
    expect(getZoneFriendlyName(' r1 ')).toBe(ZONE_CODE_TO_LABEL.R1);
    expect(getZoneFriendlyName('b2')).toBe(ZONE_CODE_TO_LABEL.B2);
  });

  it('falls back to "Unknown zone" (and not the raw code) for unknowns', () => {
    expect(getZoneFriendlyName('X9')).toBe('Unknown zone');
    expect(getZoneFriendlyName('')).toBe('Unknown zone');
  });
});
