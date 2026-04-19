import React, { useState } from "react";

const safeNum = (v) => { const n = Number(v); return isFinite(n) ? n : null; };

const pearson = (a, b) => {
  const n = Math.min(a.length, b.length, 500);
  if (n < 2) return 0;
  const xs = a.slice(0, n), ys = b.slice(0, n);
  const ma = xs.reduce((x, y) => x + y, 0) / n;
  const mb = ys.reduce((x, y) => x + y, 0) / n;
  let num = 0, da = 0, db = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - ma) * (ys[i] - mb);
    da += (xs[i] - ma) ** 2;
    db += (ys[i] - mb) ** 2;
  }
  const den = Math.sqrt(da * db);
  return den === 0 ? 0 : num / den;
};

const corrBg = (v) => {
  const a = Math.min(Math.abs(v), 1).toFixed(2);
  return v >= 0 ? `rgba(99,102,241,${a})` : `rgba(239,68,68,${a})`;
};

const Insights = ({ data, columns }) => {
  const [showCorr, setShowCorr] = useState(false);

  if (!data || data.length === 0 || !columns || columns.length === 0) {
    return <div className="card"><h2>No data available — upload a CSV first.</h2></div>;
  }

  const numericCols = columns.filter((col) =>
    data.slice(0, 100).some((row) => safeNum(row[col]) !== null)
  );
  const categoricalCols = columns.filter((col) => !numericCols.includes(col));

  // Pre-compute all stats once
  const statsMap = {};
  const valsMap = {};
  numericCols.forEach((col) => {
    const vals = data.slice(0, 2000).map((r) => safeNum(r[col])).filter((v) => v !== null);
    valsMap[col] = vals;
    if (!vals.length) return;
    const s = [...vals].sort((a, b) => a - b);
    const q1 = s[Math.floor(s.length * 0.25)];
    const q3 = s[Math.floor(s.length * 0.75)];
    statsMap[col] = {
      min: s[0],
      max: s[s.length - 1],
      mean: vals.reduce((a, b) => a + b, 0) / vals.length,
      median: s.length % 2 === 0
        ? (s[s.length / 2 - 1] + s[s.length / 2]) / 2
        : s[Math.floor(s.length / 2)],
      q1, q3, iqr: q3 - q1,
    };
  });

  // Outliers — capped at 300 rows
  const outliers = [];
  data.slice(0, 300).forEach((row, idx) => {
    const flags = numericCols.filter((col) => {
      const v = safeNum(row[col]);
      if (v === null || !statsMap[col]) return false;
      const { q1, q3, iqr } = statsMap[col];
      return v < q1 - 1.5 * iqr || v > q3 + 1.5 * iqr;
    });
    if (flags.length) outliers.push({ row, idx, flags });
  });

  // Correlation — only computed on button click, capped at 8 cols
  const corrCols = numericCols.slice(0, 8);
  const corrMatrix = {};
  if (showCorr) {
    corrCols.forEach((r) => {
      corrMatrix[r] = {};
      corrCols.forEach((c) => {
        corrMatrix[r][c] = pearson(valsMap[r] || [], valsMap[c] || []);
      });
    });
  }

  return (
    <div>

      {/* Numeric */}
      <div className="card">
        <h2>Numeric Insights</h2>
        {numericCols.length === 0 && <p>No numeric columns found.</p>}
        {numericCols.map((col) => {
          const s = statsMap[col];
          if (!s) return null;
          return (
            <div key={col} style={{ marginBottom: "1rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.75rem" }}>
              <h4>{col}</h4>
              <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
                <span>Min: <strong>{s.min}</strong></span>
                <span>Max: <strong>{s.max}</strong></span>
                <span>Mean: <strong>{s.mean.toFixed(2)}</strong></span>
                <span>Median: <strong>{s.median.toFixed(2)}</strong></span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Categorical */}
      <div className="card">
        <h2>Categorical Insights</h2>
        {categoricalCols.length === 0 && <p>No categorical columns found.</p>}
        {categoricalCols.map((col) => {
          const freq = {};
          data.forEach((row) => {
            const v = String(row[col] ?? "null");
            freq[v] = (freq[v] || 0) + 1;
          });
          const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
          return (
            <div key={col} style={{ marginBottom: "1rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.75rem" }}>
              <h4>{col}</h4>
              <p>Unique: <strong>{sorted.length}</strong> &nbsp;|&nbsp; Most Frequent: <strong>{sorted[0]?.[0]}</strong> ({sorted[0]?.[1]} times)</p>
            </div>
          );
        })}
      </div>

      {/* Correlation Matrix — lazy loaded on click */}
      {numericCols.length >= 2 && (
        <div className="card">
          <h2>Correlation Matrix</h2>
          {!showCorr ? (
            <div>
              <p style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "1rem" }}>
                Shows relationships between numeric columns (up to 8 columns, 500 rows sampled).
              </p>
              <button onClick={() => setShowCorr(true)}>Calculate Correlation</button>
            </div>
          ) : (
            <>
              <p style={{ fontSize: "0.82rem", color: "#64748b", marginBottom: "1rem" }}>
                🟣 Blue = positive &nbsp; 🔴 Red = negative &nbsp; Darker = stronger
              </p>
              <div style={{ overflowX: "auto" }}>
                <table>
                  <thead>
                    <tr>
                      <th></th>
                      {corrCols.map((col) => <th key={col} style={{ fontSize: "0.78rem" }}>{col}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {corrCols.map((rowCol) => (
                      <tr key={rowCol}>
                        <td style={{ fontWeight: 600, fontSize: "0.78rem" }}>{rowCol}</td>
                        {corrCols.map((colCol) => {
                          const corr = corrMatrix[rowCol]?.[colCol] ?? 0;
                          return (
                            <td key={colCol} style={{
                              background: corrBg(corr),
                              textAlign: "center",
                              fontWeight: 600,
                              fontSize: "0.82rem",
                              color: Math.abs(corr) > 0.5 ? "white" : "inherit",
                            }}>
                              {corr.toFixed(2)}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* Outliers */}
      <div className="card">
        <h2>Outlier Detection (IQR Method)</h2>
        <p style={{ fontSize: "0.82rem", color: "#64748b", marginBottom: "0.75rem" }}>
          Scanning first {Math.min(300, data.length)} rows
        </p>
        {outliers.length === 0
          ? <p style={{ color: "#10b981" }}>✅ No outliers detected.</p>
          : <>
              <p style={{ marginBottom: "1rem", fontSize: "0.85rem", color: "#64748b" }}>⚠️ {outliers.length} rows flagged</p>
              <div style={{ overflowX: "auto" }}>
                <table>
                  <thead>
                    <tr>
                      <th>Row #</th>
                      {numericCols.map((col) => <th key={col}>{col}</th>)}
                      <th>Flagged</th>
                    </tr>
                  </thead>
                  <tbody>
                    {outliers.slice(0, 20).map(({ row, idx, flags }) => (
                      <tr key={idx}>
                        <td>{idx + 1}</td>
                        {numericCols.map((col) => (
                          <td key={col} style={{
                            background: flags.includes(col) ? "rgba(239,68,68,0.15)" : "inherit",
                            fontWeight: flags.includes(col) ? 700 : 400,
                            color: flags.includes(col) ? "#ef4444" : "inherit",
                          }}>
                            {row[col] ?? "—"}
                          </td>
                        ))}
                        <td style={{ fontSize: "0.8rem", color: "#ef4444" }}>{flags.join(", ")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {outliers.length > 20 && (
                <p style={{ marginTop: "0.5rem", fontSize: "0.82rem", color: "#64748b" }}>
                  Showing 20 of {outliers.length} rows.
                </p>
              )}
            </>
        }
      </div>

    </div>
  );
};

export default Insights;
