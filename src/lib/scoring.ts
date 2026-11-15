import type { Confidence, CriterionScore } from "./api/types";

/** DEMO SCORING — replace with backend. No agronomic model or prediction is implied. */
export function calculateWeightedScore(
  criteria: Record<string, CriterionScore>,
  weights: Record<string, number>,
): number | null {
  let weightedSum = 0;
  let totalWeight = 0;
  for (const [key, criterion] of Object.entries(criteria)) {
    const weight = weights[key];
    if (
      criterion.confidence === "none" ||
      !Number.isFinite(criterion.score) ||
      !Number.isFinite(weight) ||
      weight <= 0
    )
      continue;
    const safeWeight = Math.min(5, weight);
    weightedSum += Math.max(0, Math.min(100, criterion.score)) * safeWeight;
    totalWeight += safeWeight;
  }
  return totalWeight ? Math.round((weightedSum / totalWeight) * 10) / 10 : null;
}

/** Conservative display confidence: the least certain scored criterion. */
export function aggregateConfidence(
  criteria: Record<string, CriterionScore>,
): Confidence | "none" {
  const scored = Object.values(criteria).filter(
    (item) => item.confidence !== "none",
  );
  if (!scored.length) return "none";
  if (
    scored.some((item) => item.confidence === "low") ||
    scored.length < Object.keys(criteria).length
  )
    return "low";
  return scored.some((item) => item.confidence === "medium")
    ? "medium"
    : "high";
}
