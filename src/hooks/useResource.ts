import { useCallback, useEffect, useRef, useState } from "react";
import type { ApiResponse, InsufficientData } from "../lib/api/types";
import { useApiStatus } from "./ApiProvider";
import { useTranslation } from "react-i18next";

export interface Resource<T> {
  result: ApiResponse<T> | null;
  data: T | null;
  missing: InsufficientData | null;
  loading: boolean;
  error: Error | null;
  reload: () => Promise<void>;
  replace: (response: ApiResponse<T>) => void;
}

export function useResource<T>(
  loader: (() => Promise<ApiResponse<T>>) | null,
): Resource<T> {
  const [result, setResult] = useState<ApiResponse<T> | null>(null);
  const [loading, setLoading] = useState(!!loader);
  const [error, setError] = useState<Error | null>(null);
  const requestId = useRef(0);
  const resultLoader = useRef(loader);
  const { reportSimulated, mockMode } = useApiStatus();
  const { i18n } = useTranslation();
  const language = mockMode ? "mock" : i18n.language;
  const resultLanguage = useRef(language);
  const invalidateRequests = useCallback(() => {
    requestId.current++;
  }, []);
  const replace = useCallback(
    (response: ApiResponse<T>) => {
      resultLoader.current = loader;
      resultLanguage.current = language;
      reportSimulated(response.simulated);
      setResult(response);
      setError(null);
      setLoading(false);
    },
    [reportSimulated, loader, language],
  );
  const reload = useCallback(async () => {
    const id = ++requestId.current;
    if (!loader) {
      resultLoader.current = null;
      resultLanguage.current = language;
      setLoading(false);
      setResult(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await loader();
      if (id === requestId.current) replace(response);
    } catch (cause) {
      if (id === requestId.current) {
        resultLoader.current = loader;
        resultLanguage.current = language;
        setError(cause instanceof Error ? cause : new Error("request_failed"));
        setLoading(false);
      }
    }
  }, [loader, replace, language]);
  useEffect(() => {
    setResult(null);
    void reload();
    return invalidateRequests;
  }, [reload, invalidateRequests]);
  const current =
    resultLoader.current === loader && resultLanguage.current === language;
  const visibleResult = current ? result : null;
  return {
    result: visibleResult,
    data: visibleResult?.status === "ok" ? visibleResult.data : null,
    missing:
      visibleResult?.status === "insufficient_data" ? visibleResult : null,
    loading: current ? loading : !!loader,
    error: current ? error : null,
    reload,
    replace,
  };
}

export function useMutation<T>() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { reportSimulated } = useApiStatus();
  const execute = useCallback(
    async (
      operation: () => Promise<ApiResponse<T>>,
    ): Promise<ApiResponse<T> | null> => {
      setPending(true);
      setError(null);
      try {
        const result = await operation();
        reportSimulated(result.simulated);
        return result;
      } catch (cause) {
        setError(cause instanceof Error ? cause : new Error("request_failed"));
        return null;
      } finally {
        setPending(false);
      }
    },
    [reportSimulated],
  );
  return { execute, pending, error };
}
