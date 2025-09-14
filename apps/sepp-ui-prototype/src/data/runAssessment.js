import * as mod from "../../../../src/engine/assess";

// Normalise whatever the engine returns into { ok, checks[] } for the UI.
export function runAssessment(property, proposal) {
  try {
    const assess = mod.assess || mod.default;
    if (typeof assess !== "function") {
      return { ok: false, message: "Rules engine not found (src/engine/assess)." };
    }

    const result = assess({ property, proposal }); // may be sync or async

    const finish = (r) => {
      const checksRaw = r?.checks || r?.items || r?.rules || [];

      const checks = checksRaw.map((c, i) => {
        if (typeof c === "boolean") {
          return { id: `rule_${i + 1}`, ok: c, message: c ? "Pass" : "Fail" };
        }
        if (typeof c === "string") {
          return { id: `rule_${i + 1}`, ok: false, message: c };
        }
        return {
          id: c.id || c.code || `rule_${i + 1}`,
          ok: !!(c.ok ?? c.pass ?? c.valid),
          message: c.message || c.reason || c.title || "Rule",
        };
      });

      return { ok: r?.ok !== false, result: { checks } };
    };

    // Support both sync and async assess()
    if (result && typeof result.then === "function") {
      return result.then(finish).catch((e) => ({ ok: false, message: e.message || String(e) }));
    }
    return finish(result);
  } catch (e) {
    return { ok: false, message: e.message || String(e) };
  }
}
