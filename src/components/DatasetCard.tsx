import {
  Check,
  CircleAlert,
  Clock3,
  CloudOff,
  LoaderCircle,
  RefreshCw,
  Satellite,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import type { DatasetStatus } from "../lib/api/types";
import { ResolutionBadge } from "./ResolutionBadge";
import { SourcePopover } from "./SourcePopover";

export function DatasetCard({
  dataset,
  onRetry,
}: {
  dataset: DatasetStatus;
  onRetry: () => void;
}) {
  const { t } = useTranslation();
  const StatusIcon =
    dataset.status === "ok"
      ? Check
      : dataset.status === "running"
        ? LoaderCircle
        : dataset.status === "queued"
          ? Clock3
          : dataset.status === "unavailable"
            ? CloudOff
            : CircleAlert;
  return (
    <article className={`dataset-card dataset-${dataset.status}`}>
      <div className="dataset-top">
        <span className="dataset-symbol">
          <Satellite size={21} strokeWidth={1.4} />
        </span>
        <div>
          <h3>{t(`datasets.${dataset.dataset}`)}</h3>
          <p>{t(`datasets.${dataset.dataset}Detail`)}</p>
        </div>
        <span className={`dataset-status status-${dataset.status}`}>
          <StatusIcon
            size={13}
            className={dataset.status === "running" ? "spinner" : ""}
          />
          {t(`analysis.status.${dataset.status}`)}
        </span>
      </div>
      <div className="dataset-meta">
        <ResolutionBadge meters={dataset.nativeResolutionM} />
        <SourcePopover
          provenance={dataset.provenance}
          limitations={dataset.limitations}
          resolution={dataset.nativeResolutionM}
          iconOnly
        />
      </div>
      {dataset.farmSmallerThanPixel && (
        <p className="dataset-limitation">{t("analysis.smallerThanPixel")}</p>
      )}
      {dataset.status === "partial" && (
        <p className="dataset-limitation warning">
          {t("analysis.partialNote")}
        </p>
      )}
      {dataset.status === "unavailable" && (
        <p className="dataset-limitation warning">
          {t("analysis.unavailableNote")}
        </p>
      )}
      {dataset.status === "error" && (
        <button className="button button-ghost button-small" onClick={onRetry}>
          <RefreshCw size={15} />
          {t("common.retry")}
        </button>
      )}
    </article>
  );
}
