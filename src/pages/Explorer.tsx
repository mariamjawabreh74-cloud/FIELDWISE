import { useState } from "react";
import {
  ArrowUpRight,
  CalendarDays,
  Layers3,
  Mountain,
  SlidersHorizontal,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { LayerKey } from "../lib/api/types";
import { useFarm } from "../hooks/useFarm";
import { useLayer } from "../hooks/useFieldData";
import { FarmGate } from "../components/WizardPage";
import { PageHeader } from "../components/PageHeader";
import { AsyncState, EmptyState } from "../components/AsyncState";
import { LayerToggle } from "../components/LayerToggle";
import { TerrainViewer } from "../components/TerrainViewer";
import { SourcePopover } from "../components/SourcePopover";
import { validLayer } from "../lib/terrain";

const layerKeys: LayerKey[] = [
  "terrain",
  "ndvi",
  "rainfall",
  "soil_moisture",
  "slope",
];
function ExplorerContent() {
  const { t, i18n } = useTranslation();
  const { farm } = useFarm();
  const terrain = useLayer(farm!.id, "terrain");
  const ndvi = useLayer(farm!.id, "ndvi");
  const rainfall = useLayer(farm!.id, "rainfall");
  const moisture = useLayer(farm!.id, "soil_moisture");
  const slope = useLayer(farm!.id, "slope");
  const resources = { terrain, ndvi, rainfall, soil_moisture: moisture, slope };
  const [active, setActive] = useState<LayerKey>("terrain");
  const [exaggeration, setExaggeration] = useState(1.5);
  const [comparison, setComparison] = useState(50);
  const selected = resources[active];
  const date = (value: string) =>
    new Date(value).toLocaleDateString(i18n.language, {
      year: "numeric",
      month: "long",
    });
  return (
    <div className="explorer-page animate-in">
      <PageHeader
        eyebrow={t("explore.eyebrow")}
        title={t("explore.title")}
        subtitle={t("explore.subtitle")}
      />
      <AsyncState resource={terrain}>
        {(surface) =>
          validLayer(surface) ? (
            <>
              <div className="explorer-layout">
                <section className="explorer-view-panel">
                  <AsyncState resource={selected}>
                    {(layer) =>
                      validLayer(layer) ? (
                        <TerrainViewer
                          terrain={surface}
                          overlay={layer}
                          exaggeration={exaggeration}
                          comparison={comparison}
                        />
                      ) : (
                        <EmptyState retry={selected.reload} />
                      )
                    }
                  </AsyncState>
                  <div className="terrain-surface-note">
                    <Mountain size={15} />
                    <span>{t("explore.surfaceOnly")}</span>
                  </div>
                </section>
                <aside className="panel explorer-options">
                  <h2>
                    <Layers3 size={20} />
                    {t("explore.layers")}
                  </h2>
                  <div className="layer-options">
                    {layerKeys.map((key) => (
                      <LayerToggle
                        key={key}
                        layerKey={key}
                        active={active === key}
                        onToggle={() =>
                          setActive((current) =>
                            current === key && key !== "terrain"
                              ? "terrain"
                              : key,
                          )
                        }
                        resolution={resources[key].data?.nativeResolutionM}
                        illustrative={
                          resources[key].data?.illustrative ??
                          surface.illustrative
                        }
                      />
                    ))}
                  </div>
                  <div className="exaggeration-control">
                    <label htmlFor="exaggeration">
                      <SlidersHorizontal size={17} />
                      {t("explore.exaggeration")}
                    </label>
                    <input
                      id="exaggeration"
                      className="range"
                      type="range"
                      min="0.5"
                      max="4"
                      step="0.25"
                      value={exaggeration}
                      onChange={(event) =>
                        setExaggeration(Number(event.target.value))
                      }
                    />
                    <output htmlFor="exaggeration">
                      {t("explore.exaggerationValue", { value: exaggeration })}
                    </output>
                  </div>
                  {selected.data && (
                    <SourcePopover
                      provenance={selected.data.provenance}
                      limitations={selected.data.limitations ?? []}
                      resolution={selected.data.nativeResolutionM}
                    />
                  )}
                </aside>
              </div>
              <section className="panel date-comparison">
                <div className="date-comparison-header">
                  <h2>
                    <CalendarDays size={20} />
                    {t("explore.compareDates")}
                  </h2>
                  <span className="badge">
                    {t(
                      selected.data?.illustrative
                        ? "common.illustrative"
                        : "common.estimate",
                    )}
                  </span>
                </div>
                <div className="date-comparison-slider" dir="ltr">
                  <span>
                    {selected.data
                      ? date(selected.data.dates[0])
                      : date(surface.dates[0])}
                  </span>
                  <input
                    className="range"
                    type="range"
                    min="0"
                    max="100"
                    value={comparison}
                    onChange={(event) =>
                      setComparison(Number(event.target.value))
                    }
                    aria-label={t("explore.comparisonPosition")}
                  />
                  <span>
                    {selected.data
                      ? date(selected.data.dates[1])
                      : date(surface.dates[1])}
                  </span>
                </div>
                <p className="field-hint">
                  {t(
                    selected.data?.illustrative
                      ? "explore.dateHint"
                      : "api.dateComparisonHint",
                  )}
                </p>
              </section>
              <div className="explorer-bottom">
                <p className="field-hint">{t("explore.keyboard")}</p>
                <Link to="/farm/analysis" className="text-link">
                  {t("explore.fallback")}
                  <ArrowUpRight size={17} className="directional" />
                </Link>
              </div>
            </>
          ) : (
            <EmptyState retry={terrain.reload} />
          )
        }
      </AsyncState>
    </div>
  );
}
export default function Explorer() {
  return (
    <FarmGate>
      <ExplorerContent />
    </FarmGate>
  );
}
