import {
  Area,
  CartesianGrid,
  ComposedChart,
  Bar,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useTranslation } from "react-i18next";
import type { Indicator } from "../lib/api/types";
import { SourcePopover } from "./SourcePopover";
import { ResolutionBadge } from "./ResolutionBadge";

export function EnvironmentalCharts({
  indicators,
}: {
  indicators: Indicator[];
}) {
  const { t, i18n } = useTranslation();
  const rainfall = indicators.find(
    (item) => item.primary !== false && item.key === "rainfall",
  );
  const temperature = indicators.find(
    (item) => item.primary !== false && item.key === "temperature",
  );
  const ndvi = indicators.find(
    (item) => item.primary !== false && item.key === "ndvi",
  );
  const moisture = indicators.find(
    (item) => item.primary !== false && item.key === "soil_moisture",
  );
  const rtl = i18n.dir() === "rtl";
  const makeData = (first: Indicator, second?: Indicator) =>
    first.series?.map((sample) => ({
      date: t(`monthsShort.${Number(sample.date.slice(5, 7))}`),
      first: sample.value,
      second:
        second?.series?.find((other) => other.date === sample.date)?.value ??
        null,
    })) ?? [];
  const axis = {
    fontSize: 11,
    fontFamily: i18n.language === "ar" ? "IBM Plex Sans Arabic" : "DM Sans",
    fill: "#8a947f",
  };
  return (
    <div className="environmental-charts">
      {[
        [rainfall, temperature, "rainfallTrend"],
        [ndvi, moisture, "vegetationTrend"],
      ].map(([firstRaw, secondRaw, title], index) => {
        const first = firstRaw as Indicator | undefined,
          second = secondRaw as Indicator | undefined;
        if (!first) return null;
        const series = makeData(first, second);
        const formatDate = (date: string) =>
          new Date(date).toLocaleDateString(i18n.language, {
            month: "short",
            year: "numeric",
          });
        const periodNote = `${first.simulated ? `${t("common.illustrative")} · ` : ""}${t("api.seriesPeriod", { start: formatDate(first.provenance.periodStart), end: formatDate(first.provenance.periodEnd) })}`;
        return (
          <section className="panel chart-panel" key={String(title)}>
            <div className="chart-heading">
              <h2>{t(`analysis.${title}`)}</h2>
              <SourcePopover
                provenance={first.provenance}
                additionalSources={second ? [second.provenance] : []}
                limitations={[
                  ...new Set([
                    ...first.limitations,
                    ...(second?.limitations ?? []),
                  ]),
                ]}
                resolution={first.nativeResolutionM}
                iconOnly
              />
            </div>
            <div className="chart-legend">
              <span>
                <i style={{ background: index ? "#8da16b" : "#9eb6c0" }} />
                {t(first.label)}
              </span>
              {second && (
                <span>
                  <i style={{ background: index ? "#7eaaa0" : "#c6a37b" }} />
                  {t(second.label)}
                </span>
              )}
            </div>
            <div
              className="environmental-chart"
              role="img"
              aria-label={`${t(`analysis.${title}`)}. ${periodNote}`}
              dir="ltr"
            >
              {series.some((sample) => sample.first !== null) ? (
                <ResponsiveContainer width="100%" height={225}>
                  <ComposedChart
                    data={series}
                    margin={{ top: 17, right: 2, bottom: 0, left: -20 }}
                    accessibilityLayer
                  >
                    <defs>
                      <linearGradient
                        id={`environment-fill-${index}`}
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#91a775"
                          stopOpacity={0.25}
                        />
                        <stop
                          offset="100%"
                          stopColor="#91a775"
                          stopOpacity={0.02}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      stroke="#edf0e7"
                      vertical={false}
                      strokeDasharray="3 4"
                    />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={axis}
                      reversed={rtl}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      yAxisId="first"
                      axisLine={false}
                      tickLine={false}
                      tick={axis}
                      domain={index ? [0, 1] : [0, "auto"]}
                    />
                    <YAxis
                      yAxisId="second"
                      orientation="right"
                      axisLine={false}
                      tickLine={false}
                      tick={axis}
                      width={35}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#fffef9",
                        border: "1px solid #dce4d3",
                        borderRadius: 10,
                        fontSize: 14,
                        direction: i18n.dir(),
                      }}
                      formatter={(value, name) => [
                        value,
                        t(
                          name === "first"
                            ? first.label
                            : (second?.label ?? first.label),
                        ),
                      ]}
                    />
                    {index === 0 ? (
                      <Bar
                        dataKey="first"
                        yAxisId="first"
                        fill="#aec3cb"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={21}
                        isAnimationActive={false}
                      />
                    ) : (
                      <Area
                        dataKey="first"
                        yAxisId="first"
                        stroke="#8a9f6a"
                        fill={`url(#environment-fill-${index})`}
                        strokeWidth={2.3}
                        type="monotone"
                        connectNulls={false}
                        isAnimationActive={false}
                      />
                    )}
                    <Line
                      dataKey="second"
                      yAxisId="second"
                      stroke={index ? "#7eaaa0" : "#c6a37b"}
                      strokeWidth={2}
                      dot={false}
                      type="monotone"
                      connectNulls={false}
                      isAnimationActive={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <p className="field-hint">{t("common.noData")}</p>
              )}
            </div>
            <div className="chart-resolution">
              <ResolutionBadge meters={first.nativeResolutionM} />
              {second && <ResolutionBadge meters={second.nativeResolutionM} />}
            </div>
            <p className="chart-note">{periodNote}</p>
          </section>
        );
      })}
    </div>
  );
}
