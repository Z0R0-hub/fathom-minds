import { describe, it, expect } from 'vitest';
import { assess } from '../src/engine/assess';
import type { RuleInput } from '../src/engine/types';

describe('FM-27 rules engine', () => {
  it('LIKELY_EXEMPT when all checks pass (area, height, setback)', () => {
    const input: RuleInput = {
      type: 'shed',
      length: 3.2,
      width: 3.0,
      height: 2.4,
      setback: 0.5,
    };
    const res = assess(input);
    expect(res.verdict).toBe('LIKELY_EXEMPT');
    expect(res.reasons).toHaveLength(3);
  });

  it('boundary values pass: area=20, height=3.0, setback=0.5', () => {
    const input: RuleInput = {
      type: 'patio',
      length: 5,
      width: 4,
      height: 3.0,
      setback: 0.5,
    };
    const res = assess(input);
    expect(res.verdict).toBe('LIKELY_EXEMPT');
  });

  it('NOT_EXEMPT when setback < 0.5', () => {
    const input: RuleInput = {
      type: 'shed',
      length: 3.2,
      width: 3.0,
      height: 2.4,
      setback: 0.3,
    };
    const res = assess(input);
    expect(res.verdict).toBe('NOT_EXEMPT');
    expect(res.reasons.join(' ')).toMatch(/under 0\.5/);
  });

  it('NOT_EXEMPT when height > 3.0', () => {
    const input: RuleInput = {
      type: 'shed',
      length: 2.0,
      width: 2.0,
      height: 3.4,
      setback: 2.0,
    };
    const res = assess(input);
    expect(res.verdict).toBe('NOT_EXEMPT');
    expect(res.reasons.join(' ')).toMatch(/exceeds 3\.0/);
  });

  it('NOT_EXEMPT when area > 20', () => {
    const input: RuleInput = {
      type: 'patio',
      length: 5.2,
      width: 4.2, // 21.8 m²
      height: 2.4,
      setback: 1.0,
    };
    const res = assess(input);
    expect(res.verdict).toBe('NOT_EXEMPT');
    expect(res.reasons.join(' ')).toMatch(/exceeds 20/);
  });
});
