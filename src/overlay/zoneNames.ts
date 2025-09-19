// Safe to extend anytime as more councils/zones are onboarded.

export const ZONE_CODE_TO_LABEL: Record<string, string> = {
  R1: 'General Residential',
  R2: 'Low Density Residential',
  R3: 'Medium Density Residential',
  R5: 'Large Lot Residential',

  // Business zones included in your Part 10 Division D scope
  B1: 'Neighbourhood Centre',
  B2: 'Local Centre',
  B4: 'Mixed Use',

  UNKNOWN: 'Unknown zone',
};

/** Returns a friendly name for a zone code, falling back to the code itself. */
export function getZoneFriendlyName(code?: string): string {
  const k = String(code ?? '').toUpperCase();
  return ZONE_CODE_TO_LABEL[k] ?? k || 'Unknown zone';
}
