import type { OverlaySnapshot, OverlayFinding } from './types';

const RESIDENTIAL = new Set(['R1', 'R2', 'R3', 'R4', 'R5']);

export function evaluateOverlays(snapshot: OverlaySnapshot): OverlayFinding {
  const reasons: string[] = [];

  // Unknowns => surface why it can’t be approved automatically
  if (snapshot.zone === 'UNKNOWN') reasons.push('Zone is unknown (insufficient data).');
  if (snapshot.bal === 'UNKNOWN') reasons.push('BAL rating is unknown (insufficient data).');

  // Normal gating
  if (!RESIDENTIAL.has(snapshot.zone)) {
    reasons.push(`Zone ${snapshot.zone} is not residential (R1–R5).`);
  }
  if (snapshot.floodControlLot) {
    reasons.push('Lot intersects a flood control/hazard area.');
  }
  if (
    snapshot.floodCategory &&
    snapshot.floodCategory !== 'NONE' &&
    snapshot.floodCategory !== 'UNKNOWN'
  ) {
    reasons.push(`Flood category ${snapshot.floodCategory} present.`);
  }
  if (snapshot.bal === 'BAL-40' || snapshot.bal === 'BAL-FZ') {
    reasons.push(`Bushfire category ${snapshot.bal} (extreme).`);
  }

  return { ok: reasons.length === 0, reasons, snapshot };
}
