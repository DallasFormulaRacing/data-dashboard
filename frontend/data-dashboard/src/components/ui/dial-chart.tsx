"use client"

import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from "recharts"

// use static data; follow tutorial 

import {Card, CardContent, CardHeader, CardTitle,} from "@/components/ui/card"

const data = [
  {
    name: "progress",
    value: 75,
  },
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

export function DialChartComponent({
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
        <Card className="flex h-full w-full flex-col rounded-lg">
          <CardHeader className="drag-handle cursor-grab py-3">
            <CardTitle>Completion</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-1 items-center justify-center p-3 pt-0">
            <div className="h-full w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  innerRadius="70%"
                  outerRadius="100%"
                  data={data}
                  startAngle={180}
                  endAngle={0}
                >
                  <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                  <RadialBar dataKey="value" cornerRadius={10} />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// use live data

// import { useLiveData } from "@/lib/liveData"

// export function DialChartComponent2() {
//   const data = useLiveData()

//   if (!data) return <div>No data currently..</div>

//   const chartData = [{ name: "progress", value: data.completion }]

//   return (
//     <RadialBarChart
//       width={250}
//       height={250}
//       innerRadius="70%"
//       outerRadius="100%"
//       data={chartData}
//       startAngle={180}
//       endAngle={0}
//     >
//       <RadialBar dataKey="value" fill="#f97316" cornerRadius={10}/>
//       <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
//     </RadialBarChart>
//   )
// }