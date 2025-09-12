// src/App.jsx
import { useEffect, useState } from "react";
import { loadProperties } from "./data/loadProperties";
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
            <p className="muted">Sprint 3: SEPP/LEP rules engine appears here.</p>
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
