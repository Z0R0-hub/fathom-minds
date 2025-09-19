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

/**
 * Returns a friendly name for a zone code.
 * Falls back to "Unknown zone" when the input is empty or unrecognised.
 */
export function getZoneFriendlyName(code?: string): string {
  const k = String(code ?? '').trim().toUpperCase();
  if (!k) return 'Unknown zone';

  const label = ZONE_CODE_TO_LABEL[k];
  return label ? label : 'Unknown zone';
}
