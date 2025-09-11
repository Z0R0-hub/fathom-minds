// @ts-nocheck
/**
 * minimal loader for FM-36 (no external deps).
 * pass it the parsed JSON from sample-data/properties.json.
 * it returns a normalised array or throws if the shape is wrong.
 */
export function loadPropertiesFromJson(json) {
  if (!json || typeof json !== "object" || !Array.isArray(json.properties)) {
    throw new Error("Invalid format: expected { properties: [...] }");
  }

  return json.properties.map((p, i) => {
    // required keys present?
    for (const k of ["id","label","zone","lot_size_m2","frontage_m","corner_lot","setbacks_m"]) {
      if (!(k in p)) throw new Error(`Missing "${k}" in properties[${i}]`);
    }
    // basic type checks
    if (typeof p.id !== "string") throw new Error("id must be string");
    if (typeof p.label !== "string") throw new Error("label must be string");
    if (typeof p.zone !== "string") throw new Error("zone must be string");
    if (typeof p.lot_size_m2 !== "number") throw new Error("lot_size_m2 must be number");
    if (typeof p.frontage_m !== "number") throw new Error("frontage_m must be number");
    if (typeof p.corner_lot !== "boolean") throw new Error("corner_lot must be boolean");
    if (typeof p.setbacks_m !== "object" || p.setbacks_m === null) {
      throw new Error("setbacks_m must be object");
    }

    // return a clean, predictable shape
    return {
      id: p.id,
      label: p.label,
      zone: p.zone,
      lot_size_m2: p.lot_size_m2,
      frontage_m: p.frontage_m,
      corner_lot: p.corner_lot,
      setbacks_m: p.setbacks_m,   
      notes: p.notes ?? undefined,
    };
  });
}
