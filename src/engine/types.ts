/**
 * FM-27 — core types for the rules engine.
 */
export type StructureType = 'shed' | 'patio';

export interface RuleInput {
  type: StructureType;
  length: number;   // metres
  width: number;    // metres
  height: number;   // metres
  setback: number;  // metres to nearest boundary
}

export type Verdict = 'LIKELY_EXEMPT' | 'NOT_EXEMPT';

export interface RuleResult {
  verdict: Verdict;
  reasons: string[]; // satisfied statements (if exempt) or failure reasons
}
