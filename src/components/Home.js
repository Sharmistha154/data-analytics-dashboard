import React from "react";

const Home = ({ data, columns, onUpload, goToAnalytics }) => {
  const numericCols = columns.filter((col) =>
    data.some((row) => row[col] !== "" && row[col] != null && !isNaN(Number(row[col])))
  );
  const categoricalCols = columns.filter((col) => !numericCols.includes(col));
  const totalMissing = data.reduce(
    (acc, row) => acc + columns.filter((col) => row[col] === "" || row[col] == null).length,
    0
  );

  return (
    <div>
      <div className="card">
        <h2>Upload CSV File</h2>
        <input type="file" accept=".csv" onChange={onUpload} />
      </div>

      {data.length > 0 && (
        <>
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-value">{data.length.toLocaleString()}</div>
              <div className="kpi-label">Total Rows</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-value">{columns.length}</div>
              <div className="kpi-label">Total Columns</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-value">{totalMissing}</div>
              <div className="kpi-label">Missing Values</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-value">{numericCols.length}</div>
              <div className="kpi-label">Numeric Columns</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-value">{categoricalCols.length}</div>
              <div className="kpi-label">Categorical Columns</div>
            </div>
          </div>

          <div className="card">
            <h3>Column Names</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.5rem" }}>
              {columns.map((col, i) => (
                <span key={i} className="badge">{col}</span>
              ))}
            </div>
          </div>

          <div className="card">
            <button onClick={goToAnalytics}>Go to Analytics →</button>
          </div>
        </>
      )}
    </div>
  );
};

export default Home;
