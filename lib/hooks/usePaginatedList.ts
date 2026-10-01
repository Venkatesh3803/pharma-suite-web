"use client";

import { useCallback, useEffect, useState } from "react";
import type { Dispatch, SetStateAction } from "react";

export type LoadState = "loading" | "error" | "ready";

interface UsePaginatedListOptions<T> {
  fetcher: (page: number) => Promise<T>;
  deps?: unknown[];
  initialPage?: number;
}

interface UsePaginatedListResult<T> {
  data: T | null;
  setData: Dispatch<SetStateAction<T | null>>;
  state: LoadState;
  error: string;
  page: number;
  setPage: (page: number | ((p: number) => number)) => void;
  /** Force refetch of current page */
  refresh: () => void;
  retry: () => void;
  /** Increments on every refresh — use as dep for parallel fetches (e.g. summaries) */
  tick: number;
}

/**
 * Single source of truth for list fetching.
 * Replaces ~29 copies of LoadState + useEffect(ignore) + refreshKey boilerplate.
 */
export function usePaginatedList<T>({
  fetcher,
  deps = [],
  initialPage = 1,
}: UsePaginatedListOptions<T>): UsePaginatedListResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [state, setState] = useState<LoadState>("loading");
  const [error, setError] = useState("");
  const [page, setPage] = useState(initialPage);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => setTick(t => t + 1), []);
  const retry = useCallback(() => {
    setState("loading");
    setError("");
    setTick(t => t + 1);
  }, []);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const result = await fetcher(page);
        if (!ignore) {
          setData(result);
          setState("ready");
        }
      } catch (e) {
        if (!ignore) {
          setError(e instanceof Error ? e.message : "Could not load data.");
          setState("error");
        }
      }
    }
    void load();
    return () => {
      ignore = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, tick, ...deps]);

  return { data, setData, state, error, page, setPage, refresh, retry, tick };
}
