import { CircleHelp } from "lucide-react";
import { useTranslation } from "react-i18next";

export function DataGapChips({ gaps }: { gaps: string[] }) {
  const { t } = useTranslation();
  if (!gaps.length) return null;
  return (
    <div className="data-gap-chips" aria-label={t("compare.dataGaps")}>
      {gaps.map((gap, index) => (
        <span key={`${gap}-${index}`}>
          <CircleHelp size={12} aria-hidden="true" />
          {t(gap, { defaultValue: gap })}
        </span>
      ))}
    </div>
  );
}
