import { Check } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { WIZARD_STEPS } from "../lib/constants";

export function Stepper({ current }: { current: number }) {
  const { t } = useTranslation();
  return (
    <nav className="stepper" aria-label={t("onboarding.overview")}>
      <div className="stepper-meta">
        <span>
          {t("onboarding.step", {
            current: current + 1,
            total: WIZARD_STEPS.length,
          })}
        </span>
        <span>{t(WIZARD_STEPS[current].label)}</span>
      </div>
      <progress
        className="stepper-progress"
        value={current + 1}
        max={WIZARD_STEPS.length}
        aria-label={t("common.progress")}
      />
      <ol>
        {WIZARD_STEPS.map((step, index) => (
          <li
            key={step.path}
            className={
              index === current ? "current" : index < current ? "complete" : ""
            }
          >
            <Link
              to={step.path}
              aria-current={index === current ? "step" : undefined}
            >
              <span className="stepper-circle">
                {index < current ? <Check size={15} /> : index + 1}
              </span>
              <span className="stepper-label">{t(step.label)}</span>
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  );
}
