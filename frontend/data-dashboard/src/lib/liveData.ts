"use client"

import { useState, useEffect } from "react"

export function useLiveData() {
  const [data, setData] = useState(null)

  useEffect(() => {
    async function fetchData() {
      const res = await fetch("/api/dashboard") //needs to be modified
      const json = await res.json()
      setData(json)
    }

    fetchData()
  }, [])

  return data
}