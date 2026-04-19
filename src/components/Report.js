import React, { useState } from "react";
import { jsPDF } from "jspdf";
import pptxgen from "pptxgenjs";

const safeNum = (v) => { const n = Number(v); return isFinite(n) ? n : null; };

const Report = ({ data, columns }) => {
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pptLoading, setPptLoading] = useState(false);

  if (!data || data.length === 0) {
    return <div className="card"><h2>No data available — upload a CSV first.</h2></div>;
  }

  const numericCols = columns.filter((col) =>
    data.slice(0, 50).some((row) => safeNum(row[col]) !== null)
  );
  const categoricalCols = columns.filter((col) => !numericCols.includes(col));
  const totalMissing = data.reduce(
    (acc, row) => acc + columns.filter((col) => row[col] === "" || row[col] == null).length, 0
  );

  const getStats = (col) => {
    const vals = data.slice(0, 2000).map((r) => safeNum(r[col])).filter((v) => v !== null);
    if (!vals.length) return null;
    const s = [...vals].sort((a, b) => a - b);
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    const median = s.length % 2 === 0
      ? (s[s.length / 2 - 1] + s[s.length / 2]) / 2
      : s[Math.floor(s.length / 2)];
    return { min: s[0], max: s[s.length - 1], mean, median };
  };

  const getCatStats = (col) => {
    const freq = {};
    data.forEach((row) => { const v = String(row[col] ?? "null"); freq[v] = (freq[v] || 0) + 1; });
    const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
    return { unique: sorted.length, top: sorted[0] };
  };

  // ===== PDF EXPORT =====
  const exportPDF = () => {
    setPdfLoading(true);
    try {
      const doc = new jsPDF();
      const pageW = doc.internal.pageSize.getWidth();
      let y = 20;

      const addText = (text, x, size = 10, style = "normal", color = [30, 41, 59]) => {
        doc.setFontSize(size);
        doc.setFont("helvetica", style);
        doc.setTextColor(...color);
        doc.text(text, x, y);
      };

      const addLine = () => {
        y += 3;
        doc.setDrawColor(226, 232, 240);
        doc.line(15, y, pageW - 15, y);
        y += 6;
      };

      const checkPage = () => {
        if (y > 270) { doc.addPage(); y = 20; }
      };

      // Title
      doc.setFillColor(99, 102, 241);
      doc.rect(0, 0, pageW, 35, "F");
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      doc.text("DataDash Report", 15, 22);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Generated: ${new Date().toLocaleString()}`, 15, 30);
      y = 50;

      // Overview
      addText("Dataset Overview", 15, 14, "bold", [51, 65, 85]);
      y += 8;
      addLine();
      addText(`Total Rows: ${data.length.toLocaleString()}`, 15, 10);
      y += 6;
      addText(`Total Columns: ${columns.length}`, 15, 10);
      y += 6;
      addText(`Numeric Columns: ${numericCols.length}`, 15, 10);
      y += 6;
      addText(`Categorical Columns: ${categoricalCols.length}`, 15, 10);
      y += 6;
      addText(`Total Missing Values: ${totalMissing}`, 15, 10, "normal",
        totalMissing > 0 ? [239, 68, 68] : [16, 185, 129]);
      y += 10;

      // Columns list
      checkPage();
      addText("Columns", 15, 14, "bold", [51, 65, 85]);
      y += 8;
      addLine();
      const colText = columns.join(", ");
      const wrapped = doc.splitTextToSize(colText, pageW - 30);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text(wrapped, 15, y);
      y += wrapped.length * 5 + 10;

      // Numeric Stats
      if (numericCols.length > 0) {
        checkPage();
        addText("Numeric Column Statistics", 15, 14, "bold", [51, 65, 85]);
        y += 8;
        addLine();

        // Table header
        doc.setFillColor(248, 250, 252);
        doc.rect(15, y - 4, pageW - 30, 8, "F");
        const headers = ["Column", "Min", "Max", "Mean", "Median"];
        const colWidths = [60, 30, 30, 30, 30];
        let xPos = 15;
        headers.forEach((h, i) => {
          doc.setFontSize(9);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(71, 85, 105);
          doc.text(h, xPos + 2, y + 1);
          xPos += colWidths[i];
        });
        y += 9;

        numericCols.forEach((col) => {
          checkPage();
          const s = getStats(col);
          if (!s) return;
          xPos = 15;
          const vals = [col, String(s.min), String(s.max), s.mean.toFixed(2), s.median.toFixed(2)];
          vals.forEach((v, i) => {
            doc.setFontSize(9);
            doc.setFont("helvetica", i === 0 ? "bold" : "normal");
            doc.setTextColor(100, 116, 139);
            doc.text(String(v).substring(0, 18), xPos + 2, y);
            xPos += colWidths[i];
          });
          y += 7;
          doc.setDrawColor(241, 245, 249);
          doc.line(15, y, pageW - 15, y);
          y += 2;
        });
        y += 8;
      }

      // Categorical Stats
      if (categoricalCols.length > 0) {
        checkPage();
        addText("Categorical Column Statistics", 15, 14, "bold", [51, 65, 85]);
        y += 8;
        addLine();

        categoricalCols.forEach((col) => {
          checkPage();
          const { unique, top } = getCatStats(col);
          doc.setFontSize(9);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(99, 102, 241);
          doc.text(col, 15, y);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(100, 116, 139);
          doc.text(`Unique: ${unique}   Most frequent: "${top?.[0]}" (${top?.[1]} times)`, 70, y);
          y += 8;
          doc.setDrawColor(241, 245, 249);
          doc.line(15, y - 3, pageW - 15, y - 3);
        });
        y += 5;
      }

      // Data preview
      checkPage();
      addText("Data Preview (first 10 rows)", 15, 14, "bold", [51, 65, 85]);
      y += 8;
      addLine();

      const previewCols = columns.slice(0, 5);
      const colW = (pageW - 30) / previewCols.length;

      doc.setFillColor(248, 250, 252);
      doc.rect(15, y - 4, pageW - 30, 8, "F");
      previewCols.forEach((col, i) => {
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(71, 85, 105);
        doc.text(col.substring(0, 15), 15 + i * colW + 2, y + 1);
      });
      y += 9;

      data.slice(0, 10).forEach((row) => {
        checkPage();
        previewCols.forEach((col, i) => {
          doc.setFontSize(8);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(100, 116, 139);
          doc.text(String(row[col] ?? "—").substring(0, 15), 15 + i * colW + 2, y);
        });
        y += 7;
        doc.setDrawColor(241, 245, 249);
        doc.line(15, y, pageW - 15, y);
        y += 2;
      });

      // Footer
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(`DataDash Report — Page ${i} of ${pageCount}`, pageW / 2, 290, { align: "center" });
      }

      doc.save("datadash-report.pdf");
    } catch (err) {
      alert("PDF export failed: " + err.message);
    }
    setPdfLoading(false);
  };

  // ===== POWERPOINT EXPORT =====
  const exportPPT = () => {
    setPptLoading(true);
    try {
      const prs = new pptxgen();
      prs.layout = "LAYOUT_WIDE";

      const PURPLE = "6366F1";
      const DARK = "1E293B";
      const GRAY = "64748B";
      const WHITE = "FFFFFF";
      const LIGHT = "F8FAFC";

      // Slide 1 — Title
      const s1 = prs.addSlide();
      s1.background = { color: DARK };
      s1.addShape(prs.ShapeType.rect, { x: 0, y: 0, w: "100%", h: 1.5, fill: { color: PURPLE } });
      s1.addText("DataDash Report", {
        x: 0.5, y: 0.3, w: 12, h: 0.9,
        fontSize: 36, bold: true, color: WHITE, fontFace: "Arial",
      });
      s1.addText(`Generated: ${new Date().toLocaleString()}`, {
        x: 0.5, y: 1.1, w: 12, h: 0.4,
        fontSize: 12, color: "CBD5E1", fontFace: "Arial",
      });
      const overviewItems = [
        `Total Rows: ${data.length.toLocaleString()}`,
        `Total Columns: ${columns.length}`,
        `Numeric Columns: ${numericCols.length}`,
        `Categorical Columns: ${categoricalCols.length}`,
        `Missing Values: ${totalMissing}`,
      ];
      overviewItems.forEach((item, i) => {
        s1.addText(item, {
          x: 0.8, y: 1.9 + i * 0.55, w: 11, h: 0.5,
          fontSize: 16, color: "E2E8F0", fontFace: "Arial",
          bullet: { type: "bullet" },
        });
      });

      // Slide 2 — Columns
      const s2 = prs.addSlide();
      s2.background = { color: WHITE };
      s2.addShape(prs.ShapeType.rect, { x: 0, y: 0, w: "100%", h: 1, fill: { color: PURPLE } });
      s2.addText("Dataset Columns", {
        x: 0.5, y: 0.2, w: 12, h: 0.6,
        fontSize: 24, bold: true, color: WHITE, fontFace: "Arial",
      });
      const colsPerRow = 3;
      columns.slice(0, 18).forEach((col, i) => {
        const row = Math.floor(i / colsPerRow);
        const colPos = i % colsPerRow;
        s2.addShape(prs.ShapeType.rect, {
          x: 0.5 + colPos * 4.2, y: 1.2 + row * 0.7, w: 3.8, h: 0.55,
          fill: { color: "EDE9FE" }, line: { color: PURPLE, width: 1 },
        });
        s2.addText(col, {
          x: 0.5 + colPos * 4.2, y: 1.2 + row * 0.7, w: 3.8, h: 0.55,
          fontSize: 11, color: PURPLE, bold: true, align: "center", valign: "middle",
        });
      });

      // Slide 3 — Numeric Stats
      if (numericCols.length > 0) {
        const s3 = prs.addSlide();
        s3.background = { color: WHITE };
        s3.addShape(prs.ShapeType.rect, { x: 0, y: 0, w: "100%", h: 1, fill: { color: PURPLE } });
        s3.addText("Numeric Column Statistics", {
          x: 0.5, y: 0.2, w: 12, h: 0.6,
          fontSize: 24, bold: true, color: WHITE, fontFace: "Arial",
        });

        const tableData = [
          [
            { text: "Column", options: { bold: true, color: WHITE, fill: { color: PURPLE } } },
            { text: "Min", options: { bold: true, color: WHITE, fill: { color: PURPLE } } },
            { text: "Max", options: { bold: true, color: WHITE, fill: { color: PURPLE } } },
            { text: "Mean", options: { bold: true, color: WHITE, fill: { color: PURPLE } } },
            { text: "Median", options: { bold: true, color: WHITE, fill: { color: PURPLE } } },
          ],
          ...numericCols.slice(0, 12).map((col) => {
            const s = getStats(col);
            if (!s) return [col, "—", "—", "—", "—"];
            return [col, String(s.min), String(s.max), s.mean.toFixed(2), s.median.toFixed(2)];
          }),
        ];

        s3.addTable(tableData, {
          x: 0.5, y: 1.2, w: 12,
          fontSize: 10, fontFace: "Arial",
          border: { color: "E2E8F0" },
          fill: { color: LIGHT },
          color: DARK,
          rowH: 0.4,
        });
      }

      // Slide 4 — Categorical Stats
      if (categoricalCols.length > 0) {
        const s4 = prs.addSlide();
        s4.background = { color: WHITE };
        s4.addShape(prs.ShapeType.rect, { x: 0, y: 0, w: "100%", h: 1, fill: { color: PURPLE } });
        s4.addText("Categorical Column Statistics", {
          x: 0.5, y: 0.2, w: 12, h: 0.6,
          fontSize: 24, bold: true, color: WHITE,
        });
        categoricalCols.slice(0, 10).forEach((col, i) => {
          const { unique, top } = getCatStats(col);
          const yPos = 1.2 + i * 0.65;
          s4.addShape(prs.ShapeType.rect, {
            x: 0.5, y: yPos, w: 12, h: 0.55,
            fill: { color: i % 2 === 0 ? LIGHT : WHITE },
          });
          s4.addText(col, { x: 0.6, y: yPos + 0.05, w: 3, h: 0.45, fontSize: 11, bold: true, color: PURPLE });
          s4.addText(`${unique} unique values`, { x: 3.8, y: yPos + 0.05, w: 3, h: 0.45, fontSize: 10, color: GRAY });
          s4.addText(`Most common: "${top?.[0]}" (${top?.[1]}x)`, { x: 7, y: yPos + 0.05, w: 5.5, h: 0.45, fontSize: 10, color: DARK });
        });
      }

      // Slide 5 — Data Preview
      const s5 = prs.addSlide();
      s5.background = { color: WHITE };
      s5.addShape(prs.ShapeType.rect, { x: 0, y: 0, w: "100%", h: 1, fill: { color: PURPLE } });
      s5.addText("Data Preview (First 8 Rows)", {
        x: 0.5, y: 0.2, w: 12, h: 0.6,
        fontSize: 24, bold: true, color: WHITE,
      });

      const previewCols = columns.slice(0, 5);
      const previewTableData = [
        previewCols.map((col) => ({
          text: col,
          options: { bold: true, color: WHITE, fill: { color: PURPLE } },
        })),
        ...data.slice(0, 8).map((row) =>
          previewCols.map((col) => String(row[col] ?? "—"))
        ),
      ];
      s5.addTable(previewTableData, {
        x: 0.5, y: 1.2, w: 12,
        fontSize: 10, fontFace: "Arial",
        border: { color: "E2E8F0" },
        fill: { color: LIGHT },
        color: DARK,
        rowH: 0.42,
      });

      prs.writeFile({ fileName: "datadash-slides.pptx" });
    } catch (err) {
      alert("PowerPoint export failed: " + err.message);
    }
    setPptLoading(false);
  };

  return (
    <div>
      <div className="card">
        <h2>Export Full Report as PDF</h2>
        <p style={{ marginBottom: "1rem" }}>
          Generates a multi-page PDF with dataset overview, column stats, numeric insights,
          categorical insights, and a data preview.
        </p>
        <button onClick={exportPDF} disabled={pdfLoading}>
          {pdfLoading ? "⏳ Generating..." : "📄 Download PDF Report"}
        </button>
      </div>

      <div className="card">
        <h2>Export Summary Slide Deck</h2>
        <p style={{ marginBottom: "1rem" }}>
          Generates a 5-slide PowerPoint (.pptx) presentation with title slide, column overview,
          numeric stats, categorical stats, and data preview.
        </p>
        <button onClick={exportPPT} disabled={pptLoading}>
          {pptLoading ? "⏳ Generating..." : "📊 Download PowerPoint (.pptx)"}
        </button>
      </div>

      <div className="card">
        <h2>Report Preview</h2>
        <p style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "1rem" }}>
          Here's what will be included in your report:
        </p>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {[
            `📋 Dataset Overview — ${data.length.toLocaleString()} rows, ${columns.length} columns`,
            `🔢 Numeric Stats — ${numericCols.length} columns (min, max, mean, median)`,
            `🏷️ Categorical Stats — ${categoricalCols.length} columns (unique values, most frequent)`,
            `👁️ Data Preview — first 10 rows, first 5 columns`,
            `⚠️ Missing Values — ${totalMissing} total missing`,
          ].map((item, i) => (
            <li key={i} style={{
              padding: "0.6rem 0",
              borderBottom: "1px solid var(--border-color)",
              fontSize: "0.9rem",
              color: "#334155",
            }}>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Report;
