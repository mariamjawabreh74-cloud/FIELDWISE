import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowDown, ArrowUp, Plus, Sprout, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useFarm } from "../hooks/useFarm";
import { useCrops } from "../hooks/useFieldData";
import type { CropHistoryEntry } from "../lib/api/types";
import { cropHistorySchema } from "../lib/schemas";
import { FarmGate, WizardPage } from "../components/WizardPage";
import { UnknownOption } from "../components/UnknownOption";
import { AsyncState } from "../components/AsyncState";

function HistoryForm() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const context = useFarm();
  const crops = useCrops();
  const [entries, setEntries] = useState(context.farm!.cropHistory);
  const [unknown, setUnknown] = useState(context.farm!.historyUnknown);
  const [error, setError] = useState(false);
  function update(next: CropHistoryEntry[]) {
    setEntries(next);
    context.updateDraft({ cropHistory: next });
    setError(false);
  }
  function edit(id: string, patch: Partial<CropHistoryEntry>) {
    update(
      entries.map((entry) =>
        entry.id === id ? { ...entry, ...patch } : entry,
      ),
    );
  }
  function add() {
    setUnknown(false);
    context.updateDraft({ historyUnknown: false });
    update([
      ...entries,
      {
        id: crypto.randomUUID(),
        cropId: null,
        season: "unknown",
        plantedMonth: null,
        harvestedMonth: null,
        fieldFraction: null,
        timing: "unknown",
      },
    ]);
  }
  function reorder(index: number, direction: number) {
    const next = [...entries];
    [next[index], next[index + direction]] = [
      next[index + direction],
      next[index],
    ];
    update(next);
  }
  async function next() {
    const result = cropHistorySchema.safeParse({ entries, unknown });
    if (!result.success) {
      setError(true);
      return;
    }
    const response = await context.saveCropHistory({
      entries: unknown ? [] : entries,
      unknown,
    });
    if (response?.status === "ok") navigate("/farm/priorities");
  }
  const monthSelect = (
    value: number | null,
    onChange: (value: number | null) => void,
    id: string,
  ) => (
    <select
      className="select"
      id={id}
      value={value ?? ""}
      onChange={(event) =>
        onChange(event.target.value ? Number(event.target.value) : null)
      }
    >
      <option value="">{t("common.unknown")}</option>
      {Array.from({ length: 12 }, (_, index) => (
        <option value={index + 1} key={index}>
          {t(`months.${index + 1}`)}
        </option>
      ))}
    </select>
  );
  return (
    <WizardPage
      step={4}
      title={t("history.title")}
      subtitle={t("history.subtitle")}
      onNext={next}
    >
      <AsyncState resource={crops}>
        {(cropList) => (
          <div className="stack">
            <div className="history-controls">
              <UnknownOption
                checked={unknown}
                onChange={(value) => {
                  setUnknown(value);
                  context.updateDraft({ historyUnknown: value });
                  setError(false);
                }}
              />
              <button
                className="button button-secondary"
                type="button"
                onClick={add}
              >
                <Plus size={18} />
                {t("history.add")}
              </button>
            </div>
            {unknown ? (
              <div className="notice">
                <Sprout size={22} />
                {t("history.unknownHint")}
              </div>
            ) : !entries.length ? (
              <div className="panel empty-history">
                <Sprout size={30} />
                <p>{t("history.empty")}</p>
                <button className="button button-primary" onClick={add}>
                  <Plus size={18} />
                  {t("history.add")}
                </button>
              </div>
            ) : (
              entries.map((entry, index) => (
                <section className="panel crop-history-card" key={entry.id}>
                  <div className="crop-history-heading">
                    <span className="crop-order">{index + 1}</span>
                    <h2>
                      {entry.cropId
                        ? (cropList.find((crop) => crop.id === entry.cropId)
                            ?.names[i18n.language === "ar" ? "ar" : "en"] ??
                          t("history.crop"))
                        : t("history.crop")}
                    </h2>
                    <div className="ms-auto flex">
                      <button
                        className="icon-button"
                        type="button"
                        onClick={() => reorder(index, -1)}
                        disabled={index === 0}
                        aria-label={t("history.moveUp")}
                      >
                        <ArrowUp size={18} />
                      </button>
                      <button
                        className="icon-button"
                        type="button"
                        onClick={() => reorder(index, 1)}
                        disabled={index === entries.length - 1}
                        aria-label={t("history.moveDown")}
                      >
                        <ArrowDown size={18} />
                      </button>
                      <button
                        className="icon-button"
                        type="button"
                        onClick={() =>
                          update(entries.filter((item) => item.id !== entry.id))
                        }
                        aria-label={t("history.remove")}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                  <div className="form-grid">
                    <div className="form-field">
                      <label htmlFor={`crop-${entry.id}`}>
                        {t("history.crop")}
                      </label>
                      <select
                        id={`crop-${entry.id}`}
                        className="select"
                        value={entry.cropId ?? ""}
                        onChange={(event) =>
                          edit(entry.id, { cropId: event.target.value || null })
                        }
                      >
                        <option value="">{t("common.unknown")}</option>
                        {cropList.map((crop) => (
                          <option key={crop.id} value={crop.id}>
                            {crop.names[i18n.language === "ar" ? "ar" : "en"]}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-field">
                      <label htmlFor={`season-${entry.id}`}>
                        {t("history.season")}
                      </label>
                      <select
                        id={`season-${entry.id}`}
                        className="select"
                        value={entry.season}
                        onChange={(event) =>
                          edit(entry.id, {
                            season: event.target
                              .value as CropHistoryEntry["season"],
                          })
                        }
                      >
                        {[
                          "unknown",
                          "winter",
                          "spring",
                          "summer",
                          "autumn",
                        ].map((season) => (
                          <option key={season} value={season}>
                            {t(`seasons.${season}`)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-field">
                      <label htmlFor={`planted-${entry.id}`}>
                        {t("history.planted")}
                      </label>
                      {monthSelect(
                        entry.plantedMonth,
                        (month) => edit(entry.id, { plantedMonth: month }),
                        `planted-${entry.id}`,
                      )}
                    </div>
                    <div className="form-field">
                      <label htmlFor={`harvested-${entry.id}`}>
                        {t("history.harvested")}
                      </label>
                      {monthSelect(
                        entry.harvestedMonth,
                        (month) => edit(entry.id, { harvestedMonth: month }),
                        `harvested-${entry.id}`,
                      )}
                    </div>
                    <div className="form-field">
                      <label htmlFor={`timing-${entry.id}`}>
                        {t("history.timing")}
                      </label>
                      <select
                        id={`timing-${entry.id}`}
                        className="select"
                        value={entry.timing}
                        onChange={(event) =>
                          edit(entry.id, {
                            timing: event.target
                              .value as CropHistoryEntry["timing"],
                          })
                        }
                      >
                        <option value="unknown">{t("common.unknown")}</option>
                        <option value="current">{t("history.current")}</option>
                        <option value="past">{t("history.past")}</option>
                      </select>
                    </div>
                    <div className="form-field">
                      <label htmlFor={`fraction-${entry.id}`}>
                        {t("history.fraction")}{" "}
                        <span className="badge">
                          {entry.fieldFraction === null
                            ? t("common.unknown")
                            : `${Math.round(entry.fieldFraction * 100)}%`}
                        </span>
                      </label>
                      <input
                        id={`fraction-${entry.id}`}
                        className="range"
                        type="range"
                        min="0.05"
                        max="1"
                        step="0.05"
                        value={entry.fieldFraction ?? 0.5}
                        onChange={(event) =>
                          edit(entry.id, {
                            fieldFraction: Number(event.target.value),
                          })
                        }
                      />
                      <UnknownOption
                        compact
                        checked={entry.fieldFraction === null}
                        onChange={() => edit(entry.id, { fieldFraction: null })}
                      />
                    </div>
                  </div>
                </section>
              ))
            )}
            {error && (
              <p className="field-error" role="alert">
                {t("history.invalidCrop")}
              </p>
            )}
          </div>
        )}
      </AsyncState>
    </WizardPage>
  );
}
export default function CropHistory() {
  return (
    <FarmGate>
      <HistoryForm />
    </FarmGate>
  );
}
