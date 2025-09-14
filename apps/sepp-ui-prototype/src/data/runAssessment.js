import * as mod from "../../../../src/engine/assess";

const r1 = (n) => Math.round(n * 10) / 10;

export function runAssessment(property, proposal) {
  try {
    const assess = mod.assess || mod.default;
    if (typeof assess !== "function") {
      return { ok: false, message: "Rules engine not found (src/engine/assess)." };
    }

    // Map UI fields to the engine fields
    const input = {
      length: Number(proposal.length_m ?? proposal.length ?? 0),
      width: Number(proposal.width_m ?? proposal.width ?? 0),
      height: Number(proposal.height_m ?? proposal.height ?? 0),
      setback: Number(proposal.nearest_boundary_m ?? proposal.setback ?? 0),
      // keep property around in case the engine uses it later
      property,
    };

    // Call engine
    const res = assess(input);

    // Compute pass/fail for each rule so the UI can show PASS/FAIL lines
    const passArea = input.length * input.width <= 20;
    const passHeight = input.height <= 3.0;
    const passSetback = input.setback >= 0.5;

    const checks = [
      {
        id: "area",
        message: "Area ≤ 20 m²",
        ok: passArea,
        detail: passArea ? undefined : `Area ${r1(input.length * input.width)} m² exceeds 20 m²`,
      },
      {
        id: "height",
        message: "Height ≤ 3.0 m",
        ok: passHeight,
        detail: passHeight ? undefined : `Height ${r1(input.height)} m exceeds 3.0 m`,
      },
      {
        id: "setback",
        message: "Nearest boundary ≥ 0.5 m",
        ok: passSetback,
        detail: passSetback ? undefined : `Nearest boundary distance ${r1(input.setback)} m is under 0.5 m`,
      },
    ];

    // Pass through verdict/reasons if you want to show them later
    return { ok: true, result: { checks, verdict: res?.verdict, reasons: res?.reasons } };
  } catch (e) {
    return { ok: false, message: e?.message || String(e) };
  }
}
