import type { OverlaySnapshot, Zone, BAL, FloodCategory } from './types';

type RawOverlays = Record<string, unknown>;

const ZONE_MAP: Record<string, Zone> = {
  R1:'R1', R2:'R2', R3:'R3', R4:'R4', R5:'R5',
  RU1:'RU1', RU2:'RU2', RU3:'RU3', RU4:'RU4', RU5:'RU5', RU6:'RU6',
  B1:'B1', B2:'B2', B3:'B3', B4:'B4',
  IN1:'IN1', IN2:'IN2', IN3:'IN3', IN4:'IN4',
  B5:'B5', B6:'B6', B7:'B7', B8:'B8',
  SP1:'SP1', SP2:'SP2', SP3:'SP3',
  RE1:'RE1', RE2:'RE2', C1:'C1', C2:'C2', C3:'C3', C4:'C4',
  W1:'W1', W2:'W2', W3:'W3',
};

function normZone(raw: unknown): Zone {
  const s = String(raw ?? '').trim().toUpperCase();
  return (ZONE_MAP[s] ?? 'UNKNOWN') as Zone;
}

function normBAL(raw: unknown): BAL {
  if (raw == null) return 'UNKNOWN';
  let s = String(raw).toUpperCase().replace(/\s+/g, '');
  if (/^(\d+(\.\d+)?)$/.test(s)) s = `BAL-${s}`;        // "12.5" -> "BAL-12.5"
  if (s === 'FZ' || s === 'BALFZ') s = 'BAL-FZ';
  if (!s.startsWith('BAL-') && s.startsWith('BAL')) s = s.replace(/^BAL/, 'BAL-');
  const allowed: BAL[] = ['BAL-LOW','BAL-12.5','BAL-19','BAL-29','BAL-40','BAL-FZ','UNKNOWN'];
  return (allowed.includes(s as BAL) ? (s as BAL) : 'UNKNOWN');
}

function normFloodCategory(raw: unknown): FloodCategory {
  const s = String(raw ?? '').toUpperCase().replace(/\s+/g, '_');
  const known: FloodCategory[] = [
    'NONE','FLOOD_CONTROL','FLOODWAY','FLOW_PATH','STORAGE','HIGH_HAZARD','HIGH_RISK','UNKNOWN',
  ];
  if (!s) return 'UNKNOWN';
  const alias: Record<string, FloodCategory> = {
    FLOODCONTROL: 'FLOOD_CONTROL',
    FLOOD_CONTROL_LOT: 'FLOOD_CONTROL',
    FLOODWAYAREA: 'FLOODWAY',
    FLOWPATH: 'FLOW_PATH',
    STORDED_AREA: 'STORAGE',
    HIGHHAZARD: 'HIGH_HAZARD',
    HIGHRISK: 'HIGH_RISK',
    NONE: 'NONE',
  };
  const v = alias[s] ?? (known.includes(s as FloodCategory) ? (s as FloodCategory) : 'UNKNOWN');
  return v;
}

function normFloodBool(raw: unknown, cat: FloodCategory): boolean {
  if (cat && cat !== 'NONE' && cat !== 'UNKNOWN') return true;
  if (typeof raw === 'boolean') return raw;
  const s = String(raw ?? '').toLowerCase();
  return /flood[_\- ]?control|flood[_\- ]?lot|yes|true|1/.test(s);
}

export function overlayFromRaw(raw: RawOverlays): OverlaySnapshot {
  const zoneRaw = raw.zone ?? raw.ZONE ?? raw.Zone ?? raw['ZONE_CODE'] ?? raw['LEP_ZONE'];
  const balRaw  = raw.bal  ?? raw.BAL  ?? raw.BAL_RATING ?? raw['BUSHFIRE_BAL'];
  const floodCatRaw =
    raw.floodCategory ?? raw.FLOOD_CATEGORY ?? raw.FloodCategory ??
    raw['FLOOD_TAG'] ?? raw['FLOOD_CLASS'] ?? raw['FLOOD_TYPE'];
  const floodBoolRaw = raw.flood ?? raw.FLOOD ?? raw.isFloodControlLot ?? raw['FLOOD_CONTROL'];

  const zone = normZone(zoneRaw);
  const bal = normBAL(balRaw);
  const floodCategory = normFloodCategory(floodCatRaw);
  const floodControlLot = normFloodBool(floodBoolRaw, floodCategory);

  return { zone, bal, floodControlLot, floodCategory };
}
