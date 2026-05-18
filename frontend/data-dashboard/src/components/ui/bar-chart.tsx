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

export function BarChartComponent() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Sales</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={{ sales: { label: "Sales" } }}>
          <BarChart data={data}>
            <Bar dataKey="value" fill="#f97316" radius={4} />
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="sales" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

// with live data from lib

import { useLiveData } from "@/lib/liveData"


export function BarChartComponent2() {
  const data2 = useLiveData()

  if (!data2) return <div>No data currently..</div>

  return (
    <BarChart width={400} height={300} data={data.info}>
      <Bar dataKey="value" fill="#f97316" radius={4} />
      <CartesianGrid vertical={false} />
      <XAxis dataKey="month" />
      <Bar dataKey="value" />
    </BarChart>
  )
}
