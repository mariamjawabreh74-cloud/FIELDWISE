import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { api } from "../lib/api/client";
import type {
  ApiResponse,
  CreateFarmRequest,
  Farm,
  FarmProfile,
  InsufficientData,
  SaveBoundaryRequest,
  SaveCropHistoryRequest,
  SaveLocationRequest,
  SavePrioritiesRequest,
} from "../lib/api/types";
import { useApiStatus } from "./ApiProvider";
import { useMutation } from "./useResource";

const DRAFT_KEY = `fieldwise.draft.${api.isMock ? "mock" : "http"}.v1`;
function readDraft(): Farm | null {
  try {
    const saved = JSON.parse(
      localStorage.getItem(DRAFT_KEY) || "null",
    ) as Farm | null;
    return saved &&
      typeof saved.id === "string" &&
      Array.isArray(saved.cropHistory) &&
      typeof saved.simulated === "boolean"
      ? saved
      : null;
  } catch {
    return null;
  }
}
interface FarmContextValue {
  farm: Farm | null;
  loading: boolean;
  error: Error | null;
  pending: boolean;
  saveError: Error | null;
  storageError: boolean;
  missing: InsufficientData | null;
  clearMissing: () => void;
  retry: () => void;
  saveDraft: () => boolean;
  updateDraft: (patch: Partial<Farm>) => void;
  createFarm: (request: CreateFarmRequest) => Promise<ApiResponse<Farm> | null>;
  saveLocation: (
    request: SaveLocationRequest,
  ) => Promise<ApiResponse<Farm> | null>;
  saveBoundary: (
    request: SaveBoundaryRequest,
  ) => Promise<ApiResponse<Farm> | null>;
  saveProfile: (request: FarmProfile) => Promise<ApiResponse<Farm> | null>;
  saveCropHistory: (
    request: SaveCropHistoryRequest,
  ) => Promise<ApiResponse<Farm> | null>;
  savePriorities: (
    request: SavePrioritiesRequest,
  ) => Promise<ApiResponse<Farm> | null>;
}
const FarmContext = createContext<FarmContextValue | null>(null);
export function FarmProvider({ children }: { children: ReactNode }) {
  const initial = useRef(readDraft());
  const [farm, setFarm] = useState<Farm | null>(initial.current);
  const [loading, setLoading] = useState(!initial.current && api.isMock);
  const [error, setError] = useState<Error | null>(null);
  const [missing, setMissing] = useState<InsufficientData | null>(null);
  const clearMissing = useCallback(() => setMissing(null), []);
  const [storageError, setStorageError] = useState(false);
  const { reportSimulated } = useApiStatus();
  const mutation = useMutation<Farm>();
  const execute = mutation.execute;
  const persist = useCallback((value: Farm) => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(value));
      setStorageError(false);
      return true;
    } catch {
      setStorageError(true);
      return false;
    }
  }, []);
  const adopt = useCallback(
    (response: ApiResponse<Farm> | null) => {
      if (response) reportSimulated(response.simulated);
      if (response)
        setMissing(response.status === "insufficient_data" ? response : null);
      if (response?.status === "ok") {
        setFarm(response.data);
        persist(response.data);
      }
      return response;
    },
    [persist, reportSimulated],
  );
  const load = useCallback(async () => {
    if (!api.isMock && !initial.current) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      adopt(await api.getFarm(initial.current?.id ?? "demo-jenin"));
    } catch (cause) {
      setError(cause instanceof Error ? cause : new Error("request_failed"));
    } finally {
      setLoading(false);
    }
  }, [adopt]);
  useEffect(() => {
    if (!initial.current) void load();
    else reportSimulated(initial.current.simulated);
  }, [load, reportSimulated]);
  const updateDraft = useCallback(
    (patch: Partial<Farm>) => {
      setFarm((current) => {
        if (!current) return current;
        const next = { ...current, ...patch };
        persist(next);
        return next;
      });
    },
    [persist],
  );
  const save = useCallback(
    async (operation: () => Promise<ApiResponse<Farm>>) =>
      adopt(await execute(operation)),
    [adopt, execute],
  );
  const value = useMemo<FarmContextValue>(
    () => ({
      farm,
      loading,
      error,
      pending: mutation.pending,
      saveError: mutation.error,
      storageError,
      missing,
      clearMissing,
      retry: () => {
        void load();
      },
      saveDraft: () => (farm ? persist(farm) : false),
      updateDraft,
      createFarm: (request) => save(() => api.createFarm(request)),
      saveLocation: (request) =>
        farm
          ? save(() => api.saveLocation(farm.id, request))
          : Promise.resolve(null),
      saveBoundary: (request) =>
        farm
          ? save(() => api.saveBoundary(farm.id, request))
          : Promise.resolve(null),
      saveProfile: (request) =>
        farm
          ? save(() => api.saveProfile(farm.id, request))
          : Promise.resolve(null),
      saveCropHistory: (request) =>
        farm
          ? save(() => api.saveCropHistory(farm.id, request))
          : Promise.resolve(null),
      savePriorities: (request) =>
        farm
          ? save(() => api.savePriorities(farm.id, request))
          : Promise.resolve(null),
    }),
    [
      farm,
      loading,
      error,
      mutation.pending,
      mutation.error,
      storageError,
      missing,
      clearMissing,
      load,
      persist,
      updateDraft,
      save,
    ],
  );
  return <FarmContext.Provider value={value}>{children}</FarmContext.Provider>;
}
export function useFarm() {
  const context = useContext(FarmContext);
  if (!context) throw new Error("useFarm requires FarmProvider");
  return context;
}
