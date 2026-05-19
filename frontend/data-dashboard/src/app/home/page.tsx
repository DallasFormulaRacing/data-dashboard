"use client"

import { useNotifications } from "@/components/ui/9dab3a/Notification"
import { Chatbot } from "@/components/ui/9dab3a/Chatbot"
import ButtonAddFilter from "@/components/ui/30c4e3/ButtonAddFilter"
import { Button } from "@/components/ui/button"
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

const getNextGraphPosition = (graphs: GraphItem[]): { x: number; y: number } => {
  if (graphs.length === 0) {
    return { x: 0, y: 0 }
  }

  let maxY = 0
  graphs.forEach((g) => {
    const bottom = g.y + (g.h ?? 1)
    if (bottom > maxY) {
      maxY = bottom
    }
  })

  const isOccupied = (x: number, y: number) => {
    return graphs.some((g) => {
      const gX = g.x
      const gY = g.y
      const gW = g.w
      const gH = g.h ?? 1
      return x >= gX && x < gX + gW && y >= gY && y < gY + gH
    })
  }

  // Check last row right column
  if (maxY > 0 && !isOccupied(1, maxY - 1)) {
    return { x: 1, y: maxY - 1 }
  }

  // Check last row left column
  if (maxY > 0 && !isOccupied(0, maxY - 1)) {
    return { x: 0, y: maxY - 1 }
  }

  // New row, left column
  return { x: 0, y: maxY }
}

const createBlankGraph = (graphs: GraphItem[]): GraphItem => {
  const pos = getNextGraphPosition(graphs)
  return {
    type: "blank",
    id: getNextGraphId(graphs),
    x: pos.x,
    y: pos.y,
    w: 1,
    h: 1,
    config: createDefaultGraphConfig("blank"),
  }
}

const packGraphs = (graphs: GraphItem[]): GraphItem[] => {
  return [...graphs]
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
    title: "",
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
      const h = Number(graph.h)

      return {
        type,
        id: Number.isFinite(id) ? id : index + 1,
        x: Number.isFinite(x) ? x : 0,
        y: Number.isFinite(y) ? y : 0,
        w: Number.isFinite(w) && (w === 1 || w === 2) ? w : 1,
        h: Number.isFinite(h) && h >= 1 ? h : 1,
        config: normalizeGraphConfig((item as { config?: unknown }).config, type),
      }
    })

    result[tabName] = { graphs }
  }

  return Object.keys(result).length ? result : null
}

