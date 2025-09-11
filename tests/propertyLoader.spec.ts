import { readFileSync } from "fs";
import path from "path";
import { describe, it, expect } from "vitest";
import { loadPropertiesFromJson } from "../src/lib/propertyLoader";

const samplesPath = path.join(__dirname, "..", "sample-data", "properties.json");
const data = JSON.parse(readFileSync(samplesPath, "utf8"));

describe("property loader", () => {
  it("returns a normalised array", () => {
    const arr = loadPropertiesFromJson(data);
    expect(Array.isArray(arr)).toBe(true);
    expect(arr[0]).toHaveProperty("id");
    expect(arr[0]).toHaveProperty("setbacks_m");
  });

  it("throws for bad shapes", () => {
    expect(() => loadPropertiesFromJson({} as any)).toThrow();
    expect(() => loadPropertiesFromJson({ properties: {} } as any)).toThrow();
  });
});
