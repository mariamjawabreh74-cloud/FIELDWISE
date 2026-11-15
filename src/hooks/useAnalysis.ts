import { useCallback, useEffect } from "react";
import { api } from "../lib/api/client";
import type { AnalysisRun, StartAnalysisRequest } from "../lib/api/types";
import { useMutation, useResource } from "./useResource";

export function useAnalysis(farmId?: string) {
  const loader = useCallback(() => api.getAnalysisStatus(farmId!), [farmId]);
  const status = useResource(farmId ? loader : null);
  const mutation = useMutation<AnalysisRun>();
  const run = status.data;
  const reload = status.reload;
  useEffect(() => {
    if (run?.stage !== "queued" && run?.stage !== "running") return;
    const timer = setTimeout(() => {
      void reload();
    }, 850);
    return () => clearTimeout(timer);
  }, [run, reload]);
  const start = async (request?: StartAnalysisRequest) => {
    if (!farmId) return;
    const response = await mutation.execute(() =>
      api.startAnalysis(farmId, request),
    );
    if (response) status.replace(response);
  };
  return {
    ...status,
    start,
    starting: mutation.pending,
    startError: mutation.error,
  };
}
