import React, { useState, useMemo, useEffect } from "react";
import Papa from "papaparse";

const ROWS_PER_PAGE = 10;

const Analytics = ({ data, columns }) => {
  const [search, setSearch] = useState("");
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState("asc");
  const [visibleCols, setVisibleCols] = useState(columns);
  const [currentPage, setCurrentPage] = useState(1);
  const [showColSelector, setShowColSelector] = useState(false);

  useEffect(() => {
    setVisibleCols(columns);
  }, [columns]);

  const filtered = useMemo(() => {
    if (data.length === 0) return [];
    let rows = [...data];
    if (search) {
      const s = search.toLowerCase();
      rows = rows.filter((row) =>
        columns.some((col) => String(row[col]).toLowerCase().includes(s))
      );
    }
    if (sortCol) {
      rows.sort((a, b) => {
        const av = a[sortCol], bv = b[sortCol];
        if (av == null) return 1;
        if (bv == null) return -1;
        if (typeof av === "number") return sortDir === "asc" ? av - bv : bv - av;
        return sortDir === "asc"
          ? String(av).localeCompare(String(bv))
          : String(bv).localeCompare(String(av));
      });
    }
    return rows;
  }, [data, search, sortCol, sortDir, columns]);

  if (data.length === 0) return <div className="card"><h2>No data uploaded — please upload a CSV first.</h2></div>;

  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  const paginated = filtered.slice((currentPage - 1) * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE);

  const handleSort = (col) => {
    if (sortCol === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(col);
      setSortDir("asc");
    }
    setCurrentPage(1);
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const toggleCol = (col) => {
    setVisibleCols((prev) =>
      prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col]
    );
  };

  const exportCSV = () => {
    const csv = Papa.unparse(
      filtered.map((row) =>
        Object.fromEntries(visibleCols.map((col) => [col, row[col]]))
      )
    );
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "filtered_data.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="card">
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
          <input
            type="text"
            placeholder="🔍 Search all columns..."
            value={search}
            onChange={handleSearch}
            className="search-input"
          />
          <button onClick={() => setShowColSelector((v) => !v)}>
            🔧 Columns ({visibleCols.length}/{columns.length})
          </button>
          <button onClick={exportCSV}>⬇️ Export CSV</button>
          <span style={{ marginLeft: "auto", fontSize: "0.85rem", color: "#64748b" }}>
            {filtered.length} rows found
          </span>
        </div>

        {showColSelector && (
          <div style={{ marginTop: "1rem", display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {columns.map((col) => (
              <label key={col} style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.85rem", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={visibleCols.includes(col)}
                  onChange={() => toggleCol(col)}
                />
                {col}
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <h2>Data Preview — Page {currentPage} of {totalPages}</h2>
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                {visibleCols.map((col) => (
                  <th key={col} onClick={() => handleSort(col)} style={{ cursor: "pointer", userSelect: "none" }}>
                    {col} {sortCol === col ? (sortDir === "asc" ? "▲" : "▼") : "⇅"}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.map((row, i) => (
                <tr key={i}>
                  {visibleCols.map((col) => (
                    <td key={col}>{row[col] ?? "—"}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pagination">
          <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>««</button>
          <button onClick={() => setCurrentPage((p) => p - 1)} disabled={currentPage === 1}>‹ Prev</button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const start = Math.max(1, currentPage - 2);
            const pg = start + i;
            if (pg > totalPages) return null;
            return (
              <button key={pg} onClick={() => setCurrentPage(pg)} className={currentPage === pg ? "active-page" : ""}>
                {pg}
              </button>
            );
          })}
          <button onClick={() => setCurrentPage((p) => p + 1)} disabled={currentPage === totalPages}>Next ›</button>
          <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>»»</button>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
