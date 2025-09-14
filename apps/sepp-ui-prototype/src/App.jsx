import { useEffect, useMemo, useState } from "react";
import { loadProperties } from "./data/loadProperties";
import { runAssessment } from "./data/runAssessment";
import "./App.css";

function Badge({ tone = "neutral", children }) {
  return <span className={`badge badge--${tone}`}>{children}</span>;
}
function Chip({ children }) {
  return <span className="chip">{children}</span>;
}

// ---------- helpers for export ----------
function download(filename, text, type = "text/plain") {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function toCSV(rows) {
  const headers = ["id", "label", "zone", "lot_size_m2", "frontage_m", "corner_lot"];
  const esc = (v) =>
    typeof v === "string" && (v.includes(",") || v.includes('"') || v.includes("\n"))
      ? `"${v.replace(/"/g, '""')}"`
      : v;
  const lines = [headers.join(",")].concat(
    rows.map((r) =>
      [
        r.id,
        r.label,
        r.zone,
        r.lot_size_m2 ?? "",
        r.frontage_m ?? "",
        String(!!r.corner_lot),
      ]
        .map(esc)
        .join(",")
    )
  );
  return lines.join("\n");
}

const LS_KEY = "sepp_props_additions";

export default function App() {
  // Data from loader
  const [properties, setProperties] = useState([]);
  const [selectedId, setSelectedId] = useState("");

  // Form inputs
  const [type, setType] = useState("shed");
  const [length, setLength] = useState(3);
  const [width, setWidth] = useState(3);
  const [height, setHeight] = useState(2.4);
  const [setback, setSetback] = useState(1.0);

  // Loader state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Rules engine assessment state
  const [assessment, setAssessment] = useState({ status: "idle" });

  // Modal state (add sample)
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({
    label: "",
    zone: "R1 General Residential",
    lot_size_m2: "",
    frontage_m: "",
    corner_lot: false,
  });
  const [dirtySinceExport, setDirtySinceExport] = useState(false);

  // Load + validate sample data at runtime
  useEffect(() => {
    (async () => {
      try {
        const res = await loadProperties();
        if (res.ok) {
          const list = res.data.properties || [];
          // Merge in local additions (persisted)
          let additions = [];
          try {
            additions = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
          } catch (_) {}
          const merged = [...list, ...additions];
          setProperties(merged);
          if (merged.length) setSelectedId(merged[0].id);
          setError(null);
        } else {
          setError(res); // { message, issues[] }
        }
      } catch (e) {
        setError({ message: e.message });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const selected = properties.find((p) => p.id === selectedId);
  const safeNum = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
  const area = safeNum(length) * safeNum(width);

  // Build a proposal object for the engine
  const proposal = useMemo(
    () => ({
      kind: type, // "shed" | "patio"
      length_m: safeNum(length),
      width_m: safeNum(width),
      height_m: safeNum(height),
      nearest_boundary_m: safeNum(setback),
      area_m2: area,
    }),
    [type, length, width, height, setback, area]
  );

  // Run rules engine whenever inputs or selected site change
  useEffect(() => {
    if (!selected) return;

    let cancelled = false;
    (async () => {
      try {
        setAssessment({ status: "running" });

        const maybePromise =
          runAssessment.length >= 2
            ? runAssessment(selected, proposal)
            : runAssessment({ property: selected, proposal });

        const out = await maybePromise;
        if (cancelled) return;

        if (out && out.ok) {
          const checks =
            out.checks ||
            out.issues ||
            out.result?.checks ||
            out.result?.issues ||
            [];

          const verdict =
            out.result?.verdict ||
            (Array.isArray(checks) && checks.every((c) => !!(c.ok ?? c.pass ?? c.valid))
              ? "LIKELY_EXEMPT"
              : "NOT_EXEMPT");

          setAssessment({ status: "done", checks, result: { verdict } });
        } else {
          setAssessment({
            status: "error",
            message: out?.message || "Unknown engine error",
          });
        }
      } catch (e) {
        if (!cancelled) {
          setAssessment({ status: "error", message: e.message || String(e) });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selected, proposal]);

  // ---- Add sample handlers ----
  function slugIdFromLabel(label) {
    const base =
      label
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") || "sample";
    const suffix = Math.random().toString(36).slice(2, 6);
    return `${base}-${suffix}`;
  }

  function handleAddSample(saveAndExport = null) {
    const label = addForm.label.trim();
    if (!label) {
      alert("Please enter a label.");
      return;
    }
    const newProp = {
      id: slugIdFromLabel(label),
      label,
      zone: addForm.zone.trim() || "R1 General Residential",
      lot_size_m2: Number(addForm.lot_size_m2) || 0,
      frontage_m: Number(addForm.frontage_m) || 0,
      corner_lot: !!addForm.corner_lot,

      // minimal extra fields that won’t break anything downstream
      setbacks_m: { front: 0, left: 0, right: 0, rear: 0 },
    };

    const next = [...properties, newProp];
    setProperties(next);
    setSelectedId(newProp.id);
    setShowAdd(false);
    setAddForm({
      label: "",
      zone: "R1 General Residential",
      lot_size_m2: "",
      frontage_m: "",
      corner_lot: false,
    });
    setDirtySinceExport(true);

    // persist additions in localStorage (add only the new one)
    let additions = [];
    try {
      additions = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
    } catch (_) {}
    additions.push(newProp);
    localStorage.setItem(LS_KEY, JSON.stringify(additions));

    if (saveAndExport === "json") {
      handleExportJSON(next);
    } else if (saveAndExport === "csv") {
      handleExportCSV(next);
    }
  }

  function handleExportJSON(list = properties) {
    // format matches public/data/properties.json
    const json = JSON.stringify({ properties: list }, null, 2);
    download("properties.json", json, "application/json");
    setDirtySinceExport(false);
  }
  function handleExportCSV(list = properties) {
    download("properties.csv", toCSV(list), "text/csv");
    setDirtySinceExport(false);
  }

  // --------- States: loading / error ----------
  if (loading) {
    return (
      <main className="container">
        <header className="app-header">
          <h1 className="title">SEPP Sheds &amp; Patios</h1>
          <div className="badges">
            <Badge tone="neutral">Sprint 2</Badge>
            <Badge tone="neutral">Loading…</Badge>
          </div>
        </header>
        <div className="card"><p>Loading sample data…</p></div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="container">
        <header className="app-header">
          <h1 className="title">SEPP Sheds &amp; Patios</h1>
          <div className="badges">
            <Badge tone="neutral">Sprint 2</Badge>
            <Badge tone="red">Data: invalid</Badge>
          </div>
        </header>

        <div className="card card--error">
          <h3>Data validation failed</h3>
          <p>{error.message || "Invalid data."}</p>
          {error.issues && (
            <ul className="issues">
              {error.issues.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          )}
          <p className="muted">Fix <code>public/data/properties.json</code> to continue.</p>
        </div>
      </main>
    );
  }

  // --------- Normal UI ----------
  return (
    <main className="container">
      <header className="app-header">
        <h1 className="title">SEPP Sheds &amp; Patios</h1>
        <div className="badges">
          <Badge tone="neutral">Sprint 2</Badge>
          <Badge tone="green">Data: validated</Badge>
        </div>
      </header>

      <div className="grid-2">
        {/* LEFT COLUMN */}
        <div className="col">
          {/* Property card */}
          <section className="card">
            <div className="card-header">
              <h3>Site / Sample property</h3>
            </div>

            <label className="field">
              <span className="label" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                Choose sample
                <button
                  type="button"
                  aria-label="Add sample"
                  onClick={() => setShowAdd(true)}
                  title="Add sample"
                  style={{
                    border: "1px solid #e5e7eb",
                    background: "white",
                    padding: "2px 8px",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontWeight: 600,
                    lineHeight: 1.1,
                  }}
                >
                  +
                </button>
              </span>

              <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="select"
              >
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>

            {dirtySinceExport && (
              <div className="muted" style={{ marginTop: 8 }}>
                Added samples not yet exported.{" "}
                <button className="link" onClick={() => handleExportJSON()}>
                  Download JSON
                </button>{" "}
                ·{" "}
                <button className="link" onClick={() => handleExportCSV()}>
                  Download CSV
                </button>
              </div>
            )}

            {selected && (
              <div className="chips">
                <Chip>{selected.zone}</Chip>
                <Chip>{`${(selected.lot_size_m2 ?? 0).toLocaleString()} m²`}</Chip>
                <Chip>{`Frontage ${selected.frontage_m ?? 0} m`}</Chip>
                {selected.corner_lot && <Chip>Corner lot</Chip>}
              </div>
            )}

            <p className="muted">All distances in metres (m).</p>
          </section>

          {/* Proposed structure card */}
          <section className="card">
            <div className="card-header">
              <h3>Proposed structure</h3>
            </div>

            <div className="segmented">
              <button
                type="button"
                className={type === "shed" ? "segbtn active" : "segbtn"}
                onClick={() => setType("shed")}
              >
                Shed
              </button>
              <button
                type="button"
                className={type === "patio" ? "segbtn active" : "segbtn"}
                onClick={() => setType("patio")}
              >
                Patio / Verandah
              </button>
            </div>

            <div className="form-grid">
              <label className="field">
                <span className="label">Length</span>
                <input
                  type="number"
                  step="0.1"
                  value={length}
                  onChange={(e) => setLength(e.target.value)}
                  className="input"
                />
                <span className="unit">m</span>
              </label>

              <label className="field">
                <span className="label">Width</span>
                <input
                  type="number"
                  step="0.1"
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                  className="input"
                />
                <span className="unit">m</span>
              </label>

              <label className="field">
                <span className="label">Height</span>
                <input
                  type="number"
                  step="0.1"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="input"
                />
                <span className="unit">m</span>
              </label>

              <label className="field">
                <span className="label">Nearest boundary</span>
                <input
                  type="number"
                  step="0.1"
                  value={setback}
                  onChange={(e) => setSetback(e.target.value)}
                  className="input"
                />
                <span className="unit">m</span>
              </label>
            </div>

            <p className="muted">
              Area = <strong>{area.toFixed(2)} m²</strong> &nbsp;|&nbsp; Height ={" "}
              <strong>{height}</strong> m &nbsp;|&nbsp; Setback = <strong>{setback}</strong> m
            </p>
          </section>
        </div>

        {/* RIGHT COLUMN */}
        <div className="col">
          {/* Data validation status */}
          <section className="card">
            <div className="card-header">
              <h3>Data validation</h3>
            </div>
            <div className="ok-line">
              <span className="bigcheck" aria-hidden>✓</span>
              <div>
                <div className="ok-head">All sample data valid</div>
                <div className="muted">
                  Validated on load with JSON Schema (Draft-07) + AJV.
                </div>
              </div>
            </div>
            <hr className="rule" />
            <p className="muted">Prototype rules engine runs live below.</p>
          </section>

          {/* Rules assessment */}
          <section className="card">
            <div className="card-header">
              <h3>SEPP/LEP checks</h3>
            </div>

            {assessment.status === "running" && <p className="muted">Running checks…</p>}

            {assessment.status === "error" && (
              <div className="card card--error" style={{ margin: 0 }}>
                <p><strong>Couldn’t run rules:</strong> {assessment.message}</p>
                <p className="muted">Ensure the engine exports an assess function and the wrapper returns {"{ ok, issues }"}.</p>
              </div>
            )}

            {assessment.status === "done" && (
              <>
                {/* Verdict badge */}
                <p style={{ margin: "6px 0 12px" }}>
                  <strong>Verdict:</strong>{" "}
                  <span style={{
                    padding: "2px 8px",
                    borderRadius: 999,
                    background:
                      (assessment.result?.verdict || "NOT_EXEMPT") === "LIKELY_EXEMPT"
                        ? "#DCFCE7"
                        : "#FEE2E2",
                    color:
                      (assessment.result?.verdict || "NOT_EXEMPT") === "LIKELY_EXEMPT"
                        ? "#166534"
                        : "#991B1B"
                  }}>
                    {assessment.result?.verdict ||
                      (Array.isArray(assessment.checks) && assessment.checks.every((c) => c.ok)
                        ? "LIKELY_EXEMPT"
                        : "NOT_EXEMPT")}
                  </span>
                </p>

                {/* Checks list */}
                {Array.isArray(assessment.checks) && assessment.checks.length ? (
                  <ul className="issues" style={{ marginTop: 8 }}>
                    {assessment.checks.map((c, i) => (
                      <li key={c.id || i}>
                        <strong>{c.ok ? "PASS" : "FAIL"}:</strong>{" "}
                        {c.message || c.code || "See details"}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="muted">No issues reported by the engine.</p>
                )}
              </>
            )}
          </section>

          {/* Raw JSON details */}
          {selected && (
            <section className="card">
              <details>
                <summary className="summary">Raw sample (JSON)</summary>
                <pre className="pre">{JSON.stringify(selected, null, 2)}</pre>
              </details>
            </section>
          )}
        </div>
      </div>

      {/* ---- Add Sample Modal ---- */}
      {showAdd && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            display: "grid",
            placeItems: "center",
            zIndex: 50
          }}
          onClick={() => setShowAdd(false)}
        >
          <div
            className="card"
            style={{ width: 520, maxWidth: "90vw" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="card-header" style={{ display: "flex", justifyContent: "space-between" }}>
              <h3>Add sample</h3>
              <button
                onClick={() => setShowAdd(false)}
                style={{ border: "none", background: "transparent", fontSize: 18, cursor: "pointer" }}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="form-grid">
              <label className="field">
                <span className="label">Label *</span>
                <input
                  className="input"
                  value={addForm.label}
                  onChange={(e) => setAddForm({ ...addForm, label: e.target.value })}
                  placeholder="e.g. Urban small lot — Lavington"
                />
              </label>

              <label className="field">
                <span className="label">Zone</span>
                <input
                  className="input"
                  value={addForm.zone}
                  onChange={(e) => setAddForm({ ...addForm, zone: e.target.value })}
                  placeholder="R1 General Residential"
                />
              </label>

              <label className="field">
                <span className="label">Lot size (m²)</span>
                <input
                  type="number"
                  step="1"
                  className="input"
                  value={addForm.lot_size_m2}
                  onChange={(e) => setAddForm({ ...addForm, lot_size_m2: e.target.value })}
                />
              </label>

              <label className="field">
                <span className="label">Frontage (m)</span>
                <input
                  type="number"
                  step="0.1"
                  className="input"
                  value={addForm.frontage_m}
                  onChange={(e) => setAddForm({ ...addForm, frontage_m: e.target.value })}
                />
              </label>

              <label className="field" style={{ gridColumn: "1 / -1" }}>
                <input
                  type="checkbox"
                  checked={addForm.corner_lot}
                  onChange={(e) => setAddForm({ ...addForm, corner_lot: e.target.checked })}
                />{" "}
                Corner lot
              </label>
            </div>

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 12 }}>
              <button className="segbtn" onClick={() => handleAddSample(null)}>
                Add
              </button>
              <button className="segbtn" onClick={() => handleAddSample("json")}>
                Add & Export JSON
              </button>
              <button className="segbtn" onClick={() => handleAddSample("csv")}>
                Add & Export CSV
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
