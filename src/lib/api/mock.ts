import type {
  Api,
  ApiResponse,
  Farm,
  AnalysisRun,
  Strategy,
  StrategyKind,
  InsufficientData,
  Success,
} from "./types";
import {
  demoFarm,
  incompleteFarm,
  insufficientExample,
  demoPlaces,
} from "../../mocks/farm";
import { datasets, indicators } from "../../mocks/environment";
import { makeLayer } from "../../mocks/terrain";
import { strategies, recommendation } from "../../mocks/strategies";
import { actionPlan } from "../../mocks/actionPlan";
import { methodology } from "../../mocks/methodology";
import { crops } from "../../mocks/crops";
import { BALANCED_WEIGHTS } from "../constants";

const STORE_KEY = "fieldwise.mock-api.v1";
interface Store {
  farms: Record<string, Farm>;
  scenarios: Record<string, Strategy[]>;
}
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
function readStore(): Store {
  try {
    const saved = JSON.parse(
      localStorage.getItem(STORE_KEY) || "null",
    ) as Store | null;
    if (saved?.farms && saved.scenarios) return saved;
  } catch {
    /* An unavailable store does not stop the in-memory demo. */
  }
  return {
    farms: {
      "demo-jenin": clone(demoFarm),
      "demo-insufficient": clone(incompleteFarm),
    },
    scenarios: {},
  };
}
let store = readStore();
const runs = new Map<
  string,
  { startedAt: number; id: string; insufficient: boolean }
>();
const wait = (ms = 360) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));
function persist() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(store));
  } catch {
    /* Demo remains usable in memory. */
  }
}
function ok<T>(data: T): Success<T> {
  return { status: "ok", data: clone(data), simulated: true };
}
function farm(id: string): Farm {
  if (!store.farms[id]) throw new Error("farm_not_found");
  return store.farms[id];
}
function missing(id: string): InsufficientData | null {
  const value = farm(id);
  const missing_inputs: InsufficientData["missing_inputs"] = [];
  if (!value.location) missing_inputs.push("location");
  if (!value.boundary) missing_inputs.push("boundary");
  return missing_inputs.length
    ? { status: "insufficient_data", missing_inputs, simulated: true }
    : null;
}
async function changeFarm(
  id: string,
  patch: Partial<Farm>,
): Promise<ApiResponse<Farm>> {
  await wait();
  store.farms[id] = { ...farm(id), ...patch, simulated: true };
  persist();
  return ok(store.farms[id]);
}
function getStrategies(id: string) {
  return store.scenarios[id] ?? strategies;
}
function analysisStatus(id: string): ApiResponse<AnalysisRun> {
  const gap = missing(id);
  if (gap) return gap;
  const run = runs.get(id);
  if (run?.insufficient) return clone(insufficientExample);
  const elapsed = run ? Date.now() - run.startedAt : 6000;
  const progress = Math.min(100, Math.round(elapsed / 45));
  const stage =
    progress >= 100 ? "complete" : progress < 15 ? "queued" : "running";
  const statuses = datasets.map((dataset, index) => ({
    ...dataset,
    status:
      progress === 100 || progress > 18 + index * 11
        ? dataset.status
        : progress > index * 11
          ? ("running" as const)
          : ("queued" as const),
  }));
  return ok({
    id: run?.id ?? "demo-run-complete",
    farmId: id,
    stage,
    progress,
    datasets: statuses,
    simulated: true,
  });
}

export const mockApi: Api = {
  isMock: true,
  async createFarm(request) {
    await wait(440);
    const value: Farm = request.demo
      ? clone(demoFarm)
      : {
          id: `farm-${crypto.randomUUID()}`,
          name: request.name?.trim() || "common.genericFarm",
          location: null,
          locationUnknown: false,
          boundary: null,
          boundaryUnknown: false,
          profile: null,
          cropHistory: [],
          historyUnknown: false,
          priorities: null,
          prioritiesUnknown: false,
          onboardingStep: 0,
          simulated: true,
        };
    store.farms[value.id] = value;
    if (request.demo) {
      delete store.scenarios[value.id];
      runs.delete(value.id);
    }
    persist();
    return ok(value);
  },
  async getFarm(id) {
    await wait();
    return ok(farm(id));
  },
  saveLocation(id, request) {
    return changeFarm(id, {
      location: request.location,
      locationUnknown: request.unknown,
      onboardingStep: 2,
    });
  },
  saveBoundary(id, request) {
    return changeFarm(id, {
      boundary: request.boundary,
      boundaryUnknown: request.unknown,
      onboardingStep: 3,
    });
  },
  saveProfile(id, profile) {
    return changeFarm(id, { profile, onboardingStep: 4 });
  },
  saveCropHistory(id, request) {
    return changeFarm(id, {
      cropHistory: request.entries,
      historyUnknown: request.unknown,
      onboardingStep: 5,
    });
  },
  savePriorities(id, request) {
    return changeFarm(id, {
      priorities: request.weights,
      prioritiesUnknown: request.unknown,
      unknownPriorities: request.unknownCriteria ?? [],
      onboardingStep: 6,
    });
  },
  async startAnalysis(id, request) {
    await wait(260);
    const gap = missing(id);
    if (gap) return gap;
    runs.set(id, {
      startedAt: Date.now(),
      id: `run-${crypto.randomUUID()}`,
      insufficient: request?.demoMode === "insufficient_data",
    });
    return analysisStatus(id);
  },
  async getAnalysisStatus(id) {
    await wait(260);
    return analysisStatus(id);
  },
  async getIndicators(id) {
    await wait(480);
    return missing(id) ?? ok(indicators);
  },
  async getLayer(id, key) {
    await wait(560);
    return missing(id) ?? ok(makeLayer(key, farm(id).boundary));
  },
  async getScenarios(id) {
    await wait(420);
    return missing(id) ?? ok(getStrategies(id));
  },
  async saveScenario(id, kind: StrategyKind, request) {
    await wait();
    const gap = missing(id);
    if (gap) return gap;
    store.scenarios[id] = clone(getStrategies(id)).map((strategy) =>
      strategy.kind === kind
        ? { ...strategy, rotation: request.rotation }
        : strategy,
    );
    persist();
    return ok(store.scenarios[id]);
  },
  async getComparison(id) {
    await wait(500);
    return (
      missing(id) ??
      ok({
        strategies: getStrategies(id),
        weights: farm(id).priorities ?? BALANCED_WEIGHTS,
        simulated: true,
      })
    );
  },
  async getRecommendation(id) {
    await wait(350);
    return missing(id) ?? ok(recommendation);
  },
  async getActionPlan(id, strategy) {
    await wait(420);
    return missing(id) ?? ok({ ...actionPlan, strategy });
  },
  async getMethodology() {
    await wait(320);
    return ok(methodology);
  },
  async getCrops() {
    await wait(240);
    return ok(crops);
  },
  async searchPlaces({ query }) {
    await wait(420);
    const normalized = query.trim().toLowerCase();
    const found = /jenin|جنين|burqin|برقين|palestine|فلسطين/.test(normalized);
    return ok(found ? demoPlaces : []);
  },
};

/** Test helper: resets demo state only; it is never imported by a component. */
export function resetMockStore() {
  store = {
    farms: {
      "demo-jenin": clone(demoFarm),
      "demo-insufficient": clone(incompleteFarm),
    },
    scenarios: {},
  };
  runs.clear();
  persist();
}
