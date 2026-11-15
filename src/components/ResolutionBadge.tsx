import { ScanLine } from "lucide-react";
import { useTranslation } from "react-i18next";

export function ResolutionBadge({
  meters,
  illustrative = false,
}: {
  meters?: number;
  illustrative?: boolean;
}) {
  const { t, i18n } = useTranslation();
  const format = new Intl.NumberFormat(i18n.language, {
    maximumFractionDigits: 1,
  });
  const text = illustrative
    ? t("common.illustrative")
    : !meters
      ? t("common.noData")
      : meters >= 1000
        ? t("analysis.regional", { km: format.format(meters / 1000) })
        : t("analysis.local", { m: format.format(meters) });
  return (
    <span className={`resolution-badge ${illustrative ? "illustrative" : ""}`}>
      <ScanLine size={13} aria-hidden="true" />
      {text}
    </span>
  );
}
