import React from "react";

const DataInfo = ({ data, columns }) => {
  if (!data || data.length === 0)
    return <div className="card"><h2>No data uploaded — please upload a CSV first.</h2></div>;

  return (
    <div>
      <div className="card">
        <h2>Dataset Info</h2>
        <p style={{ marginBottom: "1rem" }}>
          Total Rows: <strong>{data.length.toLocaleString()}</strong> &nbsp;|&nbsp;
          Total Columns: <strong>{columns.length}</strong>
        </p>
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Column</th>
                <th>Type</th>
                <th>Missing</th>
                <th>Missing %</th>
                <th>Unique</th>
                <th>Sample Value</th>
              </tr>
            </thead>
            <tbody>
              {columns.map((col, i) => {
                const vals = data.map((r) => r[col]);
                const isNum = vals.some((v) => !isNaN(v) && v !== "" && v !== null);
                const missing = vals.filter((v) => v === "" || v == null).length;
                const unique = new Set(vals).size;
                const sample = vals.find((v) => v !== "" && v != null);
                const missingPct = ((missing / data.length) * 100).toFixed(1);
                return (
                  <tr key={col}>
                    <td>{i + 1}</td>
                    <td style={{ fontWeight: 600 }}>{col}</td>
                    <td>
                      <span className={`type-badge ${isNum ? "numeric" : "categorical"}`}>
                        {isNum ? "Numeric" : "Categorical"}
                      </span>
                    </td>
                    <td style={{ color: missing > 0 ? "#ef4444" : "inherit" }}>{missing}</td>
                    <td style={{ color: missing > 0 ? "#ef4444" : "#10b981" }}>{missingPct}%</td>
                    <td>{unique}</td>
                    <td style={{ color: "#64748b", fontSize: "0.85rem" }}>{String(sample)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DataInfo;
