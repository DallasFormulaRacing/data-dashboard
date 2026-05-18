"use client"

import { useNotifications } from "@/components/ui/9dab3a/Notification"
import { Chatbot } from "@/components/ui/9dab3a/Chatbot"
import ButtonAddFilter from "@/components/ui/30c4e3/ButtonAddFilter"
import { useEffect, useRef, useState, memo } from "react"
import { GridStack, type GridItemHTMLElement, type GridStackNode } from "gridstack"
import graphdata from "public/data/graphdata.json"
import BlankGraph from "@/components/ui/30c4e3/BlankGraph"
import { BarChartComponent } from "@/components/ui/bar-chart"
import { LineChartComponent } from "@/components/ui/line-chart"
import { DialChartComponent } from "@/components/ui/dial-chart"
import { useCsvDataset } from "@/lib/csvDataset"
import {
  createDefaultGraphConfig,
  DEFAULT_CSV_FILE,
  type DashboardData,
  type GraphConfig,
  type GraphItem,
  type GraphType,
} from "@/types/graph"

type MeResponse = {
  discord_name?: string
  discord_username?: string
  presets?: unknown
}

type GraphDataResponse = {
  data?: unknown
}

type GraphFormState = {
  type: GraphType
  title: string
  dataFile: string
  xKey: string
  yKeys: string[]
  valueKey: string
  min: string
  max: string
}

const cloneDefaultDashboardData = (): DashboardData =>
  JSON.parse(JSON.stringify(graphdata)) as DashboardData

const cloneGraphs = (graphs: GraphItem[]): GraphItem[] =>
  JSON.parse(JSON.stringify(graphs)) as GraphItem[]

const getNextGraphId = (graphs: GraphItem[]) =>
  graphs.reduce((maxId, graph) => Math.max(maxId, graph.id), 0) + 1

const createBlankGraph = (graphs: GraphItem[]): GraphItem => ({
  type: "blank",
  id: getNextGraphId(graphs),
  x: 0,
  y: 0,
  w: 1,
  config: createDefaultGraphConfig("blank"),
})

const packGraphs = (graphs: GraphItem[]): GraphItem[] => {
  const sorted = [...graphs].sort((a, b) => {
    if (a.y !== b.y) return a.y - b.y
    if (a.x !== b.x) return a.x - b.x
    return a.id - b.id
  })

  let row = 0
  let nextCol: 0 | 1 = 0

  return sorted.map((graph) => {
    const width = graph.w === 2 ? 2 : 1

    if (width === 2) {
      if (nextCol === 1) {
        row += 1
        nextCol = 0
      }

      const packed = {
        ...graph,
        x: 0,
        y: row,
        w: 2,
      }

      row += 1
      return packed
    }

    if (nextCol === 0) {
      nextCol = 1
      return {
        ...graph,
        x: 0,
        y: row,
        w: 1,
      }
    }

    const packed = {
      ...graph,
      x: 1,
      y: row,
      w: 1,
    }

    row += 1
    nextCol = 0
    return packed
  })
}

const BYPASS_AUTH = process.env.NEXT_PUBLIC_BYPASS_AUTH === "true"

const resolveGraphType = (rawType: unknown): GraphType => {
  return rawType === "bar" || rawType === "line" || rawType === "dial" || rawType === "blank"
    ? rawType
    : "blank"
}

const normalizeGraphConfig = (
  rawConfig: unknown,
  type: GraphType,
  columns: string[] = [],
  numericColumns: string[] = []
): GraphConfig => {
  const defaults = createDefaultGraphConfig(type)
  const config = typeof rawConfig === "object" && rawConfig !== null ? rawConfig as Partial<GraphConfig> : {}

  const firstColumn = columns[0] ?? ""
  const firstNumeric = numericColumns[0] ?? ""

  const base: GraphConfig = {
    ...defaults,
    ...config,
    title: typeof config.title === "string" && config.title.trim().length ? config.title : defaults.title,
    dataFile: typeof config.dataFile === "string" && config.dataFile.trim().length ? config.dataFile : DEFAULT_CSV_FILE,
  }

  if (type === "line" || type === "bar") {
    const xKey = typeof config.xKey === "string" && config.xKey.length ? config.xKey : firstColumn
    const rawYKeys = Array.isArray(config.yKeys) ? config.yKeys.map((key) => String(key)).filter((key) => key.length > 0) : []
    const yKeys = rawYKeys.length ? rawYKeys : (firstNumeric ? [firstNumeric] : [])
    return {
      ...base,
      xKey,
      yKeys,
    }
  }

  if (type === "dial") {
    const valueKey = typeof config.valueKey === "string" && config.valueKey.length ? config.valueKey : firstNumeric
    return {
      ...base,
      valueKey,
      min: typeof config.min === "number" ? config.min : undefined,
      max: typeof config.max === "number" ? config.max : undefined,
    }
  }

  return base
}

