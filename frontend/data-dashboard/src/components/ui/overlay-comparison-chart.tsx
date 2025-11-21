"use client"

import React, { useEffect, useState } from "react"
import Papa from "papaparse"
import type { ParseResult } from "papaparse"
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
} from "@/components/ui/chart"

type CSVRow = {
  "Lap Time": string
  "Chassis Velocity X": string
  "Chassis Velocity Y": string
  "Chassis Velocity Z": string
}

type ChartDatum = {
  lapTime: number
  Vx: number
  Vy: number
  Vz: number
  Vt: number
}

const CSV_PATH = "/data/lap data big.csv"

const chartConfig = {
  Vx: {
    label: "Velocity X",
    color: "var(--chart-1)",
  },
  Vy: {
    label: "Velocity Y",
    color: "var(--chart-2)",
  },
  Vz: {
    label: "Velocity Z",
    color: "var(--chart-3)",
  },
  Vt: {
    label: "Total Velocity",
    color: "var(--chart-4)",
  },
} satisfies ChartConfig

export default function OverlayComparisonAreaChart() {
  const [chartData, setChartData] = useState<ChartDatum[]>([])

  useEffect(() => {
    Papa.parse(CSV_PATH, {
      download: true,
      header: true,
      complete: (results: ParseResult<CSVRow>) => {
        const parsedData: ChartDatum[] = []
        let lastLapTime = 0
        let lapEnded = false

        for (const row of results.data) {
          const lapTime = parseFloat(row["Lap Time"])
          const vx = parseFloat(row["Chassis Velocity X"])
          const vy = parseFloat(row["Chassis Velocity Y"])
          const vz = parseFloat(row["Chassis Velocity Z"])

          if (lapTime < lastLapTime) {
            lapEnded = true
          }
          lastLapTime = lapTime

          if (
            lapEnded ||
            isNaN(lapTime) || lapTime > 99.9 ||
            isNaN(vx) || isNaN(vy) || isNaN(vz)
          )
            continue

          const vt = Math.sqrt(vx * vx + vy * vy + vz * vz)
          parsedData.push({ lapTime, Vx: vx, Vy: vy, Vz: vz, Vt: vt })
        }

        setChartData(parsedData)
      },
    })
  }, [])

  const maxV = Math.max(
    ...chartData.flatMap((d) => [
      Math.abs(d.Vx),
      Math.abs(d.Vy),
      Math.abs(d.Vz),
      Math.abs(d.Vt),
    ]),
    10
  )

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || payload.length === 0) return null
    const data = payload[0].payload

    return (
      <div
        style={{
          backgroundColor: "white",
          border: "1px solid #ddd",
          padding: "10px 12px",
          borderRadius: "6px",
          boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
          fontSize: "13px",
          lineHeight: "1.5",
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: "6px" }}>
          Lap Time: {data.lapTime.toFixed(2)} s
        </div>

        {(Object.keys(chartConfig) as (keyof typeof chartConfig)[]).map((key) => (
          <div
            key={key}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "3px",
              gap: "6px",
            }}
          >
            {/* Color square and label */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div
                style={{
                  width: "10px",
                  height: "10px",
                  backgroundColor: chartConfig[key].color,
                  borderRadius: "2px",
                }}
              />
              <span style={{ color: "#333" }}>{chartConfig[key].label}</span>
            </div>

            {/* Value */}
            <span style={{ color: "#555", fontWeight: 500 }}>
              {data[key].toFixed(2)} m/s
            </span>
          </div>
        ))}
      </div>
    )
  }


  return (
    <Card>
      <CardHeader>
        <CardTitle>Velocity vs Lap Time (Area)</CardTitle>
        <CardDescription>
          First 100 seconds of first lap — with velocity components and total velocity
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <AreaChart
            data={chartData}
            margin={{ left: 12, right: 12, top: 10, bottom: 10 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="lapTime"
              type="number"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              label={{ value: "Lap Time (s)", position: "insideBottom", offset: -5 }}
            />
            <YAxis
              domain={[-Math.ceil(maxV + 2), Math.ceil(maxV + 2)]}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              label={{
                value: "Velocity (m/s)",
                angle: -90,
                position: "insideLeft",
              }}
            />
            <Tooltip cursor={false} content={<CustomTooltip />} />

            {/* Gradients */}
            <defs>
              {(Object.keys(chartConfig) as (keyof typeof chartConfig)[]).map((key) => (
                <linearGradient
                  key={key}
                  id={`fill${key}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor={chartConfig[key].color}
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor={chartConfig[key].color}
                    stopOpacity={0.05}
                  />
                </linearGradient>
              ))}
            </defs>

            {/* Areas */}
            <Area
              type="monotone"
              dataKey="Vx"
              stroke={chartConfig.Vx.color}
              strokeWidth={1.5}
              fill="url(#fillVx)"
              fillOpacity={0.3}
            />
            <Area
              type="monotone"
              dataKey="Vy"
              stroke={chartConfig.Vy.color}
              strokeWidth={1.5}
              fill="url(#fillVy)"
              fillOpacity={0.3}
            />
            <Area
              type="monotone"
              dataKey="Vz"
              stroke={chartConfig.Vz.color}
              strokeWidth={1.5}
              fill="url(#fillVz)"
              fillOpacity={0.3}
            />
            <Area
              type="monotone"
              dataKey="Vt"
              stroke={chartConfig.Vt.color}
              strokeWidth={1.5}
              fill="url(#fillVt)"
              fillOpacity={0.25}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <div className="text-muted-foreground text-sm">
          comparing velocity components and showing total velocity over the first lap
        </div>
      </CardFooter>
    </Card>
  )
}
