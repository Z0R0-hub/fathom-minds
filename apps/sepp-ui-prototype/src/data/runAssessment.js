import * as mod from "../../../../src/engine/assess";

// Call the FM-27 rules engine and normalise to { ok, result: { checks[] } }.
export function runAssessment(property, proposal) {
  try {
    const assess = mod.assess || mod.default;
    if (typeof assess !== "function") {
      return { ok: false, message: "Rules engine not found (src/engine/assess)." };
    }

    // Shape the proposal to what the engine expects.
    const input = {
      length: Number(proposal.length_m ?? proposal.length ?? 0),
      width: Number(proposal.width_m ?? proposal.width ?? 0),
      height: Number(proposal.height_m ?? proposal.height ?? 0),
      setback: Number(
        proposal.nearest_boundary_m ?? proposal.setback ?? proposal.setback_m ?? 0
      ),
    };

    // Engine likely returns either an array of failing messages
    // or an object with { issues } or { checks }.
    const raw = assess(input);

    const issues =
      Array.isArray(raw) ? raw :
      Array.isArray(raw?.issues) ? raw.issues :
      [];

    // Build PASS/FAIL checks for the three FM-27 rules.
    const checks = [
      {
        id: "area",
        ok: !issues.some((m) => /area/i.test(m)),
        message: issues.find((m) => /area/i.test(m)) || "Area ≤ 20 m²",
      },
      {
        id: "height",
        ok: !issues.some((m) => /height/i.test(m)),
        message: issues.find((m) => /height/i.test(m)) || "Height ≤ 3.0 m",
      },
      {
        id: "setback",
        ok: !issues.some((m) => /(boundary|setback)/i.test(m)),
        message:
          issues.find((m) => /(boundary|setback)/i.test(m)) ||
          "Nearest boundary ≥ 0.5 m",
      },
    ];

    return { ok: true, result: { checks } };
  } catch (e) {
    return { ok: false, message: e.message || String(e) };
  }
}