const createDefaultFormState = (columns: string[], numericColumns: string[]): GraphFormState => {
  const firstColumn = columns[0] ?? ""
  const firstYAxisColumn = columns.find((column) => column !== firstColumn) ?? firstColumn
  const firstNumeric = numericColumns[0] ?? ""

  return {
    type: "line",
    title: "Line Chart",
    dataFile: DEFAULT_CSV_FILE,
    xKey: firstColumn,
    yKeys: firstYAxisColumn ? [firstYAxisColumn] : [],
    valueKey: firstNumeric || firstYAxisColumn,
    min: "",
    max: "",
  }
}

const parseOptionalNumber = (value: string) => {
  const trimmed = value.trim()
  if (!trimmed.length) return undefined
  const parsed = Number.parseFloat(trimmed)
  return Number.isFinite(parsed) ? parsed : undefined
}

const toDashboardData = (rawPresets: unknown): DashboardData | null => {
  if (!rawPresets) return null

  let parsed: unknown = rawPresets
  if (typeof rawPresets === "string") {
    try {
      parsed = JSON.parse(rawPresets)
    } catch {
      return null
    }
  }

  if (!parsed || typeof parsed !== "object") return null

  const result: DashboardData = {}

  for (const [tabName, tabData] of Object.entries(parsed as Record<string, unknown>)) {
    const maybeGraphs = (tabData as { graphs?: unknown })?.graphs
    if (!Array.isArray(maybeGraphs)) continue

    const graphs: GraphItem[] = maybeGraphs.map((item, index) => {
      const graph = item as Partial<GraphItem>
      const type = resolveGraphType(graph.type)
      const id = Number(graph.id)
      const x = Number(graph.x)
      const y = Number(graph.y)
      const w = Number(graph.w)

      return {
        type,
        id: Number.isFinite(id) ? id : index + 1,
        x: Number.isFinite(x) ? x : 0,
        y: Number.isFinite(y) ? y : 0,
        w: Number.isFinite(w) && (w === 1 || w === 2) ? w : 1,
        config: normalizeGraphConfig((item as { config?: unknown }).config, type),
      }
    })

    result[tabName] = { graphs }
  }

  return Object.keys(result).length ? result : null
}

