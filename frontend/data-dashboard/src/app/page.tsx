"use client"

import OverlayComparisonChart from "@/components/ui/overlay-comparison-chart"
import dynamic from "next/dynamic"
import { useNotifications, NotificationControlButton } from "@/components/ui/notifications"
import { Chatbot } from "@/components/ui/chatbot"
import { useEffect, useRef } from "react"
import LiveDataGraphs from "@/components/ui/LiveDataGraphs"
import CompassDial from "@/components/ui/CompassDial"
import ColumnSelector from "@/components/ui/ColumnSelector"
import DFRCarProtoTireDeg from "@/components/images/DFRCarProtoTireDeg.png"
import AddFilterButton from "@/components/ui/add-filter-button"

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
      {/* <NotificationControlButton /> */}
      
      {/* Chatbot */}
      <Chatbot />
      
      <div className="text-black">
          <h1 className=" text-[50px]">Welcome, Anhaar</h1>
          <AddFilterButton />
          <div className="bg-white rounded-lg h-125 w-full border-2 border-gray-400 flex items-center justify-center">
            <h1 className="text-xl text-grey-500 italic">Insert Graph Here</h1>
          </div>
        {/* input graphs here */}
      </div>

      {/* Hidden anchor points for notification links */}
      <div id="compile-error-details" className="hidden"></div>
      <div id="warning-details" className="hidden"></div>
      <div id="runtime-error-details" className="hidden"></div>
      <div id="success-details" className="hidden"></div>
    </main>
  )
}