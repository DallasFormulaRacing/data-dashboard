export const DEFAULT_CSV_FILE = "race-telemetry.csv"

export type GraphType = "blank" | "bar" | "line" | "dial"

export type GraphConfig = {
  title: string
  dataFile: string
  xKey?: string
  yKeys?: string[]
  valueKey?: string
  min?: number
  max?: number
}

export type GraphItem = {
  type: GraphType
  id: number
  x: number
  y: number
  w: number
  h?: number
  config: GraphConfig
}

export type DashboardData = {
  [tab: string]: {
    graphs: GraphItem[]
  }
}

export const createDefaultGraphConfig = (type: GraphType): GraphConfig => {
  if (type === "dial") {
    return {
      title: "Dial Chart",
      dataFile: DEFAULT_CSV_FILE,
      valueKey: "",
      min: undefined,
      max: undefined,
    }
  }

  if (type === "bar") {
    return {
      title: "Bar Chart",
      dataFile: DEFAULT_CSV_FILE,
      xKey: "",
      yKeys: [],
    }
  }

  if (type === "line") {
    return {
      title: "Line Chart",
      dataFile: DEFAULT_CSV_FILE,
      xKey: "",
      yKeys: [],
    }
  }

  return {
    title: "Blank Graph",
    dataFile: DEFAULT_CSV_FILE,
  }
}
