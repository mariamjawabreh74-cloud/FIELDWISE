import type { Api } from "./types";
import { mockApi } from "./mock";
import { createHttpApi } from "./http";

export interface ApiEnvironment {
  VITE_USE_MOCK?: string;
  VITE_API_BASE_URL?: string;
}

/** Mock is the safe default. Only the exact string "false" enables HTTP. */
export function selectApi(environment: ApiEnvironment): Api {
  return environment.VITE_USE_MOCK === "false"
    ? createHttpApi(environment.VITE_API_BASE_URL ?? "")
    : mockApi;
}
export const api = selectApi(import.meta.env);
