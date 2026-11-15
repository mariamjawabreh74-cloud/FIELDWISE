import {
  ArrowUpRight,
  ChevronRight,
  Droplets,
  Leaf,
  Sprout,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import type { CriterionKey, Strategy, Weights } from "../lib/api/types";
import { CRITERIA } from "../lib/constants";
import { aggregateConfidence, calculateWeightedScore } from "../lib/scoring";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { DataGapChips } from "./DataGapChips";

const icons = {
  existing: Leaf,
  water_conservation: Droplets,
  soil_improvement: Sprout,
};
export function StrategyCard({
  strategy,
  weights,
  demo,
  onEvidence,
  onChoose,
}: {
  strategy: Strategy;
  weights: Weights;
  demo: boolean;
  onEvidence: (criterion: CriterionKey) => void;
  onChoose: () => void;
}) {
  const { t, i18n } = useTranslation();
  const Icon = icons[strategy.kind];
  const score = demo
    ? calculateWeightedScore(strategy.criteria, weights)
    : strategy.totalScore;
  const scoreLabel = t(demo ? "compare.total" : "api.weightedScore");
  const gaps = [
    ...new Set(
      Object.values(strategy.criteria).flatMap(
        (criterion) => criterion.dataGaps,
      ),
    ),
  ];
  const format = new Intl.NumberFormat(i18n.language, {
    maximumFractionDigits: 1,
  });
  return (
    <article className={`strategy-card strategy-${strategy.kind}`}>
      <div className="strategy-card-heading">
        <span className="strategy-icon">
          <Icon size={25} strokeWidth={1.4} />
        </span>
        <span className="strategy-kicker">
          {t(`strategies.${strategy.kind}Short`)}
        </span>
      </div>
      <h2>{t(`strategies.${strategy.kind}`)}</h2>
      <p className="strategy-description">
        {t(`strategies.${strategy.kind}Description`)}
      </p>
      <div className="strategy-score">
        <output
          aria-label={`${scoreLabel} ${t(`strategies.${strategy.kind}`)}`}
          data-testid={`score-${strategy.kind}`}
          aria-live="polite"
        >
          {score === null ? "—" : format.format(score)}
        </output>
        <div>
          <span>{t("compare.outOf")}</span>
          <ConfidenceBadge
            confidence={aggregateConfidence(strategy.criteria)}
          />
        </div>
      </div>
      <p className="strategy-score-label">{scoreLabel}</p>
      <div className="strategy-criteria">
        {CRITERIA.map((criterion) => {
          const value = strategy.criteria[criterion];
          if (!value) return null;
          return (
            <button
              className="criterion-score-row"
              key={criterion}
              onClick={() => onEvidence(criterion)}
              aria-label={`${t(`priorities.${criterion}`)}: ${value.confidence === "none" ? t("compare.missingScore") : value.score}. ${t("compare.evidence")}`}
              aria-description={`${t("common.confidence", { level: t(`confidence.${value.confidence}`) })}. ${value.dataGaps.map((gap) => t(gap, { defaultValue: gap })).join(" · ")}`}
            >
              <div className="criterion-score-top">
                <span>{t(`priorities.${criterion}`)}</span>
                <strong>
                  {value.confidence === "none" ? "—" : value.score}
                </strong>
                <ChevronRight size={14} className="directional" />
              </div>
              <div className="criterion-bar">
                <span
                  style={{
                    inlineSize: `${value.confidence === "none" ? 0 : Math.max(0, Math.min(100, value.score))}%`,
                  }}
                />
              </div>
              <div className="flex items-center justify-between gap-2">
                <ConfidenceBadge confidence={value.confidence} />
                {value.dataGaps.length > 0 && (
                  <span className="badge badge-warning !text-[10px]">
                    {t("common.dataGap")}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
      <div className="strategy-gaps">
        <DataGapChips gaps={gaps.slice(0, 2)} />
      </div>
      <button
        className={`button ${strategy.kind === "water_conservation" ? "button-primary" : "button-secondary"} strategy-choose`}
        onClick={onChoose}
      >
        {t("compare.choose")}
        <ArrowUpRight size={18} className="directional" />
      </button>
    </article>
  );
}
