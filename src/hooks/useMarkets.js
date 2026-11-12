import { useCallback, useEffect, useRef, useState } from "react";
import { fetchMarketGlobals, fetchMarkets } from "@/lib/markets";

/** Live market rows plus aggregate stats, refreshed on a slow interval. */
export default function useMarkets({ limit } = {}) {
  const [coins, setCoins] = useState([]);
  const [globals, setGlobals] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatedAt, setUpdatedAt] = useState(null);
  const mounted = useRef(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [rows, stats] = await Promise.all([fetchMarkets(), fetchMarketGlobals()]);
      if (!mounted.current) return;
      setCoins(rows);
      setGlobals(stats);
      setError("");
      setUpdatedAt(Date.now());
    } catch (cause) {
      if (mounted.current) setError(cause?.message || "Market data is unavailable right now.");
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    load();
    return () => {
      mounted.current = false;
    };
  }, [load]);

  useEffect(() => {
    const timer = setInterval(() => {
      Promise.all([fetchMarkets({ force: true }), fetchMarketGlobals({ force: true })])
        .then(([rows, stats]) => {
          if (!mounted.current) return;
          setCoins(rows);
          setGlobals(stats);
          setUpdatedAt(Date.now());
        })
        .catch(() => {});
    }, 60_000);
    return () => clearInterval(timer);
  }, []);

  return { coins: limit ? coins.slice(0, limit) : coins, globals, loading, error, updatedAt, refresh: load };
}