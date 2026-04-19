import React, { useState } from "react";

const DataCleaning = ({ data, columns, onDataChange }) => {
  const [fillCol, setFillCol] = useState(columns[0] || "");
  const [fillMethod, setFillMethod] = useState("mean");
  const [fillCustom, setFillCustom] = useState("");
  const [trimCol, setTrimCol] = useState(columns[0] || "");
  const [log, setLog] = useState([]);

  if (!data || data.length === 0) {
    return <div className="card"><h2>No data available — upload a CSV first.</h2></div>;
  }

  const addLog = (msg) => setLog((prev) => [`✅ ${msg}`, ...prev].slice(0, 10));

  // Remove duplicates
  const removeDuplicates = () => {
    const seen = new Set();
    const cleaned = data.filter((row) => {
      const key = JSON.stringify(row);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    const removed = data.length - cleaned.length;
    onDataChange(cleaned, columns);
    addLog(`Removed ${removed} duplicate rows. ${cleaned.length} rows remaining.`);
  };

  // Fill missing values
  const fillMissing = () => {
    const vals = data
      .map((r) => Number(r[fillCol]))
      .filter((v) => !isNaN(v) && v !== null);

    let fillValue;
    if (fillMethod === "mean") {
      fillValue = vals.reduce((a, b) => a + b, 0) / vals.length;
    } else if (fillMethod === "median") {
      const s = [...vals].sort((a, b) => a - b);
      fillValue = s.length % 2 === 0
        ? (s[s.length / 2 - 1] + s[s.length / 2]) / 2
        : s[Math.floor(s.length / 2)];
    } else if (fillMethod === "mode") {
      const freq = {};
      vals.forEach((v) => { freq[v] = (freq[v] || 0) + 1; });
      fillValue = Number(Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0]);
    } else if (fillMethod === "zero") {
      fillValue = 0;
    } else if (fillMethod === "custom") {
      fillValue = fillCustom;
    }

    let count = 0;
    const cleaned = data.map((row) => {
      if (row[fillCol] === "" || row[fillCol] == null) {
        count++;
        return { ...row, [fillCol]: fillValue };
      }
      return row;
    });
    onDataChange(cleaned, columns);
    addLog(`Filled ${count} missing values in "${fillCol}" with ${fillMethod === "custom" ? `"${fillValue}"` : `${fillMethod} (${Number(fillValue).toFixed(2)})`}.`);
  };

  // Trim whitespace
  const trimWhitespace = () => {
    let count = 0;
    const cleaned = data.map((row) => {
      const newRow = { ...row };
      if (typeof newRow[trimCol] === "string") {
        const trimmed = newRow[trimCol].trim();
        if (trimmed !== newRow[trimCol]) count++;
        newRow[trimCol] = trimmed;
      }
      return newRow;
    });
    onDataChange(cleaned, columns);
    addLog(`Trimmed whitespace in ${count} cells in "${trimCol}".`);
  };

  // Remove column
  const removeColumn = (col) => {
    const newCols = columns.filter((c) => c !== col);
    const cleaned = data.map((row) => {
      const newRow = { ...row };
      delete newRow[col];
      return newRow;
    });
    onDataChange(cleaned, newCols);
    addLog(`Removed column "${col}".`);
  };

  // Drop rows with any missing values
  const dropMissingRows = () => {
    const cleaned = data.filter((row) =>
      columns.every((col) => row[col] !== "" && row[col] != null)
    );
    const removed = data.length - cleaned.length;
    onDataChange(cleaned, columns);
    addLog(`Dropped ${removed} rows with missing values. ${cleaned.length} rows remaining.`);
  };

  const missingCount = (col) =>
    data.filter((r) => r[col] === "" || r[col] == null).length;

  const totalMissing = columns.reduce((acc, col) => acc + missingCount(col), 0);

  return (
    <div>
      {/* Overview */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-value">{data.length.toLocaleString()}</div>
          <div className="kpi-label">Current Rows</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value">{columns.length}</div>
          <div className="kpi-label">Current Columns</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value" style={{ color: totalMissing > 0 ? "#ef4444" : "#10b981" }}>
            {totalMissing}
          </div>
          <div className="kpi-label">Missing Values</div>
        </div>
      </div>

      {/* Remove Duplicates */}
      <div className="card">
        <h2>Remove Duplicates</h2>
        <p style={{ marginBottom: "1rem" }}>Removes rows where all column values are identical.</p>
        <button onClick={removeDuplicates}>🗑️ Remove Duplicates</button>
      </div>

      {/* Drop rows with missing */}
      <div className="card">
        <h2>Drop Rows with Missing Values</h2>
        <p style={{ marginBottom: "1rem" }}>
          Removes any row that has at least one empty or null value.
          Currently <strong style={{ color: "#ef4444" }}>{data.filter((row) =>
            columns.some((col) => row[col] === "" || row[col] == null)
          ).length}</strong> rows affected.
        </p>
        <button onClick={dropMissingRows}>🗑️ Drop Incomplete Rows</button>
      </div>

      {/* Fill Missing Values */}
      <div className="card">
        <h2>Fill Missing Values</h2>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "1rem", alignItems: "flex-end" }}>
          <div>
            <label>Column: </label>
            <select value={fillCol} onChange={(e) => setFillCol(e.target.value)}>
              {columns.map((col) => (
                <option key={col} value={col}>
                  {col} ({missingCount(col)} missing)
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Fill With: </label>
            <select value={fillMethod} onChange={(e) => setFillMethod(e.target.value)}>
              <option value="mean">Mean</option>
              <option value="median">Median</option>
              <option value="mode">Mode</option>
              <option value="zero">Zero</option>
              <option value="custom">Custom Value</option>
            </select>
          </div>
          {fillMethod === "custom" && (
            <input
              type="text"
              placeholder="Enter value..."
              value={fillCustom}
              onChange={(e) => setFillCustom(e.target.value)}
              className="search-input"
              style={{ minWidth: "150px" }}
            />
          )}
          <button onClick={fillMissing}>✏️ Fill Missing</button>
        </div>
      </div>

      {/* Trim Whitespace */}
      <div className="card">
        <h2>Trim Whitespace</h2>
        <p style={{ marginBottom: "1rem" }}>Removes leading and trailing spaces from text values.</p>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
          <div>
            <label>Column: </label>
            <select value={trimCol} onChange={(e) => setTrimCol(e.target.value)}>
              {columns.map((col) => <option key={col} value={col}>{col}</option>)}
            </select>
          </div>
          <button onClick={trimWhitespace}>✂️ Trim Whitespace</button>
        </div>
      </div>

      {/* Remove Columns */}
      <div className="card">
        <h2>Remove Columns</h2>
        <p style={{ marginBottom: "1rem" }}>Click a column to remove it from the dataset.</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          {columns.map((col) => (
            <button
              key={col}
              onClick={() => removeColumn(col)}
              style={{
                background: "#fee2e2",
                color: "#ef4444",
                border: "1px solid #fecaca",
                padding: "0.3rem 0.8rem",
                borderRadius: "999px",
                cursor: "pointer",
                fontSize: "0.82rem",
                fontWeight: 600,
              }}
            >
              ✕ {col}
            </button>
          ))}
        </div>
      </div>

      {/* Action Log */}
      {log.length > 0 && (
        <div className="card">
          <h2>Action Log</h2>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {log.map((entry, i) => (
              <li key={i} style={{
                padding: "0.5rem 0",
                borderBottom: "1px solid var(--border-color)",
                fontSize: "0.88rem",
                color: "#10b981",
              }}>
                {entry}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default DataCleaning;
