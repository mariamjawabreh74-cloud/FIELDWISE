import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { CloudRain, Droplets, Leaf, Mountain, Thermometer } from "lucide-react";
import { useId } from "react";
import { useTranslation } from "react-i18next";
import type { Indicator } from "../lib/api/types";
import { ResolutionBadge } from "./ResolutionBadge";
import { SourcePopover } from "./SourcePopover";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { DataGapChips } from "./DataGapChips";

const iconMap = {
  rainfall: CloudRain,
  temperature: Thermometer,
  soil_moisture: Droplets,
  ndvi: Leaf,
  terrain: Mountain,
};
const colorMap: Record<string, string> = {
  rainfall: "#7e9faa",
  temperature: "#bd9c6f",
  soil_moisture: "#7b9e91",
  ndvi: "#869e69",
  terrain: "#a78f70",
};
export function IndicatorCard({ indicator }: { indicator: Indicator }) {
  const { t, i18n } = useTranslation();
  const id = useId().replace(/:/g, "");
  const Icon = iconMap[indicator.key as keyof typeof iconMap] ?? Leaf;
  const color = colorMap[indicator.key] ?? "#859c70";
  const value =
    indicator.value === null
      ? "—"
      : new Intl.NumberFormat(i18n.language, {
          maximumFractionDigits: indicator.key === "ndvi" ? 2 : 1,
        }).format(indicator.value);
  return (
    <article className="indicator-card">
      <div className="indicator-top">
        <span className={`indicator-symbol indicator-${indicator.key}`}>
          <Icon size={20} strokeWidth={1.6} />
        </span>
        <SourcePopover
          provenance={indicator.provenance}
          limitations={indicator.limitations}
          resolution={indicator.nativeResolutionM}
          iconOnly
        />
      </div>
      <h3>{t(indicator.label, { defaultValue: indicator.label })}</h3>
      <div className="indicator-value">
        <strong>{value}</strong>
        <span>
          {indicator.value === null
            ? t("common.noData")
            : t(indicator.unit, { defaultValue: indicator.unit })}
        </span>
      </div>
      <ConfidenceBadge confidence={indicator.confidence} />
      <div className="indicator-sparkline" aria-hidden="true">
        {indicator.series?.some((sample) => sample.value !== null) && (
          <ResponsiveContainer width="100%" height={48}>
            <AreaChart
              data={indicator.series}
              margin={{ top: 3, right: 0, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.24} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                dataKey="value"
                type="monotone"
                stroke={color}
                strokeWidth={1.7}
                fill={`url(#${id})`}
                isAnimationActive={false}
                connectNulls={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
      <ResolutionBadge meters={indicator.nativeResolutionM} />
      <DataGapChips gaps={indicator.dataGaps.slice(0, 1)} />
    </article>
  );
}
