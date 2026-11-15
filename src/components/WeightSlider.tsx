import { useId } from "react";
import {
  CircleDollarSign,
  Droplets,
  Leaf,
  ShieldCheck,
  Sprout,
  Wind,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import type { CriterionKey } from "../lib/api/types";
import { UnknownOption } from "./UnknownOption";

const icons = {
  water_saving: Droplets,
  soil_health: Sprout,
  climate_resilience: Wind,
  profit: CircleDollarSign,
  erosion_protection: ShieldCheck,
  diversity: Leaf,
};
export function WeightSlider({
  criterion,
  value,
  onChange,
  unknown,
  onUnknown,
  compact = false,
}: {
  criterion: CriterionKey;
  value: number;
  onChange: (value: number) => void;
  unknown?: boolean;
  onUnknown?: (checked: boolean) => void;
  compact?: boolean;
}) {
  const { t } = useTranslation();
  const id = useId();
  const Icon = icons[criterion];
  return (
    <div className={`weight-slider ${compact ? "compact" : ""}`}>
      <div className="weight-heading">
        <label htmlFor={id}>
          <Icon size={20} strokeWidth={1.6} />
          {t(`priorities.${criterion}`)}
        </label>
        <output htmlFor={id}>
          {unknown ? "—" : value}
          <span>{unknown ? "" : "/ 5"}</span>
        </output>
      </div>
      <input
        id={id}
        className="range"
        type="range"
        min="1"
        max="5"
        step="1"
        value={value}
        aria-label={t("priorities.weightLabel", {
          criterion: t(`priorities.${criterion}`),
        })}
        aria-valuetext={
          unknown ? t("common.unknown") : t("priorities.value", { value })
        }
        onChange={(event) => onChange(Number(event.target.value))}
      />
      {!compact && (
        <div className="range-labels">
          <span>{t("priorities.low")}</span>
          <span>{t("priorities.high")}</span>
        </div>
      )}
      {onUnknown && (
        <UnknownOption checked={!!unknown} onChange={onUnknown} compact />
      )}
    </div>
  );
}