const toTitleCase = (str: string) => {
  if (!str) return ""
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
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
  const [isFirstLoad, setIsFirstLoad] = useState(true)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const hasLoaded = sessionStorage.getItem("dashboard_has_loaded")
      if (hasLoaded) {
        setIsFirstLoad(false)
      } else {
        sessionStorage.setItem("dashboard_has_loaded", "true")
        setIsFirstLoad(true)
      }
    }
  }, [])

  useEffect(() => {
    activeTabRef.current = activeTab
  }, [activeTab])

  useEffect(() => {
    const onPresetClicked = () => setIsFirstLoad(false)
    window.addEventListener("dashboard-preset-clicked", onPresetClicked)
    return () => window.removeEventListener("dashboard-preset-clicked", onPresetClicked)
  }, [])

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

  const clearPreset = () => {
    const confirmed = window.confirm(`Are you sure you want to clear all graphs from the preset "${toTitleCase(activeTab)}"?`)
    if (!confirmed) return

    setDashboardData((prev) => {
      const currentTab = activeTabRef.current
      const tab = prev[currentTab]
      if (!tab) return prev

      return {
        ...prev,
        [currentTab]: {
          ...tab,
          graphs: [],
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
                graphs: [],
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
        cellHeight: 340,
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
          node.minW !== 1 ||
          node.maxW !== 2 ||
          node.minH !== 1

        if (!needsUpdate) return

        grid.update(node.el, {
          x: targetX,
          w: targetWidth,
          minW: 1,
          maxW: 2,
          minH: 1,
        })
      })
    }

    const syncGraphsFromGrid = (items?: GridStackNode[]) => {
      const nodes = items?.length ? items : grid.engine.nodes
      const layoutById = new Map<number, { x: number; y: number; w: number; h: number }>()

      nodes.forEach((node) => {
        const rawId = node.id ?? node.el?.getAttribute("gs-id")
        const id = Number(rawId)
        if (!Number.isFinite(id)) return

        layoutById.set(id, {
          x: node.x ?? 0,
          y: node.y ?? 0,
          w: node.w ?? 1,
          h: node.h ?? 1,
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

          if (graph.x === updated.x && graph.y === updated.y && graph.w === updated.w && (graph.h ?? 1) === updated.h) {
            return graph
          }

          changed = true
          return {
            ...graph,
            x: updated.x,
            y: updated.y,
            w: updated.w,
            h: updated.h,
          }
        })

        const packedGraphs = packGraphs(updatedGraphs)
        const sameAsCurrent =
          !changed &&
          packedGraphs.length === tab.graphs.length &&
          packedGraphs.every((graph, index) => {
            const current = tab.graphs[index]
            return current && current.id === graph.id && current.x === graph.x && current.y === graph.y && current.w === graph.w && (current.h ?? 1) === (graph.h ?? 1)
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
    const currentWidgetSet = new Set(widgets)

    // Remove nodes from GridStack engine if React has unmounted their DOM elements
    grid.engine.nodes.forEach((node) => {
      if (node.el && !currentWidgetSet.has(node.el)) {
        grid.removeWidget(node.el, false)
      }
    })

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
        <div className="flex items-center gap-2">
          <span className="text-black text-[50px] font-['Questrial'] font-bold leading-none mr-2">
            {isFirstLoad ? `Welcome, ${displayName}` : toTitleCase(activeTab)}
          </span>
          <ButtonAddFilter onClick={addGraph} title="Add new graph" />
          {!["POWERTRAIN", "EMBEDDED", "BATTERY"].includes(activeTab.toUpperCase()) && (
            <Button
              type="button"
              title="Clear preset"
              variant="outline"
              className="h-[30px] w-[30px] rounded-md border border-neutral-300 bg-white text-neutral-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200 active:bg-red-100 font-semibold p-0 shadow-xs flex items-center justify-center transition-all duration-150 cursor-pointer"
              onClick={clearPreset}
            >
              <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            </Button>
          )}
        </div>
        <Chatbot />
      </div>

      {csvError && (
        <div className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700">
          Failed to load CSV data: {csvError}
        </div>
      )}

      <div 
        ref={gridContainerRef} 
        className={`grid-stack dashboard-grid w-full ${activeGraphs.filter((graph) => graph.type !== "blank").length === 0 ? "hidden" : ""}`}
      >
        {activeGraphs.filter((graph) => graph.type !== "blank").map((graph) => {
          if (graph.type === "bar") {
            return (
              <BarChartComponent
                key={graph.id}
                id={String(graph.id)}
                x={graph.x}
                y={graph.y}
                w={graph.w}
                h={graph.h}
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
                h={graph.h}
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
                h={graph.h}
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
              h={graph.h}
              onAddGraph={addGraph}
              onEdit={() => editGraph(graph)}
              onDelete={() => removeGraph(graph.id)}
            />
          )
        })}
      </div>

      {activeGraphs.filter((graph) => graph.type !== "blank").length === 0 && (
        <button
          type="button"
          onClick={addGraph}
          className="w-full h-[680px] border-2 border-dashed border-neutral-300 dark:border-neutral-800 rounded-[2rem] bg-neutral-50/50 hover:bg-neutral-100/50 dark:bg-neutral-900/10 dark:hover:bg-neutral-900/30 cursor-pointer transition-all flex flex-col items-center justify-center gap-4 text-neutral-400 dark:text-neutral-500 group"
        >
          <span className="text-[60px] leading-none font-extralight group-hover:scale-110 transition-transform">+</span>
          <span className="text-xl font-semibold tracking-wide">Add Graph</span>
        </button>
      )}

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
  numericColumns: _numericColumns,
  loading,
  onSave,
  onCancel,
}: GraphConfigModalProps) {
  const [userEditedTitle, setUserEditedTitle] = useState(isEditing)

  const getAutoTitle = (type: GraphType, xKey: string, yKeys: string[], valueKey: string) => {
    if (type === "line" || type === "bar") {
      if (!xKey && !yKeys.length) return ""
      const xPart = xKey || "[X Axis]"
      const yPart = yKeys.length > 0 ? yKeys.join(", ") : "[Y Axis]"
      return `${xPart} by ${yPart}`
    } else if (type === "dial") {
      if (!valueKey) return ""
      return `${valueKey} Gauge`
    }
    return ""
  }

  // Auto-generate title on open if it's empty
  useEffect(() => {
    if (isOpen) {
      if (!isEditing && !state.title) {
        const auto = getAutoTitle(state.type, state.xKey, state.yKeys, state.valueKey)
        setState((prev) => ({
          ...prev,
          title: auto,
        }))
        setUserEditedTitle(false)
      } else {
        setUserEditedTitle(true)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isEditing])

  if (!isOpen) return null

  const requiresXY = state.type === "line" || state.type === "bar"
  const canSave = (
    (requiresXY && state.xKey && state.yKeys.length > 0) ||
    (state.type === "dial" && state.valueKey.length > 0) ||
    state.type === "blank"
  )

  const handleTypeChange = (nextType: GraphType) => {
    setState((prev) => {
      const nextTitle = !userEditedTitle ? getAutoTitle(nextType, prev.xKey, prev.yKeys, prev.valueKey) : prev.title
      return {
        ...prev,
        type: nextType,
        title: nextTitle,
        yKeys: nextType === "dial" ? [] : prev.yKeys,
      }
    })
  }

  const handleXChange = (newX: string) => {
    setState((prev) => {
      const nextTitle = !userEditedTitle ? getAutoTitle(prev.type, newX, prev.yKeys, prev.valueKey) : prev.title
      return {
        ...prev,
        xKey: newX,
        title: nextTitle,
      }
    })
  }

  const handleYChange = (newYKeys: string[]) => {
    setState((prev) => {
      const nextTitle = !userEditedTitle ? getAutoTitle(prev.type, prev.xKey, newYKeys, prev.valueKey) : prev.title
      return {
        ...prev,
        yKeys: newYKeys,
        title: nextTitle,
      }
    })
  }

  const handleValueKeyChange = (newValueKey: string) => {
    setState((prev) => {
      const nextTitle = !userEditedTitle ? getAutoTitle(prev.type, prev.xKey, prev.yKeys, newValueKey) : prev.title
      return {
        ...prev,
        valueKey: newValueKey,
        title: nextTitle,
      }
    })
  }

  return (
    <div className="fixed inset-0 z-[11000] flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-neutral-950 p-6 text-white shadow-2xl flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-150">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{isEditing ? "Edit Graph" : "Add Graph"}</h2>
          <p className="mt-1.5 text-sm text-neutral-400">Choose chart type and map axis fields from {DEFAULT_CSV_FILE}.</p>
        </div>

        {/* 1. Pick between bar, line, dial from visual choices */}
        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-neutral-300">Choose Display Mode</span>
          <div className="grid grid-cols-3 gap-4">
            {(["line", "bar", "dial"] as const).map((t) => {
              const isActive = state.type === t
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleTypeChange(t)}
                  className={`flex flex-col items-center justify-center gap-3 p-4 rounded-xl border text-center transition-all cursor-pointer ${
                    isActive
                      ? "border-orange-500 bg-orange-500/10 text-white shadow-[0_0_15px_rgba(249,115,22,0.15)]"
                      : "border-white/10 hover:border-white/20 bg-white/5 text-neutral-400 hover:text-white"
                  }`}
                >
                  {t === "line" && (
                    <svg className="w-12 h-8" viewBox="0 0 100 50" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M10,40 Q25,10 40,25 T70,10 T90,35" strokeLinecap="round" />
                      <circle cx="10" cy="40" r="3.5" fill="currentColor" />
                      <circle cx="28" cy="18" r="3.5" fill="currentColor" />
                      <circle cx="40" cy="25" r="3.5" fill="currentColor" />
                      <circle cx="55" cy="15" r="3.5" fill="currentColor" />
                      <circle cx="70" cy="10" r="3.5" fill="currentColor" />
                      <circle cx="90" cy="35" r="3.5" fill="currentColor" />
                    </svg>
                  )}
                  {t === "bar" && (
                    <svg className="w-12 h-8" viewBox="0 0 100 50" fill="currentColor">
                      <rect x="15" y="25" width="12" height="20" rx="1.5" />
                      <rect x="35" y="10" width="12" height="35" rx="1.5" />
                      <rect x="55" y="30" width="12" height="15" rx="1.5" />
                      <rect x="75" y="15" width="12" height="30" rx="1.5" />
                    </svg>
                  )}
                  {t === "dial" && (
                    <svg className="w-12 h-8" viewBox="0 0 100 50" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M20,42 A30,30 0 0,1 80,42" strokeLinecap="round" strokeDasharray="3 3" className="opacity-30" />
                      <path d="M20,42 A30,30 0 0,1 68,18" strokeLinecap="round" />
                      <line x1="50" y1="42" x2="62" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      <circle cx="50" cy="42" r="3.5" fill="currentColor" />
                    </svg>
                  )}
                  <span className="text-sm font-semibold capitalize">{t} Chart</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* 2. Two Columns */}
        <div className="grid grid-cols-2 gap-6">
          {/* Left Column: X Axis dropdown, and under it Graph Title */}
          <div className="flex flex-col gap-4">
            {requiresXY ? (
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-neutral-300">X Axis (single)</label>
                <select
                  value={state.xKey}
                  className="w-full h-10 rounded-md border border-white/10 bg-neutral-900 px-3 text-sm focus-visible:border-orange-500 focus-visible:ring-1 focus-visible:ring-orange-500 outline-none transition-all cursor-pointer"
                  onChange={(event) => handleXChange(event.target.value)}
                >
                  <option value="">Select an X axis</option>
                  {columns.map((column) => (
                    <option key={column} value={column}>{column}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-neutral-300">Value Axis</label>
                <select
                  value={state.valueKey}
                  className="w-full h-10 rounded-md border border-white/10 bg-neutral-900 px-3 text-sm focus-visible:border-orange-500 focus-visible:ring-1 focus-visible:ring-orange-500 outline-none transition-all cursor-pointer"
                  onChange={(event) => handleValueKeyChange(event.target.value)}
                >
                  <option value="">Select a value axis</option>
                  {columns.map((column) => (
                    <option key={column} value={column}>{column}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-neutral-300">Graph Title</label>
              <input
                value={state.title}
                placeholder="e.g. RPM by Speed (Auto-generated)"
                className="w-full h-10 rounded-md border border-white/10 bg-neutral-900 px-3 text-sm focus-visible:border-orange-500 focus-visible:ring-1 focus-visible:ring-orange-500 outline-none transition-all"
                onChange={(event) => {
                  const val = event.target.value
                  setState((prev) => ({ ...prev, title: val }))
                  if (val.trim() === "") {
                    setUserEditedTitle(false)
                  } else {
                    setUserEditedTitle(true)
                  }
                }}
              />
            </div>
          </div>

          {/* Right Column: Y Axes (or Min/Max for dial) */}
          <div className="flex flex-col gap-4">
            {state.type === "line" && (
              <div className="flex flex-col gap-1.5 h-full">
                <label className="text-sm font-semibold text-neutral-300">Y Axes (multi-select)</label>
                <div className="flex-1 min-h-[120px] max-h-[170px] overflow-y-auto rounded-md border border-white/10 bg-neutral-900 p-2.5 flex flex-col gap-1">
                  {columns.filter((column) => column !== state.xKey).map((column) => {
                    const checked = state.yKeys.includes(column)
                    return (
                      <label key={column} className="flex items-center gap-2.5 py-1 px-1.5 rounded hover:bg-white/5 cursor-pointer text-sm transition-all select-none">
                        <input
                          type="checkbox"
                          checked={checked}
                          className="rounded border-white/20 bg-neutral-950 text-orange-500 focus:ring-orange-500 h-4 w-4 cursor-pointer"
                          onChange={(event) => {
                            const isChecked = event.target.checked
                            const nextSet = new Set(state.yKeys)
                            if (isChecked) nextSet.add(column)
                            else nextSet.delete(column)
                            handleYChange(Array.from(nextSet))
                          }}
                        />
                        <span className={checked ? "text-white font-medium" : "text-neutral-400"}>{column}</span>
                      </label>
                    )
                  })}
                  {!columns.length && <p className="text-neutral-500 text-xs italic">No columns detected.</p>}
                </div>
              </div>
            )}

            {state.type === "bar" && (
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-neutral-300">Y Axis (single)</label>
                <select
                  value={state.yKeys[0] || ""}
                  className="w-full h-10 rounded-md border border-white/10 bg-neutral-900 px-3 text-sm focus-visible:border-orange-500 focus-visible:ring-1 focus-visible:ring-orange-500 outline-none transition-all cursor-pointer"
                  onChange={(event) => {
                    const val = event.target.value
                    handleYChange(val ? [val] : [])
                  }}
                >
                  <option value="">Select a Y axis</option>
                  {columns.filter((column) => column !== state.xKey).map((column) => (
                    <option key={column} value={column}>{column}</option>
                  ))}
                </select>
              </div>
            )}

            {state.type === "dial" && (
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-neutral-300">Min (optional)</label>
                    <input
                      value={state.min}
                      placeholder="Auto"
                      className="w-full h-10 rounded-md border border-white/10 bg-neutral-900 px-3 text-sm focus-visible:border-orange-500 focus-visible:ring-1 focus-visible:ring-orange-500 outline-none transition-all"
                      onChange={(event) => setState((prev) => ({ ...prev, min: event.target.value }))}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-neutral-300">Max (optional)</label>
                    <input
                      value={state.max}
                      placeholder="Auto"
                      className="w-full h-10 rounded-md border border-white/10 bg-neutral-900 px-3 text-sm focus-visible:border-orange-500 focus-visible:ring-1 focus-visible:ring-orange-500 outline-none transition-all"
                      onChange={(event) => setState((prev) => ({ ...prev, max: event.target.value }))}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
          <button
            type="button"
            className="h-10 rounded-md border border-white/10 px-4 text-sm font-medium text-neutral-400 hover:text-white hover:bg-white/5 cursor-pointer transition-all"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading || !canSave}
            className="h-10 rounded-md bg-orange-500 hover:bg-orange-600 px-5 text-sm font-bold text-white shadow-lg shadow-orange-500/20 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer transition-all flex items-center justify-center"
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