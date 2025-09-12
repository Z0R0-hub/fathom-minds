import { loadPropertiesFromJson } from "../../../../src/lib/propertyLoader";
import samples from "../../../../sample-data/properties.json";

export async function loadProperties() {
  try {
    // throws if the shape is wrong
    loadPropertiesFromJson(samples);
    return { ok: true, data: samples };
  } catch (e) {
    return { ok: false, message: e.message };
  }
}
