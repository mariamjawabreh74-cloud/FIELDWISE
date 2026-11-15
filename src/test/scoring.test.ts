import { describe, expect, it } from "vitest";
import { aggregateConfidence, calculateWeightedScore } from "../lib/scoring";
import type { CriterionScore } from "../lib/api/types";
import { isGrowingMonth, reorderRotation } from "../lib/rotation";

const criterion = (
  score: number,
  confidence: CriterionScore["confidence"] = "medium",
): CriterionScore => ({
  score,
  confidence,
  evidence: [],
  assumptions: [],
  dataGaps: [],
});
describe("replaceable demo scoring", () => {
  it("computes a weighted mean and responds live to changed weights", () => {
    const scores = { water: criterion(90), soil: criterion(50) };
    expect(calculateWeightedScore(scores, { water: 1, soil: 1 })).toBe(70);
    expect(calculateWeightedScore(scores, { water: 5, soil: 1 })).toBe(83.3);
  });
  it("excludes missing criteria rather than treating them as zero", () => {
    expect(
      calculateWeightedScore(
        { a: criterion(80), b: criterion(0, "none") },
        { a: 1, b: 5 },
      ),
    ).toBe(80);
  });
  it("returns null when no evidence or no usable weights exist", () => {
    expect(
      calculateWeightedScore({ a: criterion(0, "none") }, { a: 1 }),
    ).toBeNull();
    expect(calculateWeightedScore({ a: criterion(50) }, { a: 0 })).toBeNull();
    expect(calculateWeightedScore({}, {})).toBeNull();
  });
  it("clamps out-of-range scores and ignores non-finite values", () => {
    expect(
      calculateWeightedScore(
        { a: criterion(120), b: criterion(NaN) },
        { a: 2, b: 1 },
      ),
    ).toBe(100);
  });
  it("uses conservative confidence and does not mutate the inputs", () => {
    const scores = { a: criterion(80), b: criterion(70, "low") };
    const before = JSON.stringify(scores);
    expect(aggregateConfidence(scores)).toBe("low");
    calculateWeightedScore(scores, { a: 3, b: 5 });
    expect(JSON.stringify(scores)).toBe(before);
    expect(aggregateConfidence({ a: criterion(0, "none") })).toBe("none");
  });
});
describe("rotation timeline", () => {
  it("reorders without changing crop dates or mutating the source", () => {
    const rotation = [
      {
        cropId: "wheat",
        season: "winter" as const,
        months: [11, 5] as [number, number],
      },
      {
        cropId: "chickpea",
        season: "spring" as const,
        months: [2, 6] as [number, number],
      },
    ];
    const moved = reorderRotation(rotation, 0, 1);
    expect(moved[0].cropId).toBe("chickpea");
    expect(moved[1].months).toEqual([11, 5]);
    expect(rotation[0].cropId).toBe("wheat");
  });
  it("supports planting windows that wrap over the end of the year", () => {
    expect(isGrowingMonth(1, [11, 5])).toBe(true);
    expect(isGrowingMonth(8, [11, 5])).toBe(false);
  });
});
