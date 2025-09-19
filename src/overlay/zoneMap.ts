// Label → code helpers (scoped to Albury DCP Part 10 evidence).
// Extend as other councils/parts are onboarded and evidenced.

export const ZONE_LABEL_TO_CODE: Record<string, string> = {
  'R1 GENERAL RESIDENTIAL': 'R1',
  // R2 and R5 exist but are referenced under Division C (not Division D)
  'R2 LOW DENSITY RESIDENTIAL': 'R2',
  'R3 MEDIUM DENSITY RESIDENTIAL': 'R3',
  'R5 LARGE LOT RESIDENTIAL': 'R5',

  // Business zones in Division D scope
  'B1 NEIGHBOURHOOD CENTRE': 'B1',
  'B2 LOCAL CENTRE': 'B2',
  'B4 MIXED USE': 'B4',

  // Note: R4 isn’t listed in the Part 10 Division D excerpt provided.
  // Add only when we have a primary source confirming applicability.
};
