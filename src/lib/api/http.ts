import type { Api, ApiResponse } from "./types";
import i18n from "../i18n";

export class ApiError extends Error {
  constructor(
    public code: string,
    public status?: number,
  ) {
    super(code);
    this.name = "ApiError";
  }
}

/** This is the only fetch implementation in the application. No API routes are hosted here. */
export function createHttpApi(
  baseUrl: string,
  fetcher: typeof fetch = globalThis.fetch,
): Api {
  const base = baseUrl.replace(/\/$/, "");
  async function request<T>(
    path: string,
    method = "GET",
    body?: unknown,
  ): Promise<ApiResponse<T>> {
    if (!base) throw new ApiError("missing_api_base_url");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetcher(`${base}${path}`, {
        method,
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          "Accept-Language": i18n.language,
          ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        },
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      });
      const payload: unknown = await response.json();
      if (
        payload &&
        typeof payload === "object" &&
        "status" in payload &&
        payload.status === "insufficient_data" &&
        "missing_inputs" in payload &&
        Array.isArray(payload.missing_inputs) &&
        "simulated" in payload &&
        typeof payload.simulated === "boolean"
      )
        return payload as ApiResponse<T>;
      if (!response.ok) throw new ApiError("request_failed", response.status);
      if (
        !payload ||
        typeof payload !== "object" ||
        !("status" in payload) ||
        payload.status !== "ok" ||
        !("data" in payload) ||
        !("simulated" in payload) ||
        typeof payload.simulated !== "boolean"
      )
        throw new ApiError("invalid_response", response.status);
      return payload as ApiResponse<T>;
    } finally {
      clearTimeout(timeout);
    }
  }
  const farm = (id: string) => `/farms/${encodeURIComponent(id)}`;
  return {
    isMock: false,
    createFarm: (body) => request("/farms", "POST", body),
    getFarm: (id) => request(farm(id)),
    saveLocation: (id, body) => request(`${farm(id)}/location`, "PUT", body),
    saveBoundary: (id, body) => request(`${farm(id)}/boundary`, "PUT", body),
    saveProfile: (id, body) => request(`${farm(id)}/profile`, "PUT", body),
    saveCropHistory: (id, body) =>
      request(`${farm(id)}/crop-history`, "PUT", body),
    savePriorities: (id, body) =>
      request(`${farm(id)}/priorities`, "PUT", body),
    startAnalysis: (id, body = {}) =>
      request(`${farm(id)}/analysis`, "POST", body),
    getAnalysisStatus: (id) => request(`${farm(id)}/analysis`),
    getIndicators: (id) => request(`${farm(id)}/indicators`),
    getLayer: (id, key) =>
      request(`${farm(id)}/layers/${encodeURIComponent(key)}`),
    getScenarios: (id) => request(`${farm(id)}/scenarios`),
    saveScenario: (id, kind, body) =>
      request(`${farm(id)}/scenarios/${kind}`, "PUT", body),
    getComparison: (id) => request(`${farm(id)}/comparison`),
    getRecommendation: (id) => request(`${farm(id)}/recommendation`),
    getActionPlan: (id, strategy) =>
      request(
        `${farm(id)}/action-plan?strategy=${encodeURIComponent(strategy)}`,
      ),
    getMethodology: () => request("/methodology"),
    getCrops: () => request("/crops"),
    searchPlaces: ({ query }) =>
      request(`/places?q=${encodeURIComponent(query)}`),
  };
}
