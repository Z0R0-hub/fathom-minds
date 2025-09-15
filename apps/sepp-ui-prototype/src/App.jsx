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
function IconButton({ onClick, title, children }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      style={{
        marginLeft: 8,
        width: 28,
        height: 28,
        borderRadius: 6,
        border: "1px solid #ddd",
        background: "#fff",
        cursor: "pointer",
        lineHeight: 1,
      }}
      className="icon-btn"
    >
      {children}
    </button>
  );
}
function Modal({ open, onClose, children, title }) {
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.25)",
        display: "grid",
        placeItems: "center",
        zIndex: 1000,
      }}
    >
      <div
        className="card"
        onClick={(e) => e.stopPropagation()}
        style={{ width: 520, maxWidth: "92vw" }}
      >
        <div
          className="card-header"
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
        >
          <h3 style={{ margin: 0 }}>{title}</h3>
          <IconButton title="Close" onClick={onClose}>✕</IconButton>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ---------- csv helper ---------- */
function toCSV(rows) {
  if (!rows?.length) return "";
  const cols = Object.keys(rows[0]);
  const esc = (v) =>
    typeof v === "string"
      ? `"${v.replace(/"/g, '""')}"`
      : v === null || v === undefined
      ? ""
      : String(v);
  const head = cols.join(",");
  const body = rows.map((r) => cols.map((c) => esc(r[c])).join(",")).join("\n");
  return `${head}\n${body}`;
}

/* ======================================================================== */

