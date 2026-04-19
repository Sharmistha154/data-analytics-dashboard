import React, { useState } from "react";
import Papa from "papaparse";
import Home from "./components/Home";
import Analytics from "./components/Analytics";
import Insights from "./components/Insights";
import DataInfo from "./components/DataInfo";
import Visualize from "./components/Visualize";
import DataCleaning from "./components/DataCleaning";
import Report from "./components/Report";
import ErrorBoundary from "./components/ErrorBoundary";
import "./App.css";

function App() {
  const [data, setData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [page, setPage] = useState("home");
  const [darkMode, setDarkMode] = useState(false);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (result) => {
        if (result.data.length === 0) return;
        setData(result.data);
        setColumns(Object.keys(result.data[0]));
      },
    });
  };

  const handleDataChange = (newData, newColumns) => {
    setData(newData);
    setColumns(newColumns);
  };

  const navItems = [
    { id: "home", label: "🏠 Home" },
    { id: "analytics", label: "📈 Analytics" },
    { id: "insights", label: "🧠 Insights" },
    { id: "datainfo", label: "📄 Data Info" },
    { id: "visualize", label: "📊 Visualize" },
    { id: "cleaning", label: "🧹 Data Cleaning" },
    { id: "report", label: "📑 Report" },
  ];

  const titles = {
    home: "Dashboard Home",
    analytics: "Analytics Dashboard",
    insights: "Insights",
    datainfo: "Dataset Info",
    visualize: "Visualizations",
    cleaning: "Data Cleaning",
    report: "Export Report",
  };

  const renderPage = () => {
    switch (page) {
      case "home":
        return <Home data={data} columns={columns} onUpload={handleFileUpload} goToAnalytics={() => setPage("analytics")} />;
      case "analytics":
        return <Analytics data={data} columns={columns} />;
      case "insights":
        return <Insights data={data} columns={columns} />;
      case "datainfo":
        return <DataInfo data={data} columns={columns} />;
      case "visualize":
        return <Visualize data={data} columns={columns} />;
      case "cleaning":
        return <DataCleaning data={data} columns={columns} onDataChange={handleDataChange} />;
      case "report":
        return <Report data={data} columns={columns} />;
      default:
        return null;
    }
  };

  return (
    <div className={`app-container ${darkMode ? "dark" : ""}`}>
      <div className="sidebar">
        <h2>📊 DataDash</h2>
        {navItems.map((item) => (
          <button
            key={item.id}
            className={page === item.id ? "active" : ""}
            onClick={() => setPage(item.id)}
          >
            {item.label}
          </button>
        ))}
        <div style={{ marginTop: "auto", paddingTop: "1rem" }}>
          <button onClick={() => setDarkMode((d) => !d)} style={{ width: "100%" }}>
            {darkMode ? "☀ Light Mode" : "🌙 Dark Mode"}
          </button>
        </div>
      </div>

      <div className="main">
        <div className="header">
          <h1>{titles[page]}</h1>
        </div>
        <div className="content">
          <ErrorBoundary key={page}>
            {renderPage()}
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
}

export default App;
