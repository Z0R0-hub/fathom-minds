import { describe, it, expect, vi, afterEach } from 'vitest';
import * as loader from '../../src/lib/propertyLoader';
import { loadProperties } from '../../apps/sepp-ui-prototype/src/data/loadProperties.js';

describe('loadProperties (frontend data layer)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns normalised properties when JSON is valid', async () => {
    const result = await loadProperties();
    expect(result.ok).toBe(true);
    expect(result.data?.properties).toBeDefined();
    expect(result.data?.properties?.length).toBeGreaterThan(0);
  });

  it('surfaces validation errors when loader throws', async () => {
    vi.spyOn(loader, 'loadPropertiesFromJson').mockImplementation(() => {
      throw new Error('bad data');
    });

    const result = await loadProperties();
    expect(result.ok).toBe(false);
    expect(result.message).toBe('bad data');
  });
});
