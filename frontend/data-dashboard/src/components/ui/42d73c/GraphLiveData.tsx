// components/liveData/LiveDataGraphs.tsx
// Displays live car telemetry charts from CSV, with selectable columns in card-like presentation

"use client";

import React, { useEffect, useMemo, useState } from "react";
import Papa from "papaparse"; // CSV parsing library
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"; // Charting library
import CompassDial from "./CompassDial"; // Custom dial component

// Parse numeric values from CSV cells
function safeNum(v: any) {
  if (v == null) return NaN;
  if (typeof v === "number") return Number.isFinite(v) ? v : NaN;
  const s = String(v).replace(/,/g, "").trim();
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : NaN;
}

export default function LiveDataGraphs() {
  const [data, setData] = useState<any[]>([]); // Parsed numeric CSV data
  const [numericCols, setNumericCols] = useState<string[]>([]); // Columns detected as numeric
  const [selectedCols, setSelectedCols] = useState<string[]>([]); // Columns currently plotted

  const [dialCol, setDialCol] = useState<string>(""); // Column displayed in compass dial
  const [dialValue, setDialValue] = useState<number>(0); // Current value for compass dial

  // Layout constants
  const GROUP_MAX_WIDTH = 1100; // Max width for chart + label group
  const LABEL_COL_WIDTH = 80; // Fixed width for rotated Y-axis label column
  const CHART_MAX_WIDTH = GROUP_MAX_WIDTH - LABEL_COL_WIDTH;

  // Load CSV and detect numeric columns
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/carData.csv", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const csvText = await res.text();

        // Parse CSV
        const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true, dynamicTyping: false });
        const rows = (parsed.data || []) as any[];

        if (!rows || !rows.length) {
          setData([]);
          setNumericCols([]);
          setSelectedCols([]);
          return;
        }

        const keys = Object.keys(rows[0] || {});
        // Detect numeric columns (at least 1 numeric value in first 6 rows)
        const numeric: string[] = keys.filter((k) => {
          let numericCount = 0;
          for (let i = 0; i < Math.min(6, rows.length); i++) {
            if (Number.isFinite(safeNum(rows[i][k]))) numericCount++;
          }
          return numericCount >= 1;
        });

        // Map numeric columns into numeric values, fallback to null
        const numericData = rows.map((r: any, idx: number) => {
          const obj: any = { lapIndex: idx }; // Add lap index for X-axis
          numeric.forEach((col) => {
            const v = safeNum(r[col]);
            obj[col] = Number.isFinite(v) ? v : null;
          });
          return obj;
        });

        setData(numericData);
        setNumericCols(numeric);
        // Default selected columns: first two numeric columns if none already selected
        setSelectedCols((prev) => (prev.length ? prev : numeric.slice(0, 2)));
      } catch (e) {
        console.error("LiveDataGraphs: CSV load error", e);
        setData([]);
        setNumericCols([]);
        setSelectedCols([]);
      }
    })();
  }, []);

  // Update compass dial when selection or data changes
  useEffect(() => {
    if (selectedCols.length > 0 && data.length > 0) {
      const primary = selectedCols[0];
      setDialCol(primary);
      const colValues = data.map((d) => d[primary]);
      const latest = colValues[colValues.length - 1];
      setDialValue(Number.isFinite(latest) ? latest : 0);
    } else {
      setDialCol("");
      setDialValue(0);
    }
  }, [selectedCols, data]);

  // Color palette for plotted lines
  const palette = useMemo(
    () => ["#ff6b6b", "#ffbe4a", "#ffd86b", "#9fd3a3", "#7ea9ff", "#c58cff", "#4dd0e1", "#f78fb3"],
    []
  );

  // Y-axis label dynamically based on selected columns
  const fullYAxisLabel = useMemo(() => {
    if (selectedCols.length === 0) return "Value";
    if (selectedCols.length === 1) return `${selectedCols[0]} (units)`;
    return `${selectedCols[0]} / ${selectedCols[1]} (units vary)`;
  }, [selectedCols]);

  return (
    <div
      className="p-4"
      style={{
        background: "#0b0b0b",
        color: "#fff",
        borderRadius: 8,
        overflow: "visible",
      }}
    >
      <h2 className="text-2xl font-semibold mb-4 text-center" style={{ color: "#fff" }}>
        Live Car Telemetry
      </h2>

      {/* Column selectors */}
      <div className="flex gap-2 mb-4 flex-wrap justify-center">
        {numericCols.map((col) => (
          <button
            key={col}
            className={`px-3 py-1 rounded border`}
            style={{
              background: selectedCols.includes(col) ? "#2563eb" : "#e5e7eb",
              color: selectedCols.includes(col) ? "#fff" : "#000",
              border: "1px solid #ccc",
            }}
            onClick={() => {
              setSelectedCols((prev) =>
                prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col].slice(-2)
              );
            }}
          >
            {col}
          </button>
        ))}
      </div>

      {/* Chart + Y-axis label container */}
      <div
        style={{
          width: `min(${GROUP_MAX_WIDTH}px, 96%)`,
          margin: "0 auto",
          display: "flex",
          gap: 12,
          alignItems: "stretch",
          justifyContent: "center",
        }}
      >
        {/* Left:  Y-axis label */}
        <div
          style={{
            width: LABEL_COL_WIDTH,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxSizing: "border-box",
            paddingLeft: 6,
          }}
        >
          <div
            style={{
              transform: "rotate(-90deg)",
              transformOrigin: "center",
              whiteSpace: "nowrap",
              color: "#9aa0a6",
              fontSize: 13,
              fontWeight: 500,
              marginLeft: 8,
            }}
          >
            {fullYAxisLabel}
          </div>
        </div>

        {/* Right: chart container */}
        <div
          style={{
            width: `calc(100% - ${LABEL_COL_WIDTH}px)`,
            maxWidth: CHART_MAX_WIDTH,
            minWidth: 320,
            position: "relative",
            display: "flex",
            justifyContent: "center",
            boxSizing: "border-box",
          }}
        >
          {/* CompassDial overlay (top-right) */}
          {dialCol && data.length > 0 && (
            <div style={{ position: "absolute", top: 8, right: 8, zIndex: 10 }}>
              <CompassDial
                value={dialValue}
                min={Math.min(...data.map((d) => (d[dialCol] == null ? 0 : d[dialCol]))) || 0}
                max={Math.max(...data.map((d) => (d[dialCol] == null ? 0 : d[dialCol]))) || 100}
                size={80}
                step={1}
                onChange={(v) => {
                  setDialValue(v);
                  // Updates latest data point for the column
                  setData((prev) => {
                    const newData = [...prev];
                    const lastIndex = newData.length - 1;
                    newData[lastIndex] = { ...newData[lastIndex], [dialCol]: v };
                    return newData;
                  });
                }}
                label={dialCol}
              />
            </div>
          )}

          {/* Line chart */}
          {selectedCols.length > 0 && (
            <div style={{ width: "88%", maxWidth: 920 }}>
              <ResponsiveContainer width="100%" height={520}>
                <LineChart
                  data={data}
                  margin={{ top: 40, right: 20, left: 16, bottom: 56 }} 
                >
                  <CartesianGrid stroke="#2a2a2a" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="lapIndex"
                    label={{ value: "Lap Index (count)", position: "insideBottom", offset: -8, fill: "#ffffff" }}
                    tick={{ fill: "#ffffff" }}
                    axisLine={{ stroke: "#888" }}
                    tickLine={{ stroke: "#888" }}
                    allowDecimals={false}
                  />
                  <YAxis
                    tick={{ fill: "#ffffff" }}
                    axisLine={{ stroke: "#888" }}
                    tickLine={{ stroke: "#888" }}
                    width={48}
                    tickMargin={8}
                  />
                  <Tooltip
                    contentStyle={{ background: "#ffffff", borderRadius: 6, border: "1px solid #ddd", color: "#000" }}
                    itemStyle={{ color: "#000" }}
                    labelStyle={{ color: "#000" }}
                  />
                  <Legend
                    verticalAlign="top"
                    align="center"
                    wrapperStyle={{
                      top: 6,
                      background: "#ffffff",
                      padding: "6px 8px",
                      borderRadius: 6,
                      color: "#000",
                      display: "inline-flex",
                      gap: 12,
                    }}
                    iconType="circle"
                  />
                  {/* Plot selected columns */}
                  {selectedCols.map((col, i) => (
                    <Line
                      key={col}
                      type="monotone"
                      dataKey={col}
                      stroke={palette[i % palette.length]}
                      dot={false}
                      isAnimationActive={false}
                      connectNulls
                      strokeWidth={2}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
