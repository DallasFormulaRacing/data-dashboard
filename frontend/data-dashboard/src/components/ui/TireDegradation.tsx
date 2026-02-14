"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";


type Row = Record<string, any>;


const TIRES = ["FL", "FR", "RL", "RR"];
const COLORS: Record<string, string> = {
  FL: "#ff6b6b",
  FR: "#ffbe4a",
  RL: "#ffd86b",
  RR: "#9fd3a3",
  OVERALL: "#000000",
};


function safeNum(v: any) {
  if (v == null) return NaN;
  if (typeof v === "number") return Number.isFinite(v) ? v : NaN;
  const s = String(v).replace(/,/g, "").trim();
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : NaN;
}


export default function TireDegradation({
  csvPath = "/carData.csv",
  applyExponential = false,
  normalize = false,
}: {
  csvPath?: string;
  applyExponential?: boolean;
  normalize?: boolean;
}) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [activeIndex, setActiveIndex] = useState<number>(0); // currently hovered / active graph index


  // Load CSV data
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(csvPath, { cache: "no-store" });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const txt = await r.text();
        const parsed: Row[] = txt ? JSON.parse(txt) : [];
        if (!cancelled) setRows(parsed.length ? parsed : null);
      } catch (e) {
        console.warn("CSV not loaded, using synthetic data");
        if (!cancelled) setRows(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [csvPath]);


  // Generate chart data
  const chartData = useMemo(() => {
    if (!rows || rows.length < 2) {
      // Synthetic fallback
      return Array.from({ length: 40 }).map((_, i) => {
        const wear = (i / 39) * 100;
        const FL = +(100 * Math.exp(-0.015 * wear)).toFixed(2);
        const FR = +(100 * Math.exp(-0.012 * wear)).toFixed(2);
        const RL = +(100 * Math.exp(-0.013 * wear)).toFixed(2);
        const RR = +(100 * Math.exp(-0.011 * wear)).toFixed(2);
        const OVERALL = +((FL + FR + RL + RR) / 4).toFixed(2);
        return { wear, FL, FR, RL, RR, OVERALL };
      });
    }


    // Use CSV data
    const grips: Record<string, number[]> = { FL: [], FR: [], RL: [], RR: [] };
    rows.forEach((row) => {
      TIRES.forEach((t) => {
        const val = safeNum(row[t]);
        grips[t].push(Number.isFinite(val) ? val : 0);
      });
    });


    return grips.FL.map((_, i) => {
      const out: any = { wear: (i / grips.FL.length) * 100 };
      TIRES.forEach((t) => (out[t] = grips[t][i]));
      const vals = TIRES.map((t) => out[t]);
      out.OVERALL = +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2);
      return out;
    });
  }, [rows]);


  // Dynamic wheel percentages based on activeIndex
  const wheelPercentages = useMemo(() => {
    const idx = Math.min(activeIndex, chartData.length - 1);
    const point = chartData[idx];
    return TIRES.reduce(
      (acc, t) => ({ ...acc, [t]: point[t] ?? 0 }),
      {} as Record<string, number>
    );
  }, [chartData, activeIndex]);


  return (
    <div style={{ width: "100%", padding: 16 }}>
    {/* Car Prototype */}
    <div
      style={{
        position: "relative",
        width: 300,
        aspectRatio: "2 / 4",
        margin: "0 auto",
        background: "#222",
        borderRadius: 16,
        overflow: "hidden",
      }}
    >
      <img
        src="DFRCarProtoTireDeg.png"
        alt="Car Prototype"
        style={{ 
          width: "100%", 
          height: "100%", 
          objectFit: "cover",
        }}
      />

        { [ 
        //displaying the prototype overlayed by green circles with tire percentages
          { t: "FL", top: "10%", left: "28%" },
          { t: "FR", top: "10%", left: "70%" },
          { t: "RL", top: "85%", left: "30%" },
          { t: "RR", top: "85%", left: "70%"

        }].map(({ t, top, left }) => (
          <div
           key={t}
            style={{
          position: "absolute", 
          top,
          left, 
          width: 50, 
          height: 50, 
          borderRadius: "50%", 
          background: "#0f0", 
          display: "flex", 
          justifyContent: "center", 
          alignItems: "center", 
          color: "#000", 
          fontWeight: "bold", 
          fontSize: 14, 
          boxShadow: "0 0 6px #0f0",   
          transform: "translate(-50%, -50%)",
         }}
      >
     {wheelPercentages[t].toFixed(0)}%
          </div>
        ))}
      </div>

    {/* Mini Chart */}
    <div style={{ width: "100%", height: 250, marginTop: 32 }}>
      <ResponsiveContainer>
        <LineChart
          data={chartData}
          onMouseMove={(state: any) => {
            if (state && state.activeTooltipIndex != null) setActiveIndex(state.activeTooltipIndex);
          }}
          onMouseLeave={() => setActiveIndex(chartData.length - 1)}
        >
          <CartesianGrid stroke="#2a2a2a" />
          <XAxis dataKey="wear" label={{ value: "Wear (%)", fill: "#fff", position: "insideBottom" }} />
          <YAxis domain={[0, 100]} label={{ value: "Grip (%)", angle: -90, fill: "#fff", position: "insideLeft" }} />
          <Tooltip />
          <Legend />
          <Line dataKey="OVERALL" stroke={COLORS.OVERALL} strokeWidth={2} />
          {TIRES.map((t) => (
            <Line key={t} dataKey={t} stroke={COLORS[t]} strokeWidth={2} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  </div>
);
}