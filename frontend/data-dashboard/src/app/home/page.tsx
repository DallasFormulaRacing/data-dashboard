"use client"

import { useNotifications } from "@/components/ui/9dab3a/Notification"
import { Chatbot } from "@/components/ui/9dab3a/Chatbot"
import { useEffect, useRef, useState } from "react"
import { GridStack, type GridItemHTMLElement, type GridStackNode } from "gridstack"
import graphdata from "public/data/graphdata.json"
import BlankGraph from "@/components/ui/30c4e3/BlankGraph"
import { BarChartComponent } from "@/components/ui/bar-chart"
import { LineChartComponent } from "@/components/ui/line-chart"
import { DialChartComponent } from "@/components/ui/dial-chart"
type GraphItem = {
  type: string
  id: number
  x: number
  y: number
  w: number
}

type DashboardData = {
  [tab: string]: {
    graphs: GraphItem[]
  }
}

export default function DashboardPage() {
  const { addNotification } = useNotifications();
  const hasAddedNotification = useRef(false);
  const gridContainerRef = useRef<HTMLDivElement>(null)
  const activeTab = "POWERTRAIN"
  const [dashboardData, setDashboardData] = useState<DashboardData>(() =>
    JSON.parse(JSON.stringify(graphdata)) as DashboardData
  )

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
        const tab = prev[activeTab]
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

        if (!changed) return prev

        return {
          ...prev,
          [activeTab]: {
            ...tab,
            graphs: updatedGraphs,
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
      grid.off("change")
      grid.off("dragstart")
      grid.off("dragstop")
      grid.off("resizestop")
      grid.off("dropped")
      grid.destroy(false)
    }
  }, [activeTab])

  return (
    <main className="flex h-full w-full flex-col gap-4">
      <div className="flex items-start justify-between">
        <span className="text-black text-[50px]">Welcome, Anhaar</span>
        <Chatbot />
      </div>

      <div ref={gridContainerRef} className="grid-stack dashboard-grid w-full">
        {(dashboardData[activeTab]?.graphs ?? []).map((graph) => {
          if (graph.type === "blank") {
            return (
              <BlankGraph
                key={graph.id}
                id={String(graph.id)}
                x={graph.x}
                y={graph.y}
                w={graph.w}
              />
            )
          }
        })}

        <BarChartComponent id="bar-chart" x={0} y={2} w={1} />
        <LineChartComponent id="line-chart" x={1} y={0} w={1} />
        <DialChartComponent id="dial-chart" x={0} y={1} w={2} />
      </div>
      {/* Hidden anchor points for notification links */}
      <div id="compile-error-details" className="hidden"></div>
      <div id="warning-details" className="hidden"></div>
      <div id="runtime-error-details" className="hidden"></div>
      <div id="success-details" className="hidden"></div>
    </main>
  )
}