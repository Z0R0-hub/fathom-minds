const defaultDeps = {
  async loadAssessAll() {
    const engineMod = await import("../../../../src/engine/assessAll");
    const assessAll = engineMod.assessAll || engineMod.default;
    if (typeof assessAll !== "function") {
      throw new Error("Rules engine not found (src/engine/assessAll).");
    }
    return assessAll;
  },
  async loadOverlaySnapshotForSample(property) {
    try {
      const overlayMod = await import("../../../../src/overlay/adapter");
      const fn = overlayMod.getOverlaySnapshotForSample;
      if (typeof fn === "function") {
        return await fn(property);
      }
    } catch {
      // adapter is optional; we fall back below
    }
    return null;
  },
};

// Normalise engine output into { ok, result: { checks[] , verdict } }
export async function runAssessment(property, proposal, deps = defaultDeps) {
  try {
    const assessAll = await deps.loadAssessAll();

    // Map proposal into the engine's RuleInput shape
    const input = {
      type: proposal.kind ?? proposal.type ?? "shed",
      length: Number(proposal.length_m) || 0,
      width: Number(proposal.width_m) || 0,
      height: Number(proposal.height_m) || 0,
      setback: Number(proposal.nearest_boundary_m) || 0,
    };

    let overlay = await deps.loadOverlaySnapshotForSample(property);

    // Safe fallback so the prototype keeps working until the adapter/rules land
    if (!overlay) {
      overlay = {
        zone: property?.zone || "R2",
        floodControlLot: Boolean(property?.floodControlLot) || false,
        bal: property?.bal || "BAL-12.5",
        floodCategory: property?.floodCategory || "UNKNOWN",
      };
    }

    const engineOutput = await assessAll(input, overlay);
    const overlayDetails = engineOutput?.details?.overlays ?? null;
    const overlaySnapshot = overlayDetails?.snapshot ?? overlay ?? null;

    // -------- Normalise checks for the UI --------
    let checks = [];

    const structureChecks = engineOutput?.details?.structure?.checks ?? engineOutput?.checks;
    if (Array.isArray(structureChecks) && structureChecks.length) {
      checks = structureChecks.map((c, i) => ({
        id: c.id || `rule_${i + 1}`,
        ok: !!c.ok,
        message: c.message || c.title || "Check",
        clause: c.clause || null,
        citation: c.citation || null,
      }));
    } else if (Array.isArray(engineOutput?.reasons)) {
      checks = engineOutput.reasons.map((r, i) => ({
        id: `rule_${i + 1}`,
        ok: /\bsatisfied\b/i.test(r),
        message: r,
        clause: null,
        citation: null,
      }));
    } else if (Array.isArray(engineOutput)) {
      checks = engineOutput.map((c, i) =>
        typeof c === "string"
          ? { id: `rule_${i + 1}`, ok: /\bsatisfied\b/i.test(c), message: c, clause: null, citation: null }
          : typeof c === "boolean"
          ? { id: `rule_${i + 1}`, ok: c, message: c ? "Pass" : "Fail", clause: null, citation: null }
          : {
              id: c.id || `rule_${i + 1}`,
              ok: !!(c.ok ?? c.pass ?? c.valid),
              message: c.message || c.title || "Check",
              clause: c.clause || null,
              citation: c.citation || null,
            }
      );
    }

    if (overlayDetails && Array.isArray(overlayDetails.reasons) && overlayDetails.reasons.length) {
      overlayDetails.reasons.forEach((reason, idx) => {
        checks.push({
          id: `overlay_${idx + 1}`,
          ok: false,
          message: reason,
          clause: 'SEPP Exempt Development 2008 Part 2 general exclusions',
          citation: 'Overlay gating (zone, flood, bushfire)',
        });
      });
    }

    return {
      ok: true,
      result: {
        checks,
        verdict: engineOutput?.verdict,
        overlay: overlaySnapshot,
        overlays: overlayDetails ?? undefined,
      },
    };
  } catch (e) {
    return { ok: false, message: e?.message || String(e) };
  }
}

export const __test__ = { defaultDeps };
