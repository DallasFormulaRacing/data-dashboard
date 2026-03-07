"use client"

import { useNotifications } from "@/components/ui/9dab3a/Notification"
import { Chatbot } from "@/components/ui/9dab3a/Chatbot"
import { useEffect, useRef } from "react"
import BlankGraph from "@/components/ui/30c4e3/BlankGraph"
import { GridStack, type GridItemHTMLElement, type GridStackNode } from "gridstack"

export default function DashboardPage() {
  const { addNotification } = useNotifications();
  const hasAddedNotification = useRef(false);
  const gridContainerRef = useRef<HTMLDivElement>(null)

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

    enforceTileBounds()
    grid.on("change", (_event, items) => enforceTileBounds(items))
    grid.on("dragstop", (_event, el) => {
      const node = (el as GridItemHTMLElement).gridstackNode
      if (!node) return
      enforceTileBounds([node])
    })
    grid.on("resizestop", (_event, el) => {
      const node = (el as GridItemHTMLElement).gridstackNode
      if (!node) return
      enforceTileBounds([node])
    })
    grid.on("dropped", (_event, _prevNode, newNode) => {
      if (!newNode) return
      enforceTileBounds([newNode])
    })

    return () => {
      grid.off("change")
      grid.off("dragstop")
      grid.off("resizestop")
      grid.off("dropped")
      grid.destroy(false)
    }
  }, [])

  return (
    <main className="flex h-full w-full flex-col gap-4">
      <div className="flex items-start justify-between">
        <span className="text-black text-[50px]">Welcome, Anhaar</span>
        <Chatbot />
      </div>

      <div ref={gridContainerRef} className="grid-stack dashboard-grid w-full">
        <div className="grid-stack-item" gs-id="blank-graph-1" gs-x="0" gs-y="0" gs-w="1" gs-h="1" gs-min-w="1" gs-max-w="2" gs-min-h="1" gs-max-h="1">
          <div className="grid-stack-item-content">
            <BlankGraph />
          </div>
        </div>

        <div className="grid-stack-item" gs-id="blank-graph-2" gs-x="1" gs-y="0" gs-w="1" gs-h="1" gs-min-w="1" gs-max-w="2" gs-min-h="1" gs-max-h="1">
          <div className="grid-stack-item-content">
            <BlankGraph />
          </div>
        </div>

        <div className="grid-stack-item" gs-id="blank-graph-3" gs-x="0" gs-y="1" gs-w="2" gs-h="1" gs-min-w="1" gs-max-w="2" gs-min-h="1" gs-max-h="1">
          <div className="grid-stack-item-content">
            <BlankGraph />
          </div>
        </div>
      </div>

      {/* Hidden anchor points for notification links */}
      <div id="compile-error-details" className="hidden"></div>
      <div id="warning-details" className="hidden"></div>
      <div id="runtime-error-details" className="hidden"></div>
      <div id="success-details" className="hidden"></div>
    </main>
  )
}