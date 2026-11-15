import { describe, expect, it, vi } from "vitest";
import { selectApi } from "../lib/api/client";
import { createHttpApi } from "../lib/api/http";
import { mockApi, resetMockStore } from "../lib/api/mock";

async function resolveMock<T>(call: () => Promise<T>) {
  vi.useFakeTimers();
  try {
    const promise = call();
    await vi.runAllTimersAsync();
    return await promise;
  } finally {
    vi.useRealTimers();
  }
}

describe("swappable API boundary", () => {
  it("defaults to mocks and only uses HTTP for an explicit false", () => {
    expect(selectApi({}).isMock).toBe(true);
    expect(selectApi({ VITE_USE_MOCK: "true" }).isMock).toBe(true);
    expect(
      selectApi({
        VITE_USE_MOCK: "false",
        VITE_API_BASE_URL: "https://example.test/v1",
      }).isMock,
    ).toBe(false);
  });
  it("uses the documented HTTP path, method, and request body", async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({
        status: "ok",
        data: { id: "farm-1" },
        simulated: false,
      }),
    });
    const client = createHttpApi("https://example.test/v1/", fetcher);
    await client.createFarm({ name: "Test farm" });
    expect(fetcher).toHaveBeenCalledWith(
      "https://example.test/v1/farms",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ name: "Test farm" }),
      }),
    );
  });
  it("does not silently use mocks if the HTTP base URL is missing", async () => {
    await expect(createHttpApi("").getCrops()).rejects.toThrow(
      "missing_api_base_url",
    );
  });
  it("accepts insufficient_data as a domain result, including HTTP 422", async () => {
    const payload = {
      status: "insufficient_data",
      missing_inputs: ["boundary"],
      simulated: false,
    };
    const fetcher = vi
      .fn()
      .mockResolvedValue({ ok: false, status: 422, json: async () => payload });
    expect(
      await createHttpApi("https://example.test", fetcher).getRecommendation(
        "farm",
      ),
    ).toEqual(payload);
  });
  it("labels demo crops and farms as simulated", async () => {
    resetMockStore();
    const result = await resolveMock(() => mockApi.getCrops());
    expect(result.simulated).toBe(true);
    if (result.status === "ok") {
      expect(result.data).toHaveLength(12);
      expect(
        result.data.every(
          (crop) => crop.simulated && crop.names.ar && crop.names.en,
        ),
      ).toBe(true);
    }
  });
  it("never recommends a strategy for the insufficient-data example", async () => {
    const result = await resolveMock(() =>
      mockApi.getRecommendation("demo-insufficient"),
    );
    expect(result).toEqual({
      status: "insufficient_data",
      missing_inputs: ["location", "boundary"],
      simulated: true,
    });
    expect(result).not.toHaveProperty("data");
  });
  it("provides unavailable and partial datasets without fabricating missing values", async () => {
    const result = await resolveMock(() =>
      mockApi.getAnalysisStatus("demo-jenin"),
    );
    if (result.status === "ok")
      expect(result.data.datasets.map((dataset) => dataset.status)).toEqual(
        expect.arrayContaining(["unavailable", "partial"]),
      );
    const values = await resolveMock(() => mockApi.getIndicators("demo-jenin"));
    if (values.status === "ok")
      expect(
        values.data.find((value) => value.derivedFrom.includes("ecostress"))
          ?.value,
      ).toBeNull();
  });
});
