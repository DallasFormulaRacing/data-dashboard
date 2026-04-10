"use client"

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"
import {Card, CardContent, CardHeader, CardTitle,} from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent,} from "@/components/ui/chart"

// with static data, followed sample on website

const data = [
  { month: "Jan", sales: 400 },
  { month: "Feb", sales: 300 },
  { month: "Mar", sales: 500 },
  { month: "Apr", sales: 200 },
]
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
}
export function BarChartComponent({
    id,
    x,
    y,
    w,
    h = 1,
    minW = 1,
    maxW = 2,
    minH = 1,
    maxH = 1,
} : GraphProps) {
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
    <Card className="flex h-full w-full flex-col rounded-lg bg-black text-white border-white/10">
      <CardHeader className="drag-handle cursor-grab active:cursor-grabbing py-3">
        <CardTitle>Monthly Sales</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-3 pt-0">
        <ChartContainer className="h-full w-full aspect-auto" config={{ sales: { label: "Sales" } }}>
          <BarChart data={data}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="sales" fill="#f97316" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
    </div>
    </div>
  )
}

// with live data from lib

import { useLiveData } from "@/lib/liveData"


// export function BarChartComponent2() {
//   const data2 = useLiveData()

//   if (!data2) return <div>No data currently..</div>

//   return (
//     <BarChart width={400} height={300} data={data.info}>
//       <Bar dataKey="value" fill="#f97316" radius={4} />
//       <CartesianGrid vertical={false} />
//       <XAxis dataKey="month" />
//       <Bar dataKey="value" />
//     </BarChart>
//   )
// }
