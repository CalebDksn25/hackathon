"use client";

import { useEffect, useState, useCallback } from "react";

type Dashboard = any;

const STORAGE_KEY = "dashboardData";

export default function useDashboardData(opts?: {
  companyName?: string;
  role?: string;
}) {
  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchAndCache = useCallback(
    async (companyName?: string, role?: string) => {
      setLoading(true);
      try {
        const res = await fetch("/api/endpoints", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ companyName, role }),
        });
        if (!res.ok) throw new Error("Fetch failed");
        const json = await res.json();
        setData(json);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(json));
        } catch (e) {
          // ignore storage errors
        }
        return json;
      } catch (err) {
        console.warn("useDashboardData fetch error:", err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    // Load cached data first (synchronous)
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setData(JSON.parse(raw));
    } catch (e) {
      // ignore
    }

    // Then refresh from server
    fetchAndCache(opts?.companyName, opts?.role);
  }, [fetchAndCache, opts?.companyName, opts?.role]);

  return {
    data,
    loading,
    refresh: () => fetchAndCache(opts?.companyName, opts?.role),
  };
}
