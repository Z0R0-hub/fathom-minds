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

  // Load + validate sample data at runtime
  useEffect(() => {
    (async () => {
      try {
        const res = await loadProperties();
        if (res.ok) {
          const list = res.data.properties || [];
          setProperties(list);
          if (list.length) setSelectedId(list[0].id);
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

        // Support both signatures:
        //  - runAssessment(selected, proposal)
        //  - runAssessment({ property: selected, proposal })
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

          // Compute a verdict if engine didn't provide one
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
        <div className="card">
          <p>Loading sample data…</p>
        </div>
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
          <p className="muted">
            Fix <code>public/data/properties.json</code> to continue.
          </p>
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
              <span className="label">Choose sample</span>
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

            {selected && (
              <div className="chips">
                <Chip>{selected.zone}</Chip>
                <Chip>{`${selected.lot_size_m2.toLocaleString()} m²`}</Chip>
                <Chip>{`Frontage ${selected.frontage_m} m`}</Chip>
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
              <strong>{height}</strong> m &nbsp;|&nbsp; Setback ={" "}
              <strong>{setback}</strong> m
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
              <span className="bigcheck" aria-hidden>
                ✓
              </span>
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

            {assessment.status === "running" && (
              <p className="muted">Running checks…</p>
            )}

            {assessment.status === "error" && (
              <div className="card card--error" style={{ margin: 0 }}>
                <p>
                  <strong>Couldn’t run rules:</strong> {assessment.message}
                </p>
                <p className="muted">
                  Ensure the engine exports an assess function and the wrapper
                  returns {"{ ok, issues }"}.
                </p>
              </div>
            )}

            {assessment.status === "done" && (
              <>
                {/* Verdict badge */}
                <p style={{ margin: "6px 0 12px" }}>
                  <strong>Verdict:</strong>{" "}
                  <span
                    style={{
                      padding: "2px 8px",
                      borderRadius: 999,
                      background:
                        (assessment.result?.verdict || "NOT_EXEMPT") ===
                        "LIKELY_EXEMPT"
                          ? "#DCFCE7"
                          : "#FEE2E2",
                      color:
                        (assessment.result?.verdict || "NOT_EXEMPT") ===
                        "LIKELY_EXEMPT"
                          ? "#166534"
                          : "#991B1B",
                    }}
                  >
                    {assessment.result?.verdict ||
                      (Array.isArray(assessment.checks) &&
                      assessment.checks.every((c) => c.ok)
                        ? "LIKELY_EXEMPT"
                        : "NOT_EXEMPT")}
                  </span>
                </p>

                {/* Checks list */}
                {Array.isArray(assessment.checks) &&
                assessment.checks.length ? (
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
    </main>
  );
}
