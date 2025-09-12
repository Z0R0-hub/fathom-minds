import * as mod from "../../../../src/engine/assess";

// Normalise whatever the engine returns into { ok, checks[] } for the UI.
export function runAssessment(property, proposal) {
  try {
    const assess = mod.assess || mod.default;
    if (typeof assess !== "function") {
      return { ok: false, message: "Rules engine not found (src/engine/assess)." };
    }

    // Call the engine. Adjust arg shape if your engine expects different keys.
    const result = assess({ property, proposal });

    // Try a few common shapes -> normalise to checks[]
    const checks =
      result?.checks ||
      result?.items ||
      result?.rules ||
      [];

    // If engine returned booleans instead of objects, wrap them.
    const normalised = checks.map((c, i) =>
      typeof c === "boolean"
        ? { id: `rule_${i + 1}`, ok: c, message: c ? "Pass" : "Fail" }
        : {
            id: c.id || c.code || `rule_${i + 1}`,
            ok: !!(c.ok ?? c.pass ?? c.valid),
            message: c.message || c.reason || c.title || "Rule",
          }
    );

    return { ok: true, result: { checks: normalised } };
  } catch (e) {
    return { ok: false, message: e.message || String(e) };
  }
}
