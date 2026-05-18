import { promises as fs } from "fs"
import path from "path"
import { NextResponse } from "next/server"
import { createDefaultGraphConfig, DEFAULT_CSV_FILE } from "@/types/graph"

export const dynamic = "force-dynamic"
export const revalidate = 0

type GraphType = "blank" | "bar" | "line" | "dial"

type GraphItem = {
  type: GraphType
  id: number
  x: number
  y: number
  w: number
  config: {
    title: string
    dataFile: string
    xKey?: string
    yKeys?: string[]
    valueKey?: string
    min?: number
    max?: number
  }
}

type DashboardData = Record<string, { graphs: GraphItem[] }>

const resolveGraphdataPath = async () => {
  const candidates = [
    path.join(process.cwd(), "public", "data", "graphdata.json"),
    path.join(process.cwd(), "frontend", "data-dashboard", "public", "data", "graphdata.json"),
  ]

  for (const candidate of candidates) {
    try {
      await fs.access(candidate)
      return candidate
    } catch {
      // Try next candidate path.
    }
  }

  return candidates[0]
}

const normalizeConfig = (rawConfig: unknown, type: GraphType) => {
  const defaults = createDefaultGraphConfig(type)
  const config = typeof rawConfig === "object" && rawConfig !== null ? rawConfig as Record<string, unknown> : {}

  const next = {
    ...defaults,
    title: typeof config.title === "string" && config.title.trim().length ? config.title : defaults.title,
    dataFile: typeof config.dataFile === "string" && config.dataFile.trim().length ? config.dataFile : DEFAULT_CSV_FILE,
  } as GraphItem["config"]

  if (type === "line" || type === "bar") {
    next.xKey = typeof config.xKey === "string" ? config.xKey : ""
    next.yKeys = Array.isArray(config.yKeys)
      ? config.yKeys.map((key) => String(key)).filter((key) => key.length > 0)
      : []
  }

  if (type === "dial") {
    next.valueKey = typeof config.valueKey === "string" ? config.valueKey : ""
    next.min = typeof config.min === "number" ? config.min : undefined
    next.max = typeof config.max === "number" ? config.max : undefined
  }

  return next
}

const parseDashboardData = (value: unknown): DashboardData | null => {
  if (!value || typeof value !== "object") return null

  const result: DashboardData = {}

  for (const [tabName, rawTab] of Object.entries(value as Record<string, unknown>)) {
    const rawGraphs = (rawTab as { graphs?: unknown })?.graphs
    if (!Array.isArray(rawGraphs)) continue

    const graphs: GraphItem[] = rawGraphs.map((rawGraph, index) => {
      const graph = rawGraph as Partial<GraphItem>
      const id = Number(graph.id)
      const x = Number(graph.x)
      const y = Number(graph.y)
      const w = Number(graph.w)
      const graphType = graph.type

      return {
        type: graphType === "bar" || graphType === "line" || graphType === "dial" ? graphType : "blank",
        id: Number.isFinite(id) ? id : index + 1,
        x: Number.isFinite(x) ? x : 0,
        y: Number.isFinite(y) ? y : 0,
        w: Number.isFinite(w) && (w === 1 || w === 2) ? w : 1,
        config: normalizeConfig((rawGraph as { config?: unknown }).config, graphType === "bar" || graphType === "line" || graphType === "dial" ? graphType : "blank"),
      }
    })

    result[tabName] = { graphs }
  }

  return Object.keys(result).length ? result : null
}

export async function GET() {
  try {
    const graphdataPath = await resolveGraphdataPath()
    const content = await fs.readFile(graphdataPath, "utf8")
    const json = JSON.parse(content) as unknown
    const data = parseDashboardData(json)

    if (!data) {
      return NextResponse.json({ error: "Invalid graphdata.json format" }, { status: 500 })
    }

    return NextResponse.json(
      { data },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    )
  } catch (error) {
    console.error("Failed to read graphdata.json", error)
    return NextResponse.json({ error: "Failed to read graphdata.json" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const graphdataPath = await resolveGraphdataPath()
    const body = (await request.json()) as { data?: unknown }
    const data = parseDashboardData(body.data)

    if (!data) {
      return NextResponse.json({ error: "Invalid dashboard data payload" }, { status: 400 })
    }

    const fileContent = `${JSON.stringify(data, null, 2)}\n`
    await fs.mkdir(path.dirname(graphdataPath), { recursive: true })
    await fs.writeFile(graphdataPath, fileContent, "utf8")

    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (error) {
    console.error("Failed to update graphdata.json", error)
    return NextResponse.json({ error: "Failed to update graphdata.json" }, { status: 500 })
  }
}
