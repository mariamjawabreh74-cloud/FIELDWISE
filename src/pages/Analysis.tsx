import { useState } from "react";
import {
  ArrowUpRight,
  CalendarDays,
  FlaskConical,
  Leaf,
  LoaderCircle,
  MapPin,
  Mountain,
  RefreshCw,
  Satellite,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useFarm } from "../hooks/useFarm";
import { useApiStatus } from "../hooks/ApiProvider";
import { useAnalysis } from "../hooks/useAnalysis";
import { useIndicators } from "../hooks/useFieldData";
import { FarmGate } from "../components/WizardPage";
import { PageHeader } from "../components/PageHeader";
import { AsyncState, EmptyState, ErrorState } from "../components/AsyncState";
import { DatasetCard } from "../components/DatasetCard";
import { IndicatorCard } from "../components/IndicatorCard";
import { EnvironmentalCharts } from "../components/EnvironmentalCharts";

function AnalysisContent() {
  const { t, i18n } = useTranslation();
  const { farm } = useFarm();
  const { mockMode } = useApiStatus();
  const [example, setExample] = useState(false);
  const farmId = example ? "demo-insufficient" : farm!.id;
  const analysis = useAnalysis(farmId);
  const indicators = useIndicators(farmId, analysis.data?.stage === "complete");
  const running =
    analysis.data?.stage === "running" || analysis.data?.stage === "queued";
  const sourcePeriod = analysis.data?.datasets.find(
    (dataset) => dataset.provenance,
  )?.provenance;
  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString(i18n.language, {
      year: "numeric",
      month: "short",
    });
  return (
    <div className="analysis-page animate-in">
      <PageHeader
        eyebrow={t("analysis.eyebrow")}
        title={t("analysis.title")}
        subtitle={t("analysis.subtitle")}
        action={
          <button
            className="button button-primary"
            onClick={() => analysis.start()}
            disabled={analysis.starting || running}
          >
            <RefreshCw size={18} className={running ? "spinner" : ""} />
            {t("analysis.run")}
          </button>
        }
      />
      <div className="farm-context-bar">
        <span>
          <MapPin size={17} />
          {example
            ? t("common.demo")
            : t(farm!.name, { defaultValue: farm!.name })}
        </span>
        <span>
          <CalendarDays size={15} />
          {sourcePeriod
            ? t("api.dataPeriod", {
                start: formatDate(sourcePeriod.periodStart),
                end: formatDate(sourcePeriod.periodEnd),
              })
            : t("analysis.coverage")}
        </span>
      </div>
      {analysis.startError && (
        <ErrorState retry={() => analysis.start()} compact />
      )}
      <AsyncState resource={analysis}>
        {(run) => (
          <>
            {running && (
              <div className="analysis-progress panel" role="status">
                <div>
                  <LoaderCircle className="spinner" size={21} />
                  <span>{t("analysis.running")}</span>
                  <strong>{run.progress}%</strong>
                </div>
                <progress
                  max="100"
                  value={run.progress}
                  className="stepper-progress"
                  aria-label={t("common.progress")}
                />
              </div>
            )}
            {run.stage === "error" && (
              <ErrorState retry={() => analysis.start()} />
            )}
            {run.stage === "complete" ? (
              <AsyncState resource={indicators}>
                {(values) => (
                  <>
                    <div
                      className="indicator-grid"
                      aria-label={t("analysis.indicators")}
                    >
                      {values
                        .filter((indicator) => indicator.primary !== false)
                        .map((indicator) => (
                          <IndicatorCard
                            key={`${indicator.key}-${indicator.derivedFrom[0]}`}
                            indicator={indicator}
                          />
                        ))}
                    </div>
                    <EnvironmentalCharts indicators={values} />
                  </>
                )}
              </AsyncState>
            ) : running ? (
              <div className="analysis-pending">
                <Satellite size={36} strokeWidth={1.2} />
                <p>{t("analysis.running")}</p>
              </div>
            ) : null}
            <section className="section-gap">
              <div className="section-heading">
                <div>
                  <h2>{t("analysis.datasets")}</h2>
                  <p>{t("analysis.datasetsSubtitle")}</p>
                </div>
                <span className="badge">
                  {t("analysis.sourceCount", { count: run.datasets.length })}
                </span>
              </div>
              {run.datasets.length ? (
                <div className="dataset-grid">
                  {run.datasets.map((dataset) => (
                    <DatasetCard
                      key={dataset.dataset}
                      dataset={dataset}
                      onRetry={() => analysis.start()}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState retry={analysis.reload} />
              )}
            </section>
            <div className="insight-next">
              <div>
                <Leaf size={27} strokeWidth={1.4} />
                <p>{t("home.trustBody")}</p>
              </div>
              <div className="button-row">
                <Link to="/farm/explore" className="button button-secondary">
                  <Mountain size={18} />
                  {t("analysis.view3d")}
                </Link>
                <Link to="/farm/compare" className="button button-primary">
                  {t("analysis.viewComparison")}
                  <ArrowUpRight size={18} className="directional" />
                </Link>
              </div>
            </div>
          </>
        )}
      </AsyncState>
      {mockMode && (
        <div className="demo-controls">
          <button
            className="text-link"
            onClick={() => setExample((value) => !value)}
          >
            <FlaskConical size={17} />
            {t(example ? "analysis.restoreDemo" : "analysis.simulationControl")}
          </button>
        </div>
      )}
    </div>
  );
}
export default function Analysis() {
  return (
    <FarmGate>
      <AnalysisContent />
    </FarmGate>
  );
}
