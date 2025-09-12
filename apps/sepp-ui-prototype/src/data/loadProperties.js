// Fetch + validate wrapper for the UI
import { loadPropertiesFromJson } from "../../../src/lib/propertyLoader";

export async function loadProperties() {
  const res = await fetch("/sample-data/properties.json");
  if (!res.ok) {
    return { ok: false, message: `Cannot load properties.json (${res.status})` };
  }
  const json = await res.json();

  try {
    // throws if the shape is wrong
    loadPropertiesFromJson(json);
    return { ok: true, data: json };
  } catch (e) {
    return { ok: false, message: e.message };
  }
}
