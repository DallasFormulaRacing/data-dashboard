"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts"
import { GripHorizontal } from "lucide-react"

import {Card, CardContent, CardHeader, CardTitle,} from "@/components/ui/card"

import {ChartContainer, ChartTooltip, ChartTooltipContent,} from "@/components/ui/chart"
import PencilSquareIcon from "@heroicons/react/24/outline/PencilSquareIcon"
import TrashIcon from "@heroicons/react/24/outline/TrashIcon"
import type { CsvRow } from "@/lib/csvDataset"
import type { GraphConfig } from "@/types/graph"
import { memo, useMemo } from "react"

const LINE_COLORS = ["#f97316", "#38bdf8", "#a78bfa", "#34d399", "#f472b6", "#facc15"]

type GraphProps = {
  id: string
  x: number
  y: number
  w: number
  h?: number
  minW?: number
  maxW?: number
  minH?: number
  maxH?: number
  config: GraphConfig
  rows: CsvRow[]
  onEdit?: () => void
  onDelete?: () => void
}

const toNumber = (value: unknown) => {
  const parsed = Number.parseFloat(String(value ?? "").replace(/,/g, "").trim())
  return Number.isFinite(parsed) ? parsed : Number.NaN
}

function LineChartComponentBase({
  id,
  x,
  y,
  w,
  h = 1,
  minW = 1,
  maxW = 2,
  minH = 1,
  maxH,
  config,
  rows,
  onEdit,
  onDelete,
}: GraphProps) {
  const xKey = config.xKey ?? ""
  const yKeys = config.yKeys?.filter((key) => key.length > 0) ?? []

  const chartRows = useMemo(() => {
    return rows
      .map((row, index) => {
        const mapped: Record<string, string | number | null> = {
          x: xKey ? (row[xKey] || String(index)) : String(index),
        }

        yKeys.forEach((key) => {
          const value = toNumber(row[key])
          mapped[key] = Number.isFinite(value) ? value : null
        })

        return mapped
      })
      .filter((row) => yKeys.some((key) => typeof row[key] === "number"))
      .slice(0, 300) // Limit to 300 data points for performance
  }, [rows, xKey, yKeys])

  const canRender = Boolean(xKey && yKeys.length && chartRows.length)

  const chartConfig = yKeys.reduce<Record<string, { label: string }>>((acc, key) => {
    acc[key] = { label: key }
    return acc
  }, {})

  return (
    <div
      className="grid-stack-item"
      gs-id={id}
      gs-x={x}
      gs-y={y}
      gs-w={w}
      gs-h={h}
      gs-min-w={minW}
      gs-max-w={maxW}
      gs-min-h={minH}
      gs-max-h={maxH}
    >
      <div className="grid-stack-item-content">
        <div className="relative h-full w-full">
          <div className="absolute right-3 top-3 z-20 flex gap-2">
            <button
              type="button"
              title="Edit graph"
              aria-label="Edit graph"
              className="rounded-full border border-white/15 bg-black/70 p-2 text-white transition-colors hover:bg-sky-500/20 hover:text-sky-200"
              onMouseDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation()
                onEdit?.()
              }}
            >
              <PencilSquareIcon className="h-5 w-5" />
            </button>
          <button
            type="button"
            title="Delete graph"
            aria-label="Delete graph"
            className="rounded-full border border-white/15 bg-black/70 p-2 text-white transition-colors hover:bg-red-500/20 hover:text-red-300"
            onMouseDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation()
              onDelete?.()
            }}
          >
            <TrashIcon className="h-5 w-5" />
          </button>
          </div>
          <Card className="flex h-full w-full flex-col rounded-lg bg-black text-white border-white/10">
            <CardHeader className="drag-handle flex flex-row items-center space-y-0 cursor-grab active:cursor-grabbing py-3 pr-12">
              <GripHorizontal className="mr-2 h-5 w-5 text-white/30 shrink-0" />
              <CardTitle>{config.title || "Line Chart"}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 p-3 pt-0">
              {canRender ? (
                <ChartContainer className="h-full w-full aspect-auto" config={chartConfig}>
                  <LineChart data={chartRows} margin={{ top: 15, right: 10, left: 10, bottom: 20 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis 
                      dataKey="x" 
                      label={{ value: xKey || "X Axis", position: 'insideBottom', offset: -15, fill: '#ffffff', opacity: 0.5, fontSize: 12 }} 
                      tick={{ fill: '#ffffff', opacity: 0.5, fontSize: 12 }}
                    />
                    <YAxis 
                      label={{ value: yKeys.join(', ') || "Value", angle: -90, position: 'insideLeft', offset: 15, fill: '#ffffff', opacity: 0.5, fontSize: 12 }} 
                      tick={{ fill: '#ffffff', opacity: 0.5, fontSize: 12 }}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    {yKeys.map((key, index) => (
                      <Line
                        key={key}
                        type="monotone"
                        dataKey={key}
                        stroke={LINE_COLORS[index % LINE_COLORS.length]}
                        strokeWidth={2}
                        dot={false}
                        connectNulls
                      />
                    ))}
                  </LineChart>
                </ChartContainer>
              ) : (
                <div className="flex h-full items-center justify-center rounded-md border border-dashed border-white/30 bg-white/5 px-3 text-center text-sm text-white/75">
                  Configure X and one or more Y axes to display this line chart.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export const LineChartComponent = memo(LineChartComponentBase)