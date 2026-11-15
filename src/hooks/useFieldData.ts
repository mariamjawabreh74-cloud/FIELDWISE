import { useCallback } from "react";
import { api } from "../lib/api/client";
import type {
  LayerKey,
  SaveScenarioRequest,
  Strategy,
  StrategyKind,
} from "../lib/api/types";
import { useResource, useMutation } from "./useResource";

export function useIndicators(farmId?: string, enabled = true) {
  const load = useCallback(() => api.getIndicators(farmId!), [farmId]);
  return useResource(farmId && enabled ? load : null);
}
export function useLayer(farmId: string | undefined, key: LayerKey) {
  const load = useCallback(() => api.getLayer(farmId!, key), [farmId, key]);
  return useResource(farmId ? load : null);
}
export function useCrops() {
  return useResource(useCallback(() => api.getCrops(), []));
}
export function useMethodology() {
  return useResource(useCallback(() => api.getMethodology(), []));
}
export function useScenarios(farmId?: string) {
  const load = useCallback(() => api.getScenarios(farmId!), [farmId]);
  const resource = useResource(farmId ? load : null);
  const mutation = useMutation<Strategy[]>();
  const save = async (kind: StrategyKind, request: SaveScenarioRequest) => {
    if (!farmId) return false;
    const response = await mutation.execute(() =>
      api.saveScenario(farmId, kind, request),
    );
    if (response) resource.replace(response);
    return response?.status === "ok";
  };
  return {
    ...resource,
    save,
    pending: mutation.pending,
    saveError: mutation.error,
  };
}
export function useComparison(farmId?: string) {
  const load = useCallback(() => api.getComparison(farmId!), [farmId]);
  return useResource(farmId ? load : null);
}
export function useRecommendation(farmId?: string) {
  const load = useCallback(() => api.getRecommendation(farmId!), [farmId]);
  return useResource(farmId ? load : null);
}
export function useActionPlan(
  farmId: string | undefined,
  strategy: StrategyKind,
) {
  const load = useCallback(
    () => api.getActionPlan(farmId!, strategy),
    [farmId, strategy],
  );
  return useResource(farmId ? load : null);
}
export function usePlaceSearch(query: string) {
  const load = useCallback(() => api.searchPlaces({ query }), [query]);
  return useResource(query.trim() ? load : null);
}
export function useDemoFarm() {
  const loader = useCallback(() => api.getFarm("demo-jenin"), []);
  return useResource(api.isMock ? loader : null);
}
