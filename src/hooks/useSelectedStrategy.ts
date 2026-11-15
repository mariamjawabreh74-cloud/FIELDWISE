import type { StrategyKind } from "../lib/api/types";
import { useLocalState } from "./useLocalState";

export function useSelectedStrategy(farmId: string) {
  return useLocalState<StrategyKind>(
    `fieldwise.strategy.${farmId}`,
    "water_conservation",
  );
}
