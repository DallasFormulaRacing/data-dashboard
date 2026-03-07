"use client"

import { RadialBarChart, RadialBar, PolarAngleAxis } from "recharts"

// use static data; follow tutorial 

import {Card, CardContent, CardHeader, CardTitle,} from "@/components/ui/card"

const data = [
  {
    name: "progress",
    value: 75,
  },
]

export function DialChartComponent() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Completion</CardTitle>
      </CardHeader>
      <CardContent className="flex justify-center">
        <RadialBarChart
          width={250}
          height={250}
          innerRadius="70%"
          outerRadius="100%"
          data={data}
          startAngle={180}
          endAngle={0}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <RadialBar dataKey="value" cornerRadius={10} />
        </RadialBarChart>
      </CardContent>
    </Card>
  )
}

// use live data

import { useLiveData } from "@/lib/liveData"

export function DialChartComponent2() {
  const data = useLiveData()

  if (!data) return <div>No data currently..</div>

  const chartData = [{ name: "progress", value: data.completion }]

  return (
    <RadialBarChart
      width={250}
      height={250}
      innerRadius="70%"
      outerRadius="100%"
      data={chartData}
      startAngle={180}
      endAngle={0}
    >
      <RadialBar dataKey="value" fill="#f97316" cornerRadius={10}/>
      <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
    </RadialBarChart>
  )
}