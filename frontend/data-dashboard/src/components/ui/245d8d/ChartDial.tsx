"use client"

import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from "recharts"
import { GripHorizontal } from "lucide-react"

import {Card, CardContent, CardHeader, CardTitle,} from "@/components/ui/card"
import PencilSquareIcon from "@heroicons/react/24/outline/PencilSquareIcon"
import TrashIcon from "@heroicons/react/24/outline/TrashIcon"
import type { CsvRow } from "@/lib/csvDataset"
import type { GraphConfig } from "@/types/graph"
import { memo, useMemo } from "react"

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

function DialChartComponentBase({
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
  const valueKey = config.valueKey ?? ""
  const values = useMemo(() => {
    return valueKey
      ? rows
          .map((row) => toNumber(row[valueKey]))
          .filter((value) => Number.isFinite(value))
      : []
  }, [rows, valueKey])

  const computedMin = values.length ? Math.min(...values) : 0
  const computedMax = values.length ? Math.max(...values) : 100
  const min = typeof config.min === "number" ? config.min : computedMin
  const max = typeof config.max === "number" ? config.max : computedMax
  const latestValue = values.length ? values[values.length - 1] : 0

  const normalizedMax = max > min ? max : min + 1
  const clampedValue = Math.max(min, Math.min(latestValue, normalizedMax))

  const chartData = [{ name: valueKey || "value", value: clampedValue }]
  const canRender = Boolean(valueKey && values.length)

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
              <CardTitle>{config.title || "Dial Chart"}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-1 min-h-0 items-center justify-center p-3 pt-0">
              {canRender ? (
                <div className="h-full w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart
                      innerRadius="70%"
                      outerRadius="100%"
                      data={chartData}
                      startAngle={180}
                      endAngle={0}
                    >
                      <PolarAngleAxis type="number" domain={[min, normalizedMax]} tick={false} />
                      <RadialBar dataKey="value" cornerRadius={10} fill="#f97316" />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <div className="-mt-5 text-center text-sm text-white/85">
                    {valueKey}: {clampedValue.toFixed(2)}
                  </div>
                </div>
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-md border border-dashed border-white/30 bg-white/5 px-3 text-center text-sm text-white/75">
                  Configure a value axis to display this dial chart.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export const DialChartComponent = memo(DialChartComponentBase)