"use client"

import { useEffect, useMemo, useState } from "react"
import Papa from "papaparse"

export type CsvRow = Record<string, string>

const toNumber = (value: unknown): number => {
  const parsed = Number.parseFloat(String(value ?? "").replace(/,/g, "").trim())
  return Number.isFinite(parsed) ? parsed : Number.NaN
}

const inferNumericColumns = (rows: CsvRow[], columns: string[]) => {
  const sampleRows = rows.slice(0, 200)

  return columns.filter((column) => {
    let numericCount = 0

    for (const row of sampleRows) {
      if (Number.isFinite(toNumber(row[column]))) {
        numericCount += 1
      }
    }

    return numericCount > 0
  })
}

export function useCsvDataset(fileName: string, columnsToKeep?: string[]) {
  const [rows, setRows] = useState<CsvRow[]>([])
  const [columns, setColumns] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    let ws: WebSocket | null = null;

    const useWebSocket = process.env.NEXT_PUBLIC_READ_FROM_CSV === "true"
    const simulate = process.env.NEXT_PUBLIC_SIMULATE_TRACK_TESTING === "true"
    const frequency = process.env.NEXT_PUBLIC_SIMULATION_FREQUENCY_MS || "100"

    if (useWebSocket) {
        setLoading(true)
        setError(null)

        const wsUrl = new URL("ws://localhost:8080/ws/telemetry")
        wsUrl.searchParams.set("read_csv", "true")
        wsUrl.searchParams.set("simulate", simulate.toString())
        wsUrl.searchParams.set("frequency_ms", frequency)

        ws = new WebSocket(wsUrl.toString())

        ws.onmessage = (event) => {
          if (cancelled) return
          try {
            const newRow = JSON.parse(event.data)
            
            if (newRow.error) {
              setError(newRow.error)
              return
            }

            const stringifiedRow: CsvRow = {}
            Object.entries(newRow).forEach(([key, value]) => {
              stringifiedRow[key] = String(value)
            })

            setRows(prev => {
              const next = [...prev, stringifiedRow]
              if (next.length > 500) {
                return next.slice(next.length - 500)
              }
              return next
            })
            
            setColumns(prev => {
               const newKeys = Object.keys(stringifiedRow)
               if (prev.length === 0) return newKeys
               return prev
            })
            setLoading(false)
          } catch (e) {
            console.error("Failed to parse websocket message", e)
          }
        }

        ws.onerror = () => {
          if (!cancelled) {
            setError("WebSocket Error")
            setLoading(false)
          }
        }

        ws.onclose = () => {
           if (!cancelled) console.log("WebSocket connection closed")
        }
    } else {
      const run = async () => {
        setLoading(true)
        setError(null)

        try {
          const encodedFile = encodeURIComponent(fileName)
          const response = await fetch(`/data/${encodedFile}`, { cache: "force-cache" })

          if (!response.ok) {
            throw new Error(`Failed to fetch ${fileName} (HTTP ${response.status})`)
          }

          const csvText = await response.text()
          const parsed = Papa.parse<Record<string, string>>(csvText, {
            header: true,
            skipEmptyLines: true,
            dynamicTyping: false,
          })

          const rawColumns = parsed.meta.fields ?? Object.keys(parsed.data?.[0] ?? {})
          const cleanedColumns = rawColumns
            .map((column) => String(column ?? "").trim())
            .filter((column) => column.length > 0)

          // Only keep rows with specified columns to reduce memory footprint
          const keepSet = columnsToKeep?.length ? new Set(columnsToKeep) : null
          const parsedRows = (parsed.data ?? []).map((row) => {
            const cleaned: CsvRow = {}

            Object.entries(row).forEach(([key, value]) => {
              const normalizedKey = String(key ?? "").trim()
              if (!normalizedKey) return
              // Only include column if it's in the keepSet, or keepSet is null (keep all)
              if (keepSet && !keepSet.has(normalizedKey)) return
              cleaned[normalizedKey] = String(value ?? "")
            })

            return cleaned
          })

          if (cancelled) return

          setRows(parsedRows)
          setColumns(cleanedColumns)
        } catch (caughtError) {
          if (cancelled) return
          setRows([])
          setColumns([])
          setError(caughtError instanceof Error ? caughtError.message : "Failed to load CSV")
        } finally {
          if (!cancelled) {
            setLoading(false)
          }
        }
      }

      run()
    }

    return () => {
      cancelled = true
      if (ws) {
          ws.close()
      }
    }
  }, [fileName])

  const numericColumns = useMemo(() => inferNumericColumns(rows, columns), [rows, columns])

  return {
    rows,
    columns,
    numericColumns,
    loading,
    error,
  }
}
