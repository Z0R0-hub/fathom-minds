import { loadPropertiesFromJson } from "../../../../src/lib/propertyLoader";
import samples from "../../../../sample-data/properties.json";

export async function loadProperties() {
  try {
    // Normalize against the shared loader so the UI gets the same shape as the backend
    const properties = loadPropertiesFromJson(samples);
    return { ok: true, data: { properties } };
  } catch (e) {
    return { ok: false, message: e.message };
  }
}
