import { describe, it, expect } from 'vitest';
import { getZoneFriendlyName } from '../src/overlay/zoneNames';

describe('zoneNames helpers', () => {
  it('returns friendly labels for known codes', () => {
    expect(getZoneFriendlyName('R1')).toMatch(/General Residential/i);
    expect(getZoneFriendlyName('B2')).toMatch(/Local Centre/i);
  });

  it('falls back to code or "Unknown zone" for unknowns', () => {
    expect(getZoneFriendlyName('XYZ')).toBe('XYZ');
    expect(getZoneFriendlyName(undefined)).toBe('Unknown zone');
  });
});
