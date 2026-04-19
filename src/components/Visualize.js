import React, { useState, useRef } from "react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  ScatterChart, Scatter, XAxis, YAxis, ZAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { toPng } from "html-to-image";

const COLORS = ["#6366f1", "#22d3ee", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6"];

const heatColor = (val, min, max) => {
  const t = max === min ? 0 : (val - min) / (max - min);
  const r = Math.round(99 + (239 - 99) * (1 - t));
  const g = Math.round(102 + (68 - 102) * (1 - t));
  const b = Math.round(241 + (68 - 241) * (1 - t));
  return `rgb(${r},${g},${b})`;
};

const renderPieLabel = ({ cx, cy, midAngle, outerRadius, percent, name }) => {
  if (percent < 0.04) return null;
  const RADIAN = Math.PI / 180;
  const radius = outerRadius + 35;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  const anchor = x > cx ? "start" : "end";
  return (
    <text
      x={x}
      y={y}
      fill="#374151"
      textAnchor={anchor}
      dominantBaseline="central"
      fontSize={11}
    >
      {`${name} (${(percent * 100).toFixed(1)}%)`}
    </text>
  );
};

const Visualize = ({ data, columns }) => {
  const numericCols = columns.filter((col) =>
    data.some((row) => !isNaN(row[col]) && row[col] !== "")
  );
  const categoricalCols = columns.filter((col) => isNaN(data[0]?.[col]));

  const [xCol, setXCol] = useState(categoricalCols[0] || columns[0] || "");
  const [yCol, setYCol] = useState(numericCols[0] || columns[1] || "");
  const [y2Col, setY2Col] = useState(numericCols[1] || numericCols[0] || "");
  const [scatterX, setScatterX] = useState(numericCols[0] || "");
  const [scatterY, setScatterY] = useState(numericCols[1] || numericCols[0] || "");
  const [heatRow, setHeatRow] = useState(categoricalCols[0] || columns[0] || "");
  const [heatCol, setHeatCol] = useState(categoricalCols[1] || categoricalCols[0] || "");
  const [heatVal, setHeatVal] = useState(numericCols[0] || "");
  const [chartType, setChartType] = useState("bar");
  const [activeTab, setActiveTab] = useState("main");

  const mainChartRef = useRef(null);
  const scatterRef = useRef(null);
  const heatRef = useRef(null);
  const histRef = useRef(null);

  if (data.length === 0)
    return <div className="card"><h2>No data uploaded — please upload a CSV first.</h2></div>;

  const exportChart = (ref, name) => {
    if (!ref.current) return;
    toPng(ref.current).then((dataUrl) => {
      const a = document.createElement("a");
      a.download = `${name}.png`;
      a.href = dataUrl;
      a.click();
    });
  };

  const aggregated = Object.values(
    data.reduce((acc, row) => {
      const key = String(row[xCol]);
      if (!acc[key]) acc[key] = { name: key, [yCol]: 0, [y2Col]: 0 };
      acc[key][yCol] += Number(row[yCol]) || 0;
      acc[key][y2Col] += Number(row[y2Col]) || 0;
      return acc;
    }, {})
  ).slice(0, 20);

  const scatterData = data.slice(0, 500).map((row) => ({
    x: Number(row[scatterX]),
    y: Number(row[scatterY]),
  })).filter((d) => !isNaN(d.x) && !isNaN(d.y));

  const heatRows = [...new Set(data.map((r) => r[heatRow]))].slice(0, 15);
  const heatCols = [...new Set(data.map((r) => r[heatCol]))].slice(0, 10);
  const heatMap = {};
  data.forEach((row) => {
    const r = row[heatRow], c = row[heatCol], v = Number(row[heatVal]) || 0;
    if (!heatMap[r]) heatMap[r] = {};
    heatMap[r][c] = (heatMap[r][c] || 0) + v;
  });
  const allHeatVals = Object.values(heatMap).flatMap((r) => Object.values(r));
  const heatMin = Math.min(...allHeatVals);
  const heatMax = Math.max(...allHeatVals);

  const histVals = data.map((r) => Number(r[yCol])).filter((v) => !isNaN(v));
  const histMin = Math.min(...histVals);
  const histMax = Math.max(...histVals);
  const bucketSize = (histMax - histMin) / 10 || 1;
  const hist = Array.from({ length: 10 }, (_, i) => ({
    range: `${(histMin + i * bucketSize).toFixed(1)}`,
    count: histVals.filter(
      (v) => v >= histMin + i * bucketSize && v < histMin + (i + 1) * bucketSize
    ).length,
  }));

  const tabs = ["main", "scatter", "heatmap", "histogram"];

  return (
    <div>
      <div className="tab-bar">
        {tabs.map((t) => (
          <button key={t} onClick={() => setActiveTab(t)} className={activeTab === t ? "tab-active" : "tab"}>
            {t === "main" && "📊 Chart"}
            {t === "scatter" && "🔵 Scatter Plot"}
            {t === "heatmap" && "🌡 Heatmap"}
            {t === "histogram" && "📉 Histogram"}
          </button>
        ))}
      </div>

      {activeTab === "main" && (
        <div className="card">
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "1rem", alignItems: "flex-end" }}>
            <div>
              <label>Chart Type: </label>
              <select value={chartType} onChange={(e) => setChartType(e.target.value)}>
                <option value="bar">Bar Chart</option>
                <option value="multibar">Multi-Column Bar</option>
                <option value="line">Line Chart</option>
                <option value="pie">Pie Chart</option>
              </select>
            </div>
            <div>
              <label>X Axis: </label>
              <select value={xCol} onChange={(e) => setXCol(e.target.value)}>
                {columns.map((col) => <option key={col} value={col}>{col}</option>)}
              </select>
            </div>
            <div>
              <label>Y Axis: </label>
              <select value={yCol} onChange={(e) => setYCol(e.target.value)}>
                {numericCols.map((col) => <option key={col} value={col}>{col}</option>)}
              </select>
            </div>
            {chartType === "multibar" && (
              <div>
                <label>Y Axis 2: </label>
                <select value={y2Col} onChange={(e) => setY2Col(e.target.value)}>
                  {numericCols.map((col) => <option key={col} value={col}>{col}</option>)}
                </select>
              </div>
            )}
            <button onClick={() => exportChart(mainChartRef, "chart")}>⬇ Export PNG</button>
          </div>
          <div ref={mainChartRef} style={{ background: "inherit", padding: "0.5rem" }}>
            <ResponsiveContainer width="100%" height={420}>
              {chartType === "bar" ? (
                <BarChart data={aggregated} margin={{ top: 10, right: 20, left: 60, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey={yCol} fill="#6366f1" />
                </BarChart>
              ) : chartType === "multibar" ? (
                <BarChart data={aggregated} margin={{ top: 10, right: 20, left: 60, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey={yCol} fill="#6366f1" />
                  <Bar dataKey={y2Col} fill="#22d3ee" />
                </BarChart>
              ) : chartType === "line" ? (
                <LineChart data={aggregated} margin={{ top: 10, right: 20, left: 60, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey={yCol} stroke="#6366f1" />
                </LineChart>
              ) : (
                <PieChart margin={{ top: 20, right: 60, bottom: 20, left: 60 }}>
                  <Pie
                    data={aggregated}
                    dataKey={yCol}
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={110}
                    labelLine={true}
                    label={renderPieLabel}
                  >
                    {aggregated.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === "scatter" && (
        <div className="card">
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "1rem", alignItems: "flex-end" }}>
            <div>
              <label>X Axis: </label>
              <select value={scatterX} onChange={(e) => setScatterX(e.target.value)}>
                {numericCols.map((col) => <option key={col} value={col}>{col}</option>)}
              </select>
            </div>
            <div>
              <label>Y Axis: </label>
              <select value={scatterY} onChange={(e) => setScatterY(e.target.value)}>
                {numericCols.map((col) => <option key={col} value={col}>{col}</option>)}
              </select>
            </div>
            <button onClick={() => exportChart(scatterRef, "scatter")}>⬇ Export PNG</button>
          </div>
          <p style={{ fontSize: "0.82rem", color: "#64748b", marginBottom: "0.5rem" }}>Showing up to 500 data points</p>
          <div ref={scatterRef} style={{ background: "inherit", padding: "0.5rem" }}>
            <ResponsiveContainer width="100%" height={380}>
              <ScatterChart margin={{ top: 10, right: 20, left: 60, bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="x" name={scatterX} type="number" label={{ value: scatterX, position: "insideBottom", offset: -15 }} />
                <YAxis dataKey="y" name={scatterY} type="number" label={{ value: scatterY, angle: -90, position: "insideLeft" }} />
                <ZAxis range={[30, 30]} />
                <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                <Scatter data={scatterData} fill="#6366f1" opacity={0.6} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === "heatmap" && (
        <div className="card">
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "1rem" }}>
            <div>
              <label>Row: </label>
              <select value={heatRow} onChange={(e) => setHeatRow(e.target.value)}>
                {columns.map((col) => <option key={col} value={col}>{col}</option>)}
              </select>
            </div>
            <div>
              <label>Column: </label>
              <select value={heatCol} onChange={(e) => setHeatCol(e.target.value)}>
                {columns.map((col) => <option key={col} value={col}>{col}</option>)}
              </select>
            </div>
            <div>
              <label>Value: </label>
              <select value={heatVal} onChange={(e) => setHeatVal(e.target.value)}>
                {numericCols.map((col) => <option key={col} value={col}>{col}</option>)}
              </select>
            </div>
            <button onClick={() => exportChart(heatRef, "heatmap")}>⬇ Export PNG</button>
          </div>
          <div ref={heatRef} style={{ overflowX: "auto", background: "inherit", padding: "0.5rem" }}>
            <table>
              <thead>
                <tr>
                  <th></th>
                  {heatCols.map((c) => <th key={c} style={{ fontSize: "0.78rem" }}>{c}</th>)}
                </tr>
              </thead>
              <tbody>
                {heatRows.map((r) => (
                  <tr key={r}>
                    <td style={{ fontWeight: 600, fontSize: "0.78rem" }}>{r}</td>
                    {heatCols.map((c) => {
                      const val = heatMap[r]?.[c] || 0;
                      return (
                        <td key={c} style={{
                          background: heatColor(val, heatMin, heatMax),
                          color: "white",
                          textAlign: "center",
                          fontWeight: 600,
                          fontSize: "0.78rem",
                          padding: "0.4rem 0.6rem",
                        }}>
                          {val.toFixed(0)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "histogram" && (
        <div className="card">
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "1rem", alignItems: "flex-end" }}>
            <div>
              <label>Column: </label>
              <select value={yCol} onChange={(e) => setYCol(e.target.value)}>
                {numericCols.map((col) => <option key={col} value={col}>{col}</option>)}
              </select>
            </div>
            <button onClick={() => exportChart(histRef, "histogram")}>⬇ Export PNG</button>
          </div>
          <div ref={histRef} style={{ background: "inherit", padding: "0.5rem" }}>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={hist} margin={{ top: 10, right: 20, left: 60, bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" tick={{ fontSize: 11 }} label={{ value: yCol, position: "insideBottom", offset: -15 }} />
                <YAxis label={{ value: "Count", angle: -90, position: "insideLeft" }} />
                <Tooltip />
                <Bar dataKey="count" fill="#22d3ee" name="Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default Visualize;
