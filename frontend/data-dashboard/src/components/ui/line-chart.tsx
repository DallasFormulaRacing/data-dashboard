"use client"

import { LineChart, Line, XAxis, CartesianGrid } from "recharts"

// use static data; from tutorial
import {Card, CardContent, CardHeader, CardTitle,} from "@/components/ui/card"

import {ChartContainer, ChartTooltip, ChartTooltipContent,} from "@/components/ui/chart"

const data = [
  { day: "Mon", users: 120 },
  { day: "Tue", users: 200 },
  { day: "Wed", users: 150 },
  { day: "Thu", users: 250 },
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

export function LineChartComponent({
  id,
  x,
  y,
  w,
  h = 1,
  minW = 1,
  maxW = 2,
  minH = 1,
  maxH = 1,
}: GraphProps) {
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
            <CardTitle>Weekly Users</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-3 pt-0">
            <ChartContainer className="h-full w-full aspect-auto" config={{ users: { label: "Users" } }}>
              <LineChart data={data}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="day" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="users" strokeWidth={2} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// with live data from lib
// import { useLiveData } from "@/lib/liveData"

// export function LineChartComponent2() {
//   const data = useLiveData()

//   if (!data) return <div>No data currently..</div>

//   return (
//     <LineChart width={400} height={300} data={data.info}>
//         <Line type="monotone" dataKey="value" stroke="#f97316"strokeWidth={3}/>
//         <CartesianGrid vertical={false} />
//         <XAxis dataKey="day" />
//     </LineChart>
//   )
// }