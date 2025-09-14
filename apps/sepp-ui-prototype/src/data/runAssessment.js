import * as mod from "../../../../src/engine/assess";

// Normalise engine output into { ok, result: { checks[] , verdict } }
export function runAssessment(property, proposal) {
  try {
    const assess = mod.assess || mod.default;
    if (typeof assess !== "function") {
      return { ok: false, message: "Rules engine not found (src/engine/assess)." };
    }

    // Map proposal into the engine's RuleInput shape
    const input = {
      length: Number(proposal.length_m) || 0,
      width: Number(proposal.width_m) || 0,
      height: Number(proposal.height_m) || 0,
      setback: Number(proposal.nearest_boundary_m) || 0,
    };

    const result = assess(input);

    let checks = [];

    // Preferred: engine reasons[] -> checks[]
    if (Array.isArray(result?.reasons)) {
      checks = result.reasons.map((r, i) => ({
        id: `rule_${i + 1}`,
        ok: /\bsatisfied\b/i.test(r),      // PASS if engine says "… satisfied"
        message: r,                        // show the engine's text verbatim
      }));
    }
    // Fallbacks (if your engine ever returns structured checks)
    else if (Array.isArray(result?.checks)) {
      checks = result.checks.map((c, i) => ({
        id: c.id || `rule_${i + 1}`,
        ok: !!(c.ok ?? c.pass ?? c.valid),
        message: c.message || c.title || "Check",
      }));
    } else if (Array.isArray(result)) {
      // Very defensive: array of strings/booleans/objects
      checks = result.map((c, i) =>
        typeof c === "string"
          ? { id: `rule_${i + 1}`, ok: /\bsatisfied\b/i.test(c), message: c }
          : typeof c === "boolean"
          ? { id: `rule_${i + 1}`, ok: c, message: c ? "Pass" : "Fail" }
          : {
              id: c.id || `rule_${i + 1}`,
              ok: !!(c.ok ?? c.pass ?? c.valid),
              message: c.message || c.title || "Check",
            }
      );
    }

    return { ok: true, result: { checks, verdict: result?.verdict } };
  } catch (e) {
    return { ok: false, message: e.message || String(e) };
  }
}
