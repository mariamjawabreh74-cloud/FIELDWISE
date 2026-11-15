import { useTranslation } from "react-i18next";
import type { Confidence } from "../lib/api/types";

export function ConfidenceBadge({
  confidence,
}: {
  confidence: Confidence | "none";
}) {
  const { t } = useTranslation();
  return (
    <span className={`confidence-badge confidence-${confidence}`}>
      <span aria-hidden="true" />
      {t("common.confidence", { level: t(`confidence.${confidence}`) })}
    </span>
  );
}
