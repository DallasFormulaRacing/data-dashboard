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

export function LineChartComponent() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly Users</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={{ users: { label: "Users" } }}>
          <LineChart data={data}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="day" />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line type="monotone" dataKey="users" strokeWidth={2} />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

// with live data from lib
import { useLiveData } from "@/lib/liveData"

export function LineChartComponent2() {
  const data = useLiveData()

  if (!data) return <div>No data currently..</div>

  return (
    <LineChart width={400} height={300} data={data.info}>
        <Line type="monotone" dataKey="value" stroke="#f97316"strokeWidth={3}/>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="day" />
    </LineChart>
  )
}