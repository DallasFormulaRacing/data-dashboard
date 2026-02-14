"use client"
import { useEffect, useState, useRef } from "react"
import { MapContainer, TileLayer, Polyline, useMapEvents } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

const LAT0 = 32.986103
const LON0 = -96.751180

function xyToLatLon(x: number, y: number): L.LatLngTuple {
    const deltaLat = y / 111_000
    const deltaLon = x / (111_000 * Math.cos((LAT0 * Math.PI) / 180))
    return [LAT0 + deltaLat, LON0 + deltaLon]
}

function velocityToColor(v: number, vMax: number): string {
    const ratio = v / vMax
    if (ratio > 0.8) return "#FF0000"
    if (ratio > 0.6) return "#FF6666"
    if (ratio > 0.4) return "#FFA500"
    if (ratio > 0.2) return "#FFFF00"
    return "#00FF00"
}

// Simple smoothing using weighted average of neighbors
function smoothPoints(points: { pos: L.LatLngTuple; v: number }[], strength: number): { pos: L.LatLngTuple; v: number }[] {
    if (points.length < 3 || strength === 0) return points
    
    return points.map((p, idx) => {
        if (idx === 0 || idx === points.length - 1) return p
        
        const prev = points[idx - 1].pos
        const curr = p.pos
        const next = points[idx + 1].pos
        
        // Weighted average - higher strength = more smoothing
        const w = strength
        const lat = (prev[0] * w + curr[0] * (1 - 2*w) + next[0] * w) / (1 - 2*w + 2*w)
        const lon = (prev[1] * w + curr[1] * (1 - 2*w) + next[1] * w) / (1 - 2*w + 2*w)
        
        return { pos: [lat, lon] as L.LatLngTuple, v: p.v }
    })
}

type RouteMapProps = {
    csvUrl: string
    zoom?: number
    className?: string
}

export default function RouteMap({ csvUrl, zoom = 15, className }: RouteMapProps) {
    const [routePoints, setRoutePoints] = useState<{ pos: L.LatLngTuple; v: number }[]>([])
    const [routeSegments, setRouteSegments] = useState<{ positions: L.LatLngTuple[]; color: string }[]>([])
    const mapRef = useRef<L.Map | null>(null)

    // Fetch CSV and convert to lat/lon points
    useEffect(() => {
        fetch(csvUrl)
            .then((res) => res.text())
            .then((text) => {
                const lines = text.split("\n")
                const header = lines[0].split(",").map((h) => h.replace(/"/g, "").trim())
                const xIndex = header.indexOf("Car Coord X")
                const yIndex = header.indexOf("Car Coord Y")
                const vxIndex = header.indexOf("Chassis Velocity X")
                const vyIndex = header.indexOf("Chassis Velocity Y")
                const vzIndex = header.indexOf("Chassis Velocity Z")
                if ([xIndex, yIndex, vxIndex, vyIndex, vzIndex].some((i) => i === -1)) {
                    console.error("CSV missing required columns")
                    return
                }

                const points: { pos: L.LatLngTuple; v: number }[] = []
                for (let i = 1; i < lines.length; i++) {
                    const line = lines[i].trim()
                    if (!line) continue
                    const cols = line.split(",")
                    const x = parseFloat(cols[xIndex])
                    const y = parseFloat(cols[yIndex])
                    const vx = parseFloat(cols[vxIndex])
                    const vy = parseFloat(cols[vyIndex])
                    const vz = parseFloat(cols[vzIndex])
                    if ([x, y, vx, vy, vz].some(isNaN)) continue
                    const vel = Math.sqrt(vx ** 2 + vy ** 2 + vz ** 2)
                    points.push({ pos: xyToLatLon(x, y), v: vel })
                }

                setRoutePoints(points)
            })
            .catch((err) => console.error("Failed to load CSV:", err))
    }, [csvUrl])

    // Smart zoom-based sampling and smoothing
    const updateSegments = (zoomLevel: number) => {
        if (!routePoints.length) return

        // Exponential relationship: zoom out = skip more points
        // Zoom 18: skip 1 (every point)
        // Zoom 15: skip 1 (every point) 
        // Zoom 13: skip 4 (every 4th point)
        // Zoom 11: skip 16 (every 16th point)
        // Zoom 9: skip 64 (every 64th point)
        const skip = Math.max(1, Math.pow(2, Math.max(0, 15 - zoomLevel)))
        
        // Sample points based on skip factor
        const sampled: { pos: L.LatLngTuple; v: number }[] = []
        for (let i = 0; i < routePoints.length; i += skip) {
            sampled.push(routePoints[i])
        }
        // Always include the last point
        if (sampled[sampled.length - 1] !== routePoints[routePoints.length - 1]) {
            sampled.push(routePoints[routePoints.length - 1])
        }

        // Smoothing strength based on zoom level
        // More zoomed out = more smoothing for that Apple Maps look
        let smoothStrength = 0
        if (zoomLevel < 15) {
            smoothStrength = Math.min(0.35, (15 - zoomLevel) * 0.05)
        }
        
        // Apply multi-pass smoothing for better results at low zoom
        let smoothed = sampled
        const passes = zoomLevel < 12 ? 2 : 1
        for (let p = 0; p < passes; p++) {
            smoothed = smoothPoints(smoothed, smoothStrength)
        }

        // Build colored segments
        const segments: { positions: L.LatLngTuple[]; color: string }[] = []
        const vMax = Math.max(...routePoints.map((p) => p.v))
        
        for (let i = 0; i < smoothed.length - 1; i++) {
            const color = velocityToColor(smoothed[i].v, vMax)
            segments.push({ positions: [smoothed[i].pos, smoothed[i + 1].pos], color })
        }

        setRouteSegments(segments)
    }

    // Listen for zoom changes and assign map
    const MapEventHandler = () => {
        const map = useMapEvents({
            zoomend: (e) => {
                updateSegments(e.target.getZoom())
            },
        })
        mapRef.current = map
        return null
    }

    // Initial render
    useEffect(() => {
        updateSegments(zoom)
    }, [routePoints])

    const center: L.LatLngTuple = routePoints.length > 0 ? routePoints[0].pos : [LAT0, LON0]

    return (
        <MapContainer
            center={center}
            zoom={zoom}
            scrollWheelZoom={true}
            className={className}
            style={{ height: "100%", width: "100%", borderRadius: "0.5rem" }}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapEventHandler />
            {routeSegments.map((seg, idx) => (
                <Polyline key={idx} positions={seg.positions} color={seg.color} weight={3} />
            ))}
        </MapContainer>
    )
}