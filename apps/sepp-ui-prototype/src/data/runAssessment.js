// Normalise engine output into { ok, result: { checks[] , verdict } }
export async function runAssessment(property, proposal) {
  try {
    // Load combined engine (structure + overlays)
    const engineMod = await import("../../../../src/engine/assessAll");
    const assessAll = engineMod.assessAll || engineMod.default;
    if (typeof assessAll !== "function") {
      return { ok: false, message: "Rules engine not found (src/engine/assessAll)." };
    }

    // Map proposal into the engine's RuleInput shape
    const input = {
      type: proposal.kind ?? proposal.type ?? "shed",
      length: Number(proposal.length_m) || 0,
      width: Number(proposal.width_m) || 0,
      height: Number(proposal.height_m) || 0,
      setback: Number(proposal.nearest_boundary_m) || 0,
    };

    // Try to build an overlay snapshot via adapter (if present)
    let overlay = null;
    try {
      const overlayMod = await import("../../../../src/overlay/adapter");
      const fn = overlayMod.getOverlaySnapshotForSample;
      if (typeof fn === "function") {
        overlay = await fn(property);
      }
    } catch {
      // adapter is optional; we fall back below
    }

    // Safe fallback so the prototype keeps working until the adapter/rules land
    if (!overlay) {
      overlay = {
        zone: property?.zone || "R2",
        floodControlLot: false,
        bal: "BAL-12.5",
      };
    }

    const result = await assessAll(input, overlay);

    // -------- Normalise checks for the UI --------
    let checks = [];

    // Preferred: engine reasons[] -> checks[]
    if (Array.isArray(result?.reasons)) {
      checks = result.reasons.map((r, i) => ({
        id: `rule_${i + 1}`,
        ok: /\bsatisfied\b/i.test(r), // PASS if engine says "… satisfied"
        message: r,                   // show the engine's text verbatim
      }));
    }
    // Fallback: structured checks
    else if (Array.isArray(result?.checks)) {
      checks = result.checks.map((c, i) => ({
        id: c.id || `rule_${i + 1}`,
        ok: !!(c.ok ?? c.pass ?? c.valid),
        message: c.message || c.title || "Check",
      }));
    }
    // Very defensive: array of strings/booleans/objects
    else if (Array.isArray(result)) {
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
    return { ok: false, message: e?.message || String(e) };
  }
}