export default function DashboardPage() {
  const permanentTabs = ["POWERTRAIN", "EMBEDDED", "BATTERY"]
  const { addNotification } = useNotifications();
  const hasAddedNotification = useRef(false);
  const gridContainerRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<GridStack | null>(null)
  const saveQueueRef = useRef(Promise.resolve())
  const activeTabRef = useRef("POWERTRAIN")
  const hasLoadedInitialDataRef = useRef(false)
  const [activeTab, setActiveTab] = useState("POWERTRAIN")
  const [displayName, setDisplayName] = useState("Driver")
  const [dashboardData, setDashboardData] = useState<DashboardData>(() => cloneDefaultDashboardData())
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false)
  const [editingGraphId, setEditingGraphId] = useState<number | null>(null)
  const [formState, setFormState] = useState<GraphFormState>(() => createDefaultFormState([], []))
  const { rows: csvRows, columns, numericColumns, loading: csvLoading, error: csvError } = useCsvDataset(DEFAULT_CSV_FILE)

  useEffect(() => {
    activeTabRef.current = activeTab
  }, [activeTab])

  useEffect(() => {
    if (!columns.length) return

    setDashboardData((prev) => {
      let changed = false
      const next: DashboardData = {}

      Object.entries(prev).forEach(([tabName, tab]) => {
        const nextGraphs = tab.graphs.map((graph) => {
          const normalizedConfig = normalizeGraphConfig(graph.config, graph.type, columns, numericColumns)
          const didChange = JSON.stringify(normalizedConfig) !== JSON.stringify(graph.config)

          if (didChange) {
            changed = true
            return {
              ...graph,
              config: normalizedConfig,
            }
          }

          return graph
        })

        next[tabName] = { graphs: nextGraphs }
      })

      return changed ? next : prev
    })
  }, [columns, numericColumns])

  const fetchGraphData = async (): Promise<DashboardData | null> => {
    const response = await fetch("/api/graphdata", {
      method: "GET",
      cache: "no-store",
    })

    if (!response.ok) {
      return null
    }

    const payload = (await response.json()) as GraphDataResponse
    return toDashboardData(payload.data)
  }

  useEffect(() => {
    let ignore = false

    const loadUser = async () => {
      if (BYPASS_AUTH) {
        const fallbackData = (await fetchGraphData()) ?? cloneDefaultDashboardData()
        const fallbackTabs = Object.keys(fallbackData)
        const fallbackCustomTabs = fallbackTabs.filter((tab) => !permanentTabs.includes(tab))

        if (!ignore) {
          localStorage.setItem("dashboardTabs", JSON.stringify(fallbackTabs))
          localStorage.setItem("dashboardCustomTabs", JSON.stringify(fallbackCustomTabs))
          window.dispatchEvent(new Event("dashboard-tabs-updated"))
          setDisplayName("Dev Mode")
          setDashboardData(fallbackData)
          setActiveTab((prev) => (fallbackTabs.includes(prev) ? prev : fallbackTabs[0] ?? "POWERTRAIN"))
          hasLoadedInitialDataRef.current = true
        }
        return
      }

      try {
        const response = await fetch("/api/me", {
          method: "GET",
          cache: "no-store",
        })

        if (response.status === 401) {
          window.location.href = "/login"
          return
        }

        if (!response.ok) {
          window.location.href = "/login?error=backend_unavailable"
          return
        }

        const user = (await response.json()) as MeResponse
        const name = user.discord_name || user.discord_username || "Driver"
        const fileDashboardData = await fetchGraphData()
        const presetDashboardData = toDashboardData(user.presets)
        const nextDashboardData = fileDashboardData ?? presetDashboardData ?? cloneDefaultDashboardData()
        const tabNames = Object.keys(nextDashboardData)
        const customTabNames = tabNames.filter((tab) => !permanentTabs.includes(tab))

        if (ignore) return

        localStorage.setItem("dashboardTabs", JSON.stringify(tabNames))
        localStorage.setItem("dashboardCustomTabs", JSON.stringify(customTabNames))
        window.dispatchEvent(new Event("dashboard-tabs-updated"))

        setDisplayName(name)
        setDashboardData(nextDashboardData)
        setActiveTab((prev) => (tabNames.includes(prev) ? prev : tabNames[0] ?? "POWERTRAIN"))
        hasLoadedInitialDataRef.current = true
      } catch (error) {
        console.error("Failed to load user profile from /api/me", error)
        window.location.href = "/login?error=backend_unavailable"
      }
    }

    loadUser()

    return () => {
      ignore = true
    }
  }, [])

  const tabs = Object.keys(dashboardData)

  useEffect(() => {
    if (!tabs.length) return
    if (!tabs.includes(activeTab)) {
      setActiveTab(tabs[0])
    }
  }, [activeTab, tabs])

  const addGraph = () => {
    const defaultForm = createDefaultFormState(columns, numericColumns)
    setFormState(defaultForm)
    setEditingGraphId(null)
    setIsConfigModalOpen(true)
  }

  const editGraph = (graph: GraphItem) => {
    const config = normalizeGraphConfig(graph.config, graph.type, columns, numericColumns)

    setFormState({
      type: graph.type,
      title: config.title,
      dataFile: config.dataFile,
      xKey: config.xKey ?? "",
      yKeys: config.yKeys ?? [],
      valueKey: config.valueKey ?? "",
      min: config.min === undefined ? "" : String(config.min),
      max: config.max === undefined ? "" : String(config.max),
    })
    setEditingGraphId(graph.id)
    setIsConfigModalOpen(true)
  }

  const saveGraphConfig = () => {
    const title = formState.title.trim() || `${formState.type.toUpperCase()} Chart`
    const xKey = formState.xKey.trim()
    const yKeys = formState.yKeys.filter((key) => key.trim().length > 0)
    const valueKey = formState.valueKey.trim()

    if ((formState.type === "line" || formState.type === "bar") && (!xKey || !yKeys.length)) {
      return
    }

    if (formState.type === "dial" && !valueKey) {
      return
    }

    const config: GraphConfig = {
      title,
      dataFile: formState.dataFile || DEFAULT_CSV_FILE,
    }

    if (formState.type === "line") {
      config.xKey = xKey
      config.yKeys = yKeys
    } else if (formState.type === "bar") {
      config.xKey = xKey
      config.yKeys = [yKeys[0]]
    } else if (formState.type === "dial") {
      config.valueKey = valueKey
      config.min = parseOptionalNumber(formState.min)
      config.max = parseOptionalNumber(formState.max)
    }

    setDashboardData((prev) => {
      const currentTab = activeTabRef.current
      const tab = prev[currentTab]
      if (!tab) return prev

      if (editingGraphId !== null) {
        const nextGraphs = tab.graphs.map((graph) => {
          if (graph.id !== editingGraphId) return graph

          return {
            ...graph,
            type: formState.type,
            config,
          }
        })

        return {
          ...prev,
          [currentTab]: {
            ...tab,
            graphs: packGraphs(nextGraphs),
          },
        }
      }

      const newGraph: GraphItem = {
        ...createBlankGraph(tab.graphs),
        type: formState.type,
        config,
      }

      return {
        ...prev,
        [currentTab]: {
          ...tab,
          graphs: packGraphs([...tab.graphs, newGraph]),
        },
      }
    })

    setIsConfigModalOpen(false)
    setEditingGraphId(null)
  }

  const removeGraph = (graphId: number) => {
    setDashboardData((prev) => {
      const currentTab = activeTabRef.current
      const tab = prev[currentTab]
      if (!tab) return prev

      const nextGraphs = tab.graphs.filter((graph) => graph.id !== graphId)
      if (nextGraphs.length === tab.graphs.length) return prev

      return {
        ...prev,
        [currentTab]: {
          ...tab,
          graphs: packGraphs(nextGraphs),
        },
      }
    })
  }

  useEffect(() => {
    const onTabSelected = (event: Event) => {
      const selected = (event as CustomEvent<string>).detail
      if (typeof selected === "string" && tabs.includes(selected)) {
        setActiveTab(selected)
      }
    }

    const onTabRenamed = (event: Event) => {
      const detail = (event as CustomEvent<{ oldName?: string; newName?: string }>).detail
      const oldName = String(detail?.oldName ?? "").trim()
      const newName = String(detail?.newName ?? "").trim()

      if (!oldName || !newName || oldName === newName) return

      setDashboardData((prev) => {
        const source = prev[oldName]
        if (!source) return prev

        const next: DashboardData = { ...prev }
        next[newName] = { graphs: cloneGraphs(source.graphs) }
        delete next[oldName]
        return next
      })
    }

    const onTabsUpdated = (event: Event) => {
      const requestedTabs = (event as CustomEvent<string[]>).detail
      if (!Array.isArray(requestedTabs) || !requestedTabs.length) return

      const cleanedTabs = requestedTabs
        .map((value) => String(value).trim())
        .filter((value) => value.length > 0)

      if (!cleanedTabs.length) return

      setDashboardData((prev) => {
        const next: DashboardData = {}
        cleanedTabs.forEach((tab) => {
          next[tab] = prev[tab]
            ? { graphs: cloneGraphs(prev[tab].graphs) }
            : {
                graphs: [createBlankGraph([])],
              }
        })
        return next
      })

      setActiveTab((prev) => (cleanedTabs.includes(prev) ? prev : cleanedTabs[0]))
    }

    window.addEventListener("dashboard-tab-selected", onTabSelected)
    window.addEventListener("dashboard-tab-renamed", onTabRenamed)
    window.addEventListener("dashboard-tabs-updated", onTabsUpdated)
    return () => {
      window.removeEventListener("dashboard-tab-selected", onTabSelected)
      window.removeEventListener("dashboard-tab-renamed", onTabRenamed)
      window.removeEventListener("dashboard-tabs-updated", onTabsUpdated)
    }
  }, [tabs])

  useEffect(() => {
    if (!hasLoadedInitialDataRef.current) return

    const timer = setTimeout(() => {
      const snapshot = JSON.stringify({ data: dashboardData })
      saveQueueRef.current = saveQueueRef.current
        .catch(() => {
          // Keep queue alive after a failed request.
        })
        .then(async () => {
          try {
            const response = await fetch("/api/graphdata", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: snapshot,
            })

            if (!response.ok) {
              const errorText = await response.text()
              console.error("Failed to persist graphdata.json", response.status, errorText)
            }
          } catch (error) {
            console.error("Failed to persist graphdata.json", error)
          }
        })
    }, 200)

    return () => clearTimeout(timer)
  }, [dashboardData])

  // Automated notifications based on code compilation status
  useEffect(() => {
    // Prevent double execution in development mode
    if (hasAddedNotification.current) return;
    hasAddedNotification.current = true;

    // Simulated compilation status - you can replace this with actual compilation checks
    const checkCompilationStatus = () => {
      // For now, we'll hardcode a successful compilation
      // You can replace this with actual logic to detect errors
      const hasCompileError = false; // Set to true to test error notification
      const hasWarning = false; // Set to true to test warning notification
      const hasRuntimeError = false; // Set to true to test notice notification

      if (hasCompileError) {
        // RED: Compilation error
        addNotification({
          type: 'error',
          title: 'Compilation Error',
          content: 'Your code failed to compile. Click for details.',
          link: '#compile-error-details'
        });
      } else if (hasWarning) {
        // WARNING: Code has warnings but compiles
        addNotification({
          type: 'warning',
          title: 'Compilation Warning',
          content: 'Code compiled with warnings. Review recommended.',
          link: '#warning-details'
        });
      } else if (hasRuntimeError) {
        // NOTICE: Code compiles but has runtime errors
        addNotification({
          type: 'notice',
          title: 'Runtime Notice',
          content: 'Code compiled but encountered runtime issues.',
          link: '#runtime-error-details'
        });
      } else {
        // GREEN: Successful compilation
        addNotification({
          type: 'success',
          title: 'Compilation Success',
          content: 'Your code compiled and ran successfully!',
          link: '#success-details'
        });
      }
    };

    // Check compilation status after a small delay
    const timer = setTimeout(() => {
      checkCompilationStatus();
    }, 200);

    return () => clearTimeout(timer);
  }, [addNotification]);

  useEffect(() => {
    if (!gridContainerRef.current) return

    const grid = GridStack.init(
      {
        column: 2,
        cellHeight: 680,
        margin: 16,
        float: false,
        animate: false,
        handle: '.drag-handle',
      },
      gridContainerRef.current
    )
    gridRef.current = grid

    const snapNode = (node: GridStackNode) => {
      const targetWidth = (node.w ?? 1) >= 2 ? 2 : 1
      const targetX = targetWidth === 2 ? 0 : (node.x ?? 0) >= 1 ? 1 : 0

      return {
        targetWidth,
        targetX,
      }
    }

    const enforceTileBounds = (items?: GridStackNode[]) => {
      const nodes = items?.length ? items : grid.engine.nodes

      nodes.forEach((node) => {
        if (!node.el) return

        const { targetWidth, targetX } = snapNode(node)
        const needsUpdate =
          node.x !== targetX ||
          node.w !== targetWidth ||
          node.h !== 1 ||
          node.minW !== 1 ||
          node.maxW !== 2 ||
          node.minH !== 1 ||
          node.maxH !== 1

        if (!needsUpdate) return

        grid.update(node.el, {
          x: targetX,
          w: targetWidth,
          h: 1,
          minW: 1,
          maxW: 2,
          minH: 1,
          maxH: 1,
        })
      })
    }

    const syncGraphsFromGrid = (items?: GridStackNode[]) => {
      const nodes = items?.length ? items : grid.engine.nodes
      const layoutById = new Map<number, { x: number; y: number; w: number }>()

      nodes.forEach((node) => {
        const rawId = node.id ?? node.el?.getAttribute("gs-id")
        const id = Number(rawId)
        if (!Number.isFinite(id)) return

        layoutById.set(id, {
          x: node.x ?? 0,
          y: node.y ?? 0,
          w: node.w ?? 1,
        })
      })

      if (!layoutById.size) return

      setDashboardData((prev) => {
        const currentTab = activeTabRef.current
        const tab = prev[currentTab]
        if (!tab) return prev

        let changed = false
        const updatedGraphs = tab.graphs.map((graph) => {
          const updated = layoutById.get(graph.id)
          if (!updated) return graph

          if (graph.x === updated.x && graph.y === updated.y && graph.w === updated.w) {
            return graph
          }

          changed = true
          return {
            ...graph,
            x: updated.x,
            y: updated.y,
            w: updated.w,
          }
        })

        const packedGraphs = packGraphs(updatedGraphs)
        const sameAsCurrent =
          !changed &&
          packedGraphs.length === tab.graphs.length &&
          packedGraphs.every((graph, index) => {
            const current = tab.graphs[index]
            return current && current.id === graph.id && current.x === graph.x && current.y === graph.y && current.w === graph.w
          })

        if (sameAsCurrent) return prev

        return {
          ...prev,
          [currentTab]: {
            ...tab,
            graphs: packedGraphs,
          },
        }
      })
    }

    enforceTileBounds()
    syncGraphsFromGrid()
    grid.on("dragstart", () => {
      document.body.classList.add("dashboard-dragging")
    })
    grid.on("change", (_event, items) => {
      enforceTileBounds(items)
      syncGraphsFromGrid(items)
    })
    grid.on("dragstop", (_event, el) => {
      const node = (el as GridItemHTMLElement).gridstackNode
      if (!node) return
      enforceTileBounds([node])
      syncGraphsFromGrid([node])
    })
    grid.on("resizestop", (_event, el) => {
      const node = (el as GridItemHTMLElement).gridstackNode
      if (!node) return
      enforceTileBounds([node])
      syncGraphsFromGrid([node])
    })
    grid.on("dropped", (_event, _prevNode, newNode) => {
      if (!newNode) return
      enforceTileBounds([newNode])
      syncGraphsFromGrid([newNode])
    })
    grid.on("dragstop", () => {
      document.body.classList.remove("dashboard-dragging")
    })

    return () => {
      document.body.classList.remove("dashboard-dragging")
      gridRef.current = null
      grid.off("change")
      grid.off("dragstart")
      grid.off("dragstop")
      grid.off("resizestop")
      grid.off("dropped")
      grid.destroy(false)
    }
  }, [])

  useEffect(() => {
    const grid = gridRef.current
    const container = gridContainerRef.current
    if (!grid || !container) return

    const widgets = Array.from(container.querySelectorAll<HTMLElement>(".grid-stack-item"))

    widgets.forEach((widget) => {
      const alreadyRegistered = Boolean((widget as GridItemHTMLElement).gridstackNode)
      if (!alreadyRegistered) {
        grid.makeWidget(widget)
      }
    })

    grid.compact()

    const layoutById = new Map<number, { x: number; y: number; w: number }>()
    grid.engine.nodes.forEach((node) => {
      const rawId = node.id ?? node.el?.getAttribute("gs-id")
      const id = Number(rawId)
      if (!Number.isFinite(id)) return

      layoutById.set(id, {
        x: node.x ?? 0,
        y: node.y ?? 0,
        w: node.w ?? 1,
      })
    })

    if (!layoutById.size) return

    setDashboardData((prev) => {
      const tab = prev[activeTab]
      if (!tab) return prev

      let changed = false
      const nextGraphs = tab.graphs.map((graph) => {
        const next = layoutById.get(graph.id)
        if (!next) return graph

        if (graph.x === next.x && graph.y === next.y && graph.w === next.w) {
          return graph
        }

        changed = true
        return {
          ...graph,
          x: next.x,
          y: next.y,
          w: next.w,
        }
      })

      if (!changed) return prev

      return {
        ...prev,
        [activeTab]: {
          ...tab,
          graphs: packGraphs(nextGraphs),
        },
      }
    })
  }, [activeTab, dashboardData])

  const activeGraphs = dashboardData[activeTab]?.graphs ?? []

  return (
    <main className="flex h-full w-full flex-col gap-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <span className="text-black text-[50px]">Welcome, {displayName}</span>
          <ButtonAddFilter onClick={addGraph} title="Add new graph" />
        </div>
        <Chatbot />
      </div>

      {csvError && (
        <div className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700">
          Failed to load CSV data: {csvError}
        </div>
      )}

      <div ref={gridContainerRef} className="grid-stack dashboard-grid w-full">
        {activeGraphs.map((graph) => {
          if (graph.type === "blank") {
            return (
              <BlankGraph
                key={graph.id}
                id={String(graph.id)}
                x={graph.x}
                y={graph.y}
                w={graph.w}
                onAddGraph={addGraph}
                onEdit={() => editGraph(graph)}
                onDelete={() => removeGraph(graph.id)}
              />
            )
          }

          if (graph.type === "bar") {
            return (
              <BarChartComponent
                key={graph.id}
                id={String(graph.id)}
                x={graph.x}
                y={graph.y}
                w={graph.w}
                config={graph.config}
                rows={csvRows}
                onEdit={() => editGraph(graph)}
                onDelete={() => removeGraph(graph.id)}
              />
            )
          }

          if (graph.type === "line") {
            return (
              <LineChartComponent
                key={graph.id}
                id={String(graph.id)}
                x={graph.x}
                y={graph.y}
                w={graph.w}
                config={graph.config}
                rows={csvRows}
                onEdit={() => editGraph(graph)}
                onDelete={() => removeGraph(graph.id)}
              />
            )
          }

          if (graph.type === "dial") {
            return (
              <DialChartComponent
                key={graph.id}
                id={String(graph.id)}
                x={graph.x}
                y={graph.y}
                w={graph.w}
                config={graph.config}
                rows={csvRows}
                onEdit={() => editGraph(graph)}
                onDelete={() => removeGraph(graph.id)}
              />
            )
          }

          return (
            <BlankGraph
              key={graph.id}
              id={String(graph.id)}
              x={graph.x}
              y={graph.y}
              w={graph.w}
              onAddGraph={addGraph}
              onEdit={() => editGraph(graph)}
              onDelete={() => removeGraph(graph.id)}
            />
          )
        })}
      </div>

      <MemoizedGraphConfigModal
        isOpen={isConfigModalOpen}
        isEditing={editingGraphId !== null}
        state={formState}
        setState={setFormState}
        columns={columns}
        numericColumns={numericColumns}
        loading={csvLoading}
        onCancel={() => {
          setIsConfigModalOpen(false)
          setEditingGraphId(null)
        }}
        onSave={saveGraphConfig}
      />

      {/* Hidden anchor points for notification links */}
      <div id="compile-error-details" className="hidden"></div>
      <div id="warning-details" className="hidden"></div>
      <div id="runtime-error-details" className="hidden"></div>
      <div id="success-details" className="hidden"></div>
    </main>
  )
}

