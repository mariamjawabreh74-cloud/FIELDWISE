import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Droplets,
  GripVertical,
  Leaf,
  Save,
  Sprout,
  Wheat,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import type {
  Crop,
  RotationEntry,
  Strategy,
  StrategyKind,
} from "../lib/api/types";
import { isGrowingMonth, reorderRotation } from "../lib/rotation";
import { ErrorState } from "./AsyncState";

const strategyIcons = {
  existing: Leaf,
  water_conservation: Droplets,
  soil_improvement: Sprout,
};
export function RotationTimeline({
  strategies,
  crops,
  onSave,
  pending,
  error,
}: {
  strategies: Strategy[];
  crops: Crop[];
  onSave: (kind: StrategyKind, rotation: RotationEntry[]) => Promise<boolean>;
  pending: boolean;
  error: Error | null;
}) {
  const { t, i18n } = useTranslation();
  const [rotations, setRotations] = useState(
    () =>
      Object.fromEntries(
        strategies.map((strategy) => [strategy.kind, strategy.rotation]),
      ) as Record<StrategyKind, RotationEntry[]>,
  );
  const [dragging, setDragging] = useState<{
    kind: StrategyKind;
    index: number;
  } | null>(null);
  const [saved, setSaved] = useState<StrategyKind | null>(null);
  const [lastSave, setLastSave] = useState<StrategyKind | null>(null);
  function reorder(kind: StrategyKind, from: number, to: number) {
    setRotations((current) => ({
      ...current,
      [kind]: reorderRotation(current[kind], from, to),
    }));
    setSaved(null);
  }
  async function save(kind: StrategyKind) {
    setLastSave(kind);
    if (await onSave(kind, rotations[kind])) setSaved(kind);
  }
  const cropName = (id: string) =>
    crops.find((crop) => crop.id === id)?.names[
      i18n.language === "ar" ? "ar" : "en"
    ] ?? t("common.notProvided");
  return (
    <div className="rotation-timelines">
      {strategies.map((strategy) => {
        const Icon = strategyIcons[strategy.kind];
        return (
          <section
            className={`panel rotation-panel strategy-${strategy.kind}`}
            key={strategy.kind}
          >
            <header className="rotation-heading">
              <span className="strategy-icon">
                <Icon size={23} strokeWidth={1.5} />
              </span>
              <div>
                <span className="rotation-kicker">
                  {t(`strategies.${strategy.kind}Short`)}
                </span>
                <h2>{t(`strategies.${strategy.kind}`)}</h2>
              </div>
              <button
                className="button button-secondary button-small"
                onClick={() => save(strategy.kind)}
                disabled={pending}
              >
                {saved === strategy.kind ? (
                  <Check size={17} />
                ) : (
                  <Save size={17} />
                )}
                <span>
                  {t(
                    saved === strategy.kind
                      ? "common.savedChanges"
                      : "planner.save",
                  )}
                </span>
              </button>
            </header>
            <div className="rotation-season-grid">
              {rotations[strategy.kind].map((entry, index) => {
                const crop = crops.find((item) => item.id === entry.cropId);
                return (
                  <article
                    key={`${index}-${entry.cropId}`}
                    className={`rotation-crop ${dragging?.kind === strategy.kind && dragging.index === index ? "is-dragging" : ""}`}
                    draggable
                    onDragStart={(event) => {
                      setDragging({ kind: strategy.kind, index });
                      event.dataTransfer.effectAllowed = "move";
                      event.dataTransfer.setData("text/plain", String(index));
                    }}
                    onDragOver={(event) => {
                      if (dragging?.kind === strategy.kind)
                        event.preventDefault();
                    }}
                    onDragEnd={() => setDragging(null)}
                    onDrop={(event) => {
                      event.preventDefault();
                      if (dragging?.kind === strategy.kind)
                        reorder(strategy.kind, dragging.index, index);
                      setDragging(null);
                    }}
                    aria-label={t("planner.drag", {
                      crop: cropName(entry.cropId),
                    })}
                  >
                    <div className="rotation-crop-top">
                      <span className="season-label">
                        {String(index + 1).padStart(2, "0")} <span>·</span>{" "}
                        {t(`seasons.${entry.season}`)}
                      </span>
                      <GripVertical size={18} />
                    </div>
                    <div className="crop-name-row">
                      <span
                        className="crop-symbol"
                        style={{
                          color: crop?.color,
                          background: `${crop?.color ?? "#8fa780"}18`,
                        }}
                      >
                        {["wheat", "barley"].includes(entry.cropId) ? (
                          <Wheat size={29} strokeWidth={1.3} />
                        ) : (
                          <Sprout size={29} strokeWidth={1.3} />
                        )}
                      </span>
                      <div>
                        <h3>{cropName(entry.cropId)}</h3>
                        <p>
                          {t("planner.cropTiming", {
                            start: t(`monthsShort.${entry.months[0]}`),
                            end: t(`monthsShort.${entry.months[1]}`),
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="crop-months" aria-hidden="true">
                      {Array.from({ length: 12 }, (_, month) => (
                        <span
                          key={month}
                          className={
                            isGrowingMonth(month + 1, entry.months)
                              ? "growing"
                              : ""
                          }
                          style={
                            isGrowingMonth(month + 1, entry.months)
                              ? { background: crop?.color }
                              : undefined
                          }
                        />
                      ))}
                    </div>
                    <div className="crop-reorder-controls">
                      <button
                        className="icon-button"
                        onClick={() => reorder(strategy.kind, index, index - 1)}
                        disabled={index === 0}
                        aria-label={t("planner.moveEarlier", {
                          crop: cropName(entry.cropId),
                        })}
                      >
                        <ArrowLeft size={18} className="directional" />
                      </button>
                      <span>
                        {t("history.order")} {index + 1}
                      </span>
                      <button
                        className="icon-button"
                        onClick={() => reorder(strategy.kind, index, index + 1)}
                        disabled={index === rotations[strategy.kind].length - 1}
                        aria-label={t("planner.moveLater", {
                          crop: cropName(entry.cropId),
                        })}
                      >
                        <ArrowRight size={18} className="directional" />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}
      {error && (
        <ErrorState
          compact
          retry={() => {
            if (lastSave) void save(lastSave);
          }}
        />
      )}
      <p className="sr-only" role="status">
        {saved ? t("planner.saved") : ""}
      </p>
    </div>
  );
}
