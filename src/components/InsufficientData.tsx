import { ArrowUpRight, ClipboardList, Leaf } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { MissingInput } from "../lib/api/types";
import { MISSING_INPUT_ROUTES } from "../lib/constants";

export function InsufficientData({
  missingInputs,
  onResolve,
}: {
  missingInputs: MissingInput[];
  onResolve?: () => void;
}) {
  const { t } = useTranslation();
  return (
    <section
      className="insufficient-panel panel"
      aria-labelledby="insufficient-heading"
      data-testid="insufficient-data"
    >
      <span className="insufficient-icon">
        <Leaf size={33} strokeWidth={1.3} />
      </span>
      <h2 id="insufficient-heading">{t("insufficient.title")}</h2>
      <p className="muted">{t("insufficient.body")}</p>
      <h3 className="insufficient-list-heading">
        <ClipboardList size={19} />
        {t("insufficient.missing")}
      </h3>
      <ul className="missing-input-list">
        {missingInputs.map((input, index) => (
          <li key={`${input}-${index}`}>
            <span>{t(`insufficient.${input}`, { defaultValue: input })}</span>
            <Link
              to={MISSING_INPUT_ROUTES[input] ?? "/start"}
              onClick={onResolve}
              className="button button-secondary button-small"
            >
              {t("insufficient.fix")}
              <ArrowUpRight size={17} className="directional" />
            </Link>
          </li>
        ))}
      </ul>
      <p className="field-hint">{t("insufficient.noRecommendation")}</p>
    </section>
  );
}