type GraphConfigModalProps = {
  isOpen: boolean
  isEditing: boolean
  state: GraphFormState
  setState: React.Dispatch<React.SetStateAction<GraphFormState>>
  columns: string[]
  numericColumns: string[]
  loading: boolean
  onSave: () => void
  onCancel: () => void
}

function GraphConfigModal({
  isOpen,
  isEditing,
  state,
  setState,
  columns,
  numericColumns,
  loading,
  onSave,
  onCancel,
}: GraphConfigModalProps) {
  if (!isOpen) return null

  const requiresXY = state.type === "line" || state.type === "bar"
  const canSave = state.title.trim().length > 0 && (
    (requiresXY && state.xKey && state.yKeys.length > 0) ||
    (state.type === "dial" && state.valueKey.length > 0) ||
    state.type === "blank"
  )

  return (
    <div className="fixed inset-0 z-[11000] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-xl rounded-xl border border-white/10 bg-neutral-900 p-6 text-white shadow-xl">
        <h2 className="text-xl font-semibold">{isEditing ? "Edit Graph" : "Add Graph"}</h2>
        <p className="mt-1 text-sm text-white/70">Choose chart type and axis mappings from {DEFAULT_CSV_FILE}.</p>

        <div className="mt-5 grid gap-4">
          <label className="grid gap-1 text-sm">
            <span>Graph Type</span>
            <select
              value={state.type}
              className="rounded-md border border-white/20 bg-black px-3 py-2"
              onChange={(event) => {
                const nextType = event.target.value as GraphType
                setState((prev) => ({
                  ...prev,
                  type: nextType,
                  title: prev.title || `${nextType.toUpperCase()} Chart`,
                  yKeys: nextType === "dial" ? [] : prev.yKeys,
                }))
              }}
            >
              <option value="line">Line</option>
              <option value="bar">Bar</option>
              <option value="dial">Dial</option>
            </select>
          </label>

          <label className="grid gap-1 text-sm">
            <span>Title</span>
            <input
              value={state.title}
              className="rounded-md border border-white/20 bg-black px-3 py-2"
              onChange={(event) => setState((prev) => ({ ...prev, title: event.target.value }))}
            />
          </label>

          {requiresXY && (
            <>
              <label className="grid gap-1 text-sm">
                <span>X Axis (single)</span>
                <select
                  value={state.xKey}
                  className="rounded-md border border-white/20 bg-black px-3 py-2"
                  onChange={(event) => setState((prev) => ({ ...prev, xKey: event.target.value }))}
                >
                  <option value="">Select an X axis</option>
                  {columns.map((column) => (
                    <option key={column} value={column}>{column}</option>
                  ))}
                </select>
              </label>

              <div className="grid gap-2 text-sm">
                <span>{state.type === "bar" ? "Y Axis (single)" : "Y Axes (multi-select)"}</span>
                <div className="max-h-32 overflow-y-auto rounded-md border border-white/20 bg-black p-2">
                  {columns.filter((column) => column !== state.xKey).map((column) => {
                    const checked = state.yKeys.includes(column)
                    return (
                      <label key={column} className="flex items-center gap-2 py-1">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(event) => {
                            const isChecked = event.target.checked
                            setState((prev) => {
                              if (state.type === "bar") {
                                return {
                                  ...prev,
                                  yKeys: isChecked ? [column] : [],
                                }
                              }

                              const nextSet = new Set(prev.yKeys)
                              if (isChecked) nextSet.add(column)
                              else nextSet.delete(column)
                              return {
                                ...prev,
                                yKeys: Array.from(nextSet),
                              }
                            })
                          }}
                        />
                        <span>{column}</span>
                      </label>
                    )
                  })}
                  {!columns.length && <p className="text-white/70">No columns detected.</p>}
                </div>
              </div>
            </>
          )}

          {state.type === "dial" && (
            <>
              <label className="grid gap-1 text-sm">
                <span>Value Axis</span>
                <select
                  value={state.valueKey}
                  className="rounded-md border border-white/20 bg-black px-3 py-2"
                  onChange={(event) => setState((prev) => ({ ...prev, valueKey: event.target.value }))}
                >
                  <option value="">Select a value axis</option>
                  {columns.map((column) => (
                    <option key={column} value={column}>{column}</option>
                  ))}
                </select>
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="grid gap-1 text-sm">
                  <span>Min (optional)</span>
                  <input
                    value={state.min}
                    placeholder="Auto"
                    className="rounded-md border border-white/20 bg-black px-3 py-2"
                    onChange={(event) => setState((prev) => ({ ...prev, min: event.target.value }))}
                  />
                </label>
                <label className="grid gap-1 text-sm">
                  <span>Max (optional)</span>
                  <input
                    value={state.max}
                    placeholder="Auto"
                    className="rounded-md border border-white/20 bg-black px-3 py-2"
                    onChange={(event) => setState((prev) => ({ ...prev, max: event.target.value }))}
                  />
                </label>
              </div>
            </>
          )}
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            className="rounded-md border border-white/20 px-4 py-2 text-sm text-white/85"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="rounded-md bg-orange-500 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            disabled={loading || !canSave}
            onClick={onSave}
          >
            {isEditing ? "Save" : "Add Graph"}
          </button>
        </div>
      </div>
    </div>
  )
}

const MemoizedGraphConfigModal = memo(GraphConfigModal)