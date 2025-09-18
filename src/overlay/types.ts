export type Zone =
  | 'R1' | 'R2' | 'R3' | 'R4' | 'R5'
  | 'RU1' | 'RU2' | 'RU3' | 'RU4' | 'RU5' | 'RU6'
  | 'B1' | 'B2' | 'B3' | 'B4' | 'B5' | 'B6' | 'B7' | 'B8'
  | 'IN1' | 'IN2' | 'IN3' | 'IN4'
  | 'SP1' | 'SP2' | 'SP3'
  | 'RE1' | 'RE2'
  | 'C1' | 'C2' | 'C3' | 'C4'
  | 'W1' | 'W2' | 'W3'
  | 'UNKNOWN';

export type BAL =
  | 'BAL-LOW' | 'BAL-12.5' | 'BAL-19' | 'BAL-29' | 'BAL-40' | 'BAL-FZ'
  | 'UNKNOWN';

export type FloodCategory =
  | 'NONE'
  | 'FLOOD_CONTROL'
  | 'FLOODWAY'
  | 'FLOW_PATH'
  | 'STORAGE'
  | 'HIGH_HAZARD'
  | 'HIGH_RISK'
  | 'UNKNOWN';

export interface OverlaySnapshot {
  zone: Zone;
  floodControlLot: boolean;      // kept for backward compatibility
  bal: BAL;
  floodCategory?: FloodCategory; // optional richer signal
}

export interface OverlayFinding {
  ok: boolean;
  reasons: string[];
  snapshot: OverlaySnapshot;
}
