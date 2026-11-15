import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api } from "../lib/api/client";

const ApiStatusContext = createContext<{
  simulated: boolean;
  mockMode: boolean;
  reportSimulated: (value: boolean) => void;
}>({
  simulated: api.isMock,
  mockMode: api.isMock,
  reportSimulated: () => undefined,
});
export function ApiProvider({ children }: { children: ReactNode }) {
  const [observedSimulation, setObservedSimulation] = useState(false);
  const reportSimulated = useCallback((value: boolean) => {
    if (value) setObservedSimulation(true);
  }, []);
  const value = useMemo(
    () => ({
      simulated: api.isMock || observedSimulation,
      mockMode: api.isMock,
      reportSimulated,
    }),
    [observedSimulation, reportSimulated],
  );
  return (
    <ApiStatusContext.Provider value={value}>
      {children}
    </ApiStatusContext.Provider>
  );
}
export const useApiStatus = () => useContext(ApiStatusContext);
