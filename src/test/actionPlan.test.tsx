import { describe, expect, it, vi } from "vitest";
import { mockApi } from "../lib/api/mock";
import { supportsWebGL } from "../lib/webgl";

describe("seasonal plan and methodology", () => {
  it("returns labeled tasks for every month and the selected strategy", async () => {
    vi.useFakeTimers();
    try {
      const promise = mockApi.getActionPlan("demo-jenin", "soil_improvement");
      await vi.runAllTimersAsync();
      const result = await promise;
      expect(result.simulated).toBe(true);
      if (result.status === "ok") {
        expect(result.data.strategy).toBe("soil_improvement");
        expect(new Set(result.data.tasks.map((task) => task.month)).size).toBe(
          12,
        );
        expect(result.data.tasks.every((task) => task.simulated)).toBe(true);
      }
    } finally {
      vi.useRealTimers();
    }
  });
  it("loads citations, limits, and the backend formula integration point through the API", async () => {
    vi.useFakeTimers();
    try {
      const promise = mockApi.getMethodology();
      await vi.runAllTimersAsync();
      const result = await promise;
      if (result.status === "ok") {
        expect(result.data.datasets).toHaveLength(7);
        expect(
          result.data.datasets.every((dataset) =>
            dataset.documentationUrl.startsWith("https://"),
          ),
        ).toBe(true);
        expect(
          result.data.formulas.some((formula) => formula.backendPlaceholder),
        ).toBe(true);
        expect(result.data.limitations).toContain("mock.limitations.simulated");
      }
    } finally {
      vi.useRealTimers();
    }
  });
  it("detects unavailable WebGL without a rendering crash", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    expect(supportsWebGL()).toBe(false);
  });
});
