"use client"

import OverlayComparisonChart from "@/components/ui/overlay-comparison-chart"
import dynamic from "next/dynamic"
import { useNotifications, NotificationControlButton } from "@/components/ui/notifications"
import { Chatbot } from "@/components/ui/chatbot"
import { useEffect, useRef } from "react"
import TireDegradation from "@/components/ui/TireDegradation" 
import LiveDataGraphs from "@/components/ui/LiveDataGraphs"
import CompassDial from "@/components/ui/CompassDial"
import ColumnSelector from "@/components/ui/ColumnSelector"
import DFRCarProtoTireDeg from "@/components/images/DFRCarProtoTireDeg.png"

// Dynamically import RouteMap since Leaflet depends on browser APIs
const RouteMap = dynamic(() => import("@/components/ui/route-map"), {
  ssr: false,
})

export default function DashboardPage() {
  const { addNotification } = useNotifications();
  const hasAddedNotification = useRef(false);

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

  return (
    <main className="p-6 space-y-6">
      {/* Draggable Control Button */}
      <NotificationControlButton />
      
      {/* Chatbot */}
      <Chatbot />
      
      <header>
        <h1 className="text-2xl font-bold text-primary">Web Dashboard</h1>
        <p className="text-muted-foreground">
          Overlay comparison graph and GPS Visualization components
        </p>
      </header>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Velocity Chart */}
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-primary">
            Velocity components vs Lap Time
          </h2>
          <div className="rounded-lg border border-border shadow-sm p-4">
            <OverlayComparisonChart />
          </div>
        </div>

        {/* GPS Route Visualization with velocity-based colors */}
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-primary">
            GPS Route Visualization (Color-coded by velocity)
          </h2>
          <div className="rounded-lg overflow-hidden border border-border shadow-sm h-[500px]">
            {/* Pass CSV file path from public folder */}
            <RouteMap csvUrl="/data/lap data big.csv" zoom={18} className="h-full w-full" />
          </div>
        </div>
      </section>

      {/* Tire Degradation Graph */}
          <section className="py-8 px-4">
            <h2 className="text-2xl font-semibold mb-4 text-center">Tire Degradation</h2>
            <TireDegradation applyExponential={true} normalize={true} />
          </section>
    
          {/* Live Telemetry Graphs */}
          <section className="py-8 px-4">
            <h2 className="text-2xl font-semibold mb-4 text-center">Live Car Telemetry</h2>
            <LiveDataGraphs />
          </section>

      {/* Hidden anchor points for notification links */}
      <div id="compile-error-details" className="hidden"></div>
      <div id="warning-details" className="hidden"></div>
      <div id="runtime-error-details" className="hidden"></div>
      <div id="success-details" className="hidden"></div>
    </main>
  )
}