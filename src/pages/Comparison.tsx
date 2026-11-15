import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FlaskConical, Leaf, RotateCcw, SlidersHorizontal } from "lucide-react";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { useTranslation } from "react-i18next";
import type {
  Comparison as ComparisonData,
  CriterionKey,
  Strategy,
  Weights,
} from "../lib/api/types";
import { BALANCED_WEIGHTS, CRITERIA } from "../lib/constants";
import { useFarm } from "../hooks/useFarm";
import { useComparison, useRecommendation } from "../hooks/useFieldData";
import { useSelectedStrategy } from "../hooks/useSelectedStrategy";
import { FarmGate } from "../components/WizardPage";
import { PageHeader } from "../components/PageHeader";
import { AsyncState, EmptyState } from "../components/AsyncState";
import { WeightSlider } from "../components/WeightSlider";
import { StrategyCard } from "../components/StrategyCard";
import { EvidenceDrawer } from "../components/EvidenceDrawer";
import { ConfidenceBadge } from "../components/ConfidenceBadge";
import { DataGapChips } from "../components/DataGapChips";
import { InsufficientData } from "../components/InsufficientData";

const chartColors = ["#b1b6a2", "#749c94", "#93a36d"];
function ComparisonView({ data }: { data: ComparisonData }) {
  const { t, i18n } = useTranslation();
  const { farm } = useFarm();
  const navigate = useNavigate();
  const [, selectStrategy] = useSelectedStrategy(farm!.id);
  const recommendation = useRecommendation(farm!.id);
  const [weights, setWeights] = useState<Weights>(data.weights);
  const [evidence, setEvidence] = useState<{
    strategy: Strategy;
    criterion: CriterionKey;
  } | null>(null);
  const radar = CRITERIA.map((criterion) => ({
    criterion: t(`priorities.${criterion}`),
    ...Object.fromEntries(
      data.strategies.map((strategy) => [
        strategy.kind,
        strategy.criteria[criterion]?.confidence === "none"
          ? null
          : (strategy.criteria[criterion]?.score ?? null),
      ]),
    ),
  }));
  if (recommendation.missing)
    return (
      <InsufficientData missingInputs={recommendation.missing.missing_inputs} />
    );
  return (
    <>
      <section className="panel comparison-weights">
        <div className="comparison-weights-header">
          <div>
            <h2>
              <SlidersHorizontal size={21} />
              {t("compare.weights")}
            </h2>
            <p>
              {t(
                data.simulated
                  ? "compare.weightsHint"
                  : "api.weightsFromBackend",
              )}
            </p>
          </div>
          {data.simulated && (
            <span className="demo-score-label">
              <FlaskConical size={15} />
              {t("compare.demoScoring")}
            </span>
          )}
        </div>
        <fieldset disabled={!data.simulated} className="comparison-weight-grid">
          {CRITERIA.map((criterion) => (
            <WeightSlider
              key={criterion}
              criterion={criterion}
              compact
              value={weights[criterion]}
              onChange={(value) =>
                setWeights((current) => ({ ...current, [criterion]: value }))
              }
            />
          ))}
        </fieldset>
        {data.simulated && (
          <button
            className="text-link reset-weights"
            onClick={() => setWeights({ ...BALANCED_WEIGHTS })}
          >
            <RotateCcw size={15} />
            {t("compare.balanced")}
          </button>
        )}
      </section>
      <div className="strategy-grid">
        {data.strategies.map((strategy) => (
          <StrategyCard
            key={strategy.kind}
            strategy={strategy}
            weights={weights}
            demo={data.simulated}
            onEvidence={(criterion) => setEvidence({ strategy, criterion })}
            onChoose={() => {
              selectStrategy(strategy.kind);
              navigate(`/farm/plan?strategy=${strategy.kind}`);
            }}
          />
        ))}
      </div>
      <div className="comparison-bottom">
        <section className="panel radar-panel">
          <h2>{t("compare.scoreChart")}</h2>
          <p className="field-hint">
            {t(data.simulated ? "compare.legend" : "api.scoreLegend")}
          </p>
          <div
            className="radar-chart"
            dir="ltr"
            role="img"
            aria-label={t("compare.scoreChart")}
          >
            <ResponsiveContainer width="100%" height={310}>
              <RadarChart data={radar} outerRadius="64%">
                <PolarGrid stroke="#e4e9db" />
                <PolarAngleAxis
                  dataKey="criterion"
                  tick={{
                    fill: "#7a8c6c",
                    fontSize: i18n.language === "ar" ? 12 : 10,
                    fontFamily:
                      i18n.language === "ar"
                        ? "IBM Plex Sans Arabic"
                        : "DM Sans",
                  }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tick={false}
                  axisLine={false}
                />
                {data.strategies.map((strategy, index) => (
                  <Radar
                    key={strategy.kind}
                    dataKey={strategy.kind}
                    name={t(`strategies.${strategy.kind}Short`)}
                    stroke={chartColors[index]}
                    fill={chartColors[index]}
                    fillOpacity={0.12}
                    strokeWidth={2}
                    isAnimationActive={false}
                  />
                ))}
                <Tooltip
                  contentStyle={{
                    borderRadius: 10,
                    borderColor: "#dce4d1",
                    fontSize: 13,
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-legend radar-legend">
            {data.strategies.map((strategy, index) => (
              <span key={strategy.kind}>
                <i style={{ background: chartColors[index] }} />
                {t(`strategies.${strategy.kind}Short`)}
              </span>
            ))}
          </div>
        </section>
        <AsyncState resource={recommendation}>
          {(advice) => (
            <aside className="recommendation-note">
              <span className="recommendation-leaf">
                <Leaf size={34} strokeWidth={1.3} />
              </span>
              <h2>{t("compare.recommendation")}</h2>
              <ConfidenceBadge confidence={advice.confidence} />
              <p>{t(advice.summary, { defaultValue: advice.summary })}</p>
              <DataGapChips gaps={advice.dataGaps} />
              <p className="recommendation-disclaimer">
                {t("common.decisionNote")}
              </p>
            </aside>
          )}
        </AsyncState>
      </div>
      <EvidenceDrawer
        strategy={evidence?.strategy ?? null}
        criterion={evidence?.criterion ?? null}
        onClose={() => setEvidence(null)}
      />
    </>
  );
}
function ComparisonContent() {
  const { t } = useTranslation();
  const { farm } = useFarm();
  const comparison = useComparison(farm!.id);
  return (
    <div className="comparison-page animate-in">
      <PageHeader
        eyebrow={t("compare.eyebrow")}
        title={t("compare.title")}
        subtitle={t("compare.subtitle")}
      />
      <AsyncState resource={comparison}>
        {(data) =>
          data.strategies.length ? (
            <ComparisonView data={data} />
          ) : (
            <EmptyState retry={comparison.reload} />
          )
        }
      </AsyncState>
    </div>
  );
}
export default function Comparison() {
  return (
    <FarmGate>
      <ComparisonContent />
    </FarmGate>
  );
}