export default function App() {
  /* data */
  const [properties, setProperties] = useState([]);
  const [selectedId, setSelectedId] = useState("");

  /* form inputs */
  const [type, setType] = useState("shed");
  const [length, setLength] = useState(3);
  const [width, setWidth] = useState(3);
  const [height, setHeight] = useState(2.4);
  const [setback, setSetback] = useState(1.0);

  /* loader + rules state */
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [assessment, setAssessment] = useState({ status: "idle" });

  /* add-sample modal state */
  const [addOpen, setAddOpen] = useState(false);
  const [newSample, setNewSample] = useState({
    label: "",
    zone: "R1 General Residential",
    lot_size_m2: "",
    frontage_m: "",
    corner_lot: false,
  });

  /* load base samples + merge with user-saved ones */
  useEffect(() => {
    (async () => {
      try {
        const res = await loadProperties();
        if (res.ok) {
          const baseList = res.data.properties || [];
          const userList = JSON.parse(localStorage.getItem("userSamples") || "[]") || [];
          const byId = new Map();
          [...baseList, ...userList].forEach((p) => byId.set(p.id, p));
          const list = Array.from(byId.values());
          setProperties(list);
          if (list.length) setSelectedId(list[0].id);
          setError(null);
        } else {
          setError(res);
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

  /* proposal for rules engine */
  const proposal = useMemo(
    () => ({
      kind: type,
      length_m: safeNum(length),
      width_m: safeNum(width),
      height_m: safeNum(height),
      nearest_boundary_m: safeNum(setback),
      area_m2: area,
    }),
    [type, length, width, height, setback, area]
  );

  /* run engine when inputs/site change */
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
          setAssessment({ status: "error", message: out?.message || "Unknown engine error" });
        }
      } catch (e) {
        if (!cancelled) setAssessment({ status: "error", message: e.message || String(e) });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selected, proposal]);

  /* create + persist a new sample, then download JSON/CSV */
  function handleCreateSample(e) {
    e.preventDefault();
    const trimmed = (s) => String(s || "").trim();

    const sample = {
      id: `USR_${Date.now()}`,
      label: trimmed(newSample.label) || "Untitled sample",
      zone: trimmed(newSample.zone) || "R1 General Residential",
      lot_size_m2: Number(newSample.lot_size_m2) || 0,
      frontage_m: Number(newSample.frontage_m) || 0,
      corner_lot: !!newSample.corner_lot,
    };

    const next = [sample, ...properties];
    setProperties(next);
    setSelectedId(sample.id);

    const existing = JSON.parse(localStorage.getItem("userSamples") || "[]");
    localStorage.setItem("userSamples", JSON.stringify([sample, ...existing]));

    const allRows = next.map((p) => ({
      id: p.id,
      label: p.label,
      zone: p.zone,
      lot_size_m2: p.lot_size_m2,
      frontage_m: p.frontage_m,
      corner_lot: p.corner_lot,
    }));

    const jsonBlob = new Blob([JSON.stringify({ properties: allRows }, null, 2)], {
      type: "application/json",
    });
    const csvBlob = new Blob([toCSV(allRows)], { type: "text/csv" });

    const a1 = document.createElement("a");
    a1.href = URL.createObjectURL(jsonBlob);
    a1.download = "properties.json";
    a1.click();
    URL.revokeObjectURL(a1.href);

    const a2 = document.createElement("a");
    a2.href = URL.createObjectURL(csvBlob);
    a2.download = "properties.csv";
    a2.click();
    URL.revokeObjectURL(a2.href);

    setAddOpen(false);
    setNewSample({
      label: "",
      zone: "R1 General Residential",
      lot_size_m2: "",
      frontage_m: "",
      corner_lot: false,
    });
  }

  /* ---------- loading / error ---------- */
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

  /* ---------- normal UI ---------- */
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
            <div className="card-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3 style={{ margin: 0 }}>Site / Sample property</h3>
            </div>

            {/* >>> layout fix so the + button is always visible */}
            <label className="field">
              <span className="label">Choose sample</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8, width: "100%" }}>
                <select
                  value={selectedId}
                  onChange={(e) => setSelectedId(e.target.value)}
                  className="select"
                  style={{ flex: "1 1 auto" }}
                >
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
                <IconButton title="Add sample" onClick={() => setAddOpen(true)}>➕</IconButton>
              </div>
            </label>

            {selected && (
              <div className="chips">
                <Chip>{selected.zone}</Chip>
                <Chip>{`${Number(selected.lot_size_m2 || 0).toLocaleString()} m²`}</Chip>
                <Chip>{`Frontage ${Number(selected.frontage_m || 0)} m`}</Chip>
                {selected.corner_lot && <Chip>Corner lot</Chip>}
              </div>
            )}

            <p className="muted">All distances in metres (m).</p>
          </section>

          {/* Proposed structure */}
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
          {/* Data validation */}
          <section className="card">
            <div className="card-header">
              <h3>Data validation</h3>
            </div>
            <div className="ok-line">
              <span className="bigcheck" aria-hidden>✓</span>
              <div>
                <div className="ok-head">All sample data valid</div>
                <div className="muted">Validated on load with JSON Schema (Draft-07) + AJV.</div>
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
                <p style={{ margin: "6px 0 12px" }}>
                  <strong>Verdict:</strong>{" "}
                  <span
                    style={{
                      padding: "2px 8px",
                      borderRadius: 999,
                      background:
                        (assessment.result?.verdict || "NOT_EXEMPT") === "LIKELY_EXEMPT" ? "#DCFCE7" : "#FEE2E2",
                      color:
                        (assessment.result?.verdict || "NOT_EXEMPT") === "LIKELY_EXEMPT" ? "#166534" : "#991B1B",
                    }}
                  >
                    {assessment.result?.verdict ||
                      (Array.isArray(assessment.checks) && assessment.checks.every((c) => c.ok)
                        ? "LIKELY_EXEMPT"
                        : "NOT_EXEMPT")}
                  </span>
                </p>

                {Array.isArray(assessment.checks) && assessment.checks.length ? (
                  <ul className="issues" style={{ marginTop: 8 }}>
                    {assessment.checks.map((c, i) => (
                      <li key={c.id || i}>
                        <strong>{c.ok ? "PASS" : "FAIL"}:</strong> {c.message || c.code || "See details"}
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

      {/* Add Sample Modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add a sample property">
        <form onSubmit={handleCreateSample} className="form-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <label className="field" style={{ gridColumn: "1 / -1" }}>
            <span className="label">Label</span>
            <input
              className="input"
              value={newSample.label}
              onChange={(e) => setNewSample((s) => ({ ...s, label: e.target.value }))}
              placeholder="e.g., Urban small lot — Newtown"
              required
            />
          </label>

          <label className="field">
            <span className="label">Zone</span>
            <input
              className="input"
              value={newSample.zone}
              onChange={(e) => setNewSample((s) => ({ ...s, zone: e.target.value }))}
            />
          </label>

          <label className="field">
            <span className="label">Lot size (m²)</span>
            <input
              className="input"
              type="number"
              step="1"
              value={newSample.lot_size_m2}
              onChange={(e) => setNewSample((s) => ({ ...s, lot_size_m2: e.target.value }))}
              required
            />
          </label>

          <label className="field">
            <span className="label">Frontage (m)</span>
            <input
              className="input"
              type="number"
              step="0.1"
              value={newSample.frontage_m}
              onChange={(e) => setNewSample((s) => ({ ...s, frontage_m: e.target.value }))}
              required
            />
          </label>

          <label className="field" style={{ alignItems: "center" }}>
            <span className="label">Corner lot</span>
            <input
              type="checkbox"
              checked={!!newSample.corner_lot}
              onChange={(e) => setNewSample((s) => ({ ...s, corner_lot: e.target.checked }))}
              style={{ width: 18, height: 18 }}
            />
          </label>

          <div style={{ gridColumn: "1 / -1", display: "flex", gap: 8, marginTop: 8 }}>
            <button type="submit" className="segbtn active">Save & Download JSON/CSV</button>
            <button type="button" className="segbtn" onClick={() => setAddOpen(false)}>Cancel</button>
          </div>

          <p className="muted" style={{ gridColumn: "1 / -1", marginTop: 8 }}>
            Saved samples persist locally (browser storage). The downloaded <code>properties.json</code> /
            <code>properties.csv</code> can act as a simple “database” file and be checked into the repo if needed.
          </p>
        </form>
      </Modal>
    </main>
  );
}
