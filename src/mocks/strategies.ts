import type {
  CriterionKey,
  CriterionScore,
  Recommendation,
  Strategy,
  StrategyKind,
} from "../lib/api/types";
import { CRITERIA } from "../lib/constants";

const evidenceKeys = [
  "water",
  "soil",
  "climate",
  "profit",
  "erosion",
  "diversity",
];
const values: Record<StrategyKind, number[]> = {
  existing: [48, 45, 54, 68, 44, 32],
  water_conservation: [88, 72, 80, 65, 76, 70],
  soil_improvement: [68, 91, 78, 59, 85, 92],
};
function criteria(kind: StrategyKind): Record<CriterionKey, CriterionScore> {
  return Object.fromEntries(
    CRITERIA.map((key, index) => [
      key,
      {
        score: values[kind][index],
        confidence: key === "profit" ? "low" : "medium",
        evidence: [`mock.evidence.${evidenceKeys[index]}`],
        assumptions: [`mock.assumptions.${evidenceKeys[index]}`],
        dataGaps:
          key === "profit"
            ? ["mock.gaps.prices", "mock.gaps.yield"]
            : key === "soil_health"
              ? ["mock.gaps.soilTest"]
              : key === "water_saving"
                ? ["mock.gaps.waterVolume"]
                : ["mock.gaps.fieldObservation"],
      },
    ]),
  ) as Record<CriterionKey, CriterionScore>;
}
export const strategies: Strategy[] = [
  {
    simulated: true,
    kind: "existing",
    criteria: criteria("existing"),
    totalScore: 48.5,
    rotation: [
      { cropId: "wheat", season: "winter", months: [11, 5] },
      { cropId: "tomato", season: "summer", months: [4, 8] },
      { cropId: "wheat", season: "winter", months: [11, 5] },
    ],
    risks: [{ type: "water", text: "mock.risks.water" }],
  },
  {
    simulated: true,
    kind: "water_conservation",
    criteria: criteria("water_conservation"),
    totalScore: 75.2,
    rotation: [
      { cropId: "barley", season: "winter", months: [11, 5] },
      { cropId: "chickpea", season: "spring", months: [2, 6] },
      { cropId: "clover", season: "autumn", months: [10, 3] },
    ],
    risks: [
      { type: "water", text: "mock.risks.water" },
      { type: "market", text: "mock.risks.market" },
    ],
  },
  {
    simulated: true,
    kind: "soil_improvement",
    criteria: criteria("soil_improvement"),
    totalScore: 78.8,
    rotation: [
      { cropId: "fava", season: "winter", months: [11, 4] },
      { cropId: "wheat", season: "winter", months: [11, 5] },
      { cropId: "clover", season: "autumn", months: [10, 3] },
    ],
    risks: [
      { type: "soil", text: "mock.risks.soil" },
      { type: "market", text: "mock.risks.market" },
    ],
  },
];
export const recommendation: Recommendation = {
  simulated: true,
  strategy: "water_conservation",
  summary: "mock.recommendation",
  confidence: "low",
  dataGaps: ["mock.gaps.soilTest", "mock.gaps.waterVolume", "mock.gaps.prices"],
};
