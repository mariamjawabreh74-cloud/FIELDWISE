import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Droplets, Leaf, SlidersHorizontal, Sprout } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useFarm } from "../hooks/useFarm";
import type { CriterionKey, Weights } from "../lib/api/types";
import { BALANCED_WEIGHTS, CRITERIA } from "../lib/constants";
import { prioritiesSchema } from "../lib/schemas";
import { FarmGate, WizardPage } from "../components/WizardPage";
import { WeightSlider } from "../components/WeightSlider";
import { UnknownOption } from "../components/UnknownOption";

function PrioritiesForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const context = useFarm();
  const [weights, setWeights] = useState<Weights>(
    context.farm!.priorities ?? BALANCED_WEIGHTS,
  );
  const [unknownKeys, setUnknownKeys] = useState<CriterionKey[]>(
    context.farm!.unknownPriorities ??
      (context.farm!.prioritiesUnknown || !context.farm!.priorities
        ? [...CRITERIA]
        : []),
  );
  function update(next: Weights, unknown = unknownKeys) {
    setWeights(next);
    setUnknownKeys(unknown);
    context.updateDraft({
      priorities: next,
      prioritiesUnknown: unknown.length === CRITERIA.length,
      unknownPriorities: unknown,
    });
  }
  function preset(kind: string) {
    const next =
      kind === "water"
        ? {
            water_saving: 5,
            soil_health: 3,
            climate_resilience: 4,
            profit: 3,
            erosion_protection: 3,
            diversity: 2,
          }
        : kind === "soil"
          ? {
              water_saving: 3,
              soil_health: 5,
              climate_resilience: 3,
              profit: 2,
              erosion_protection: 4,
              diversity: 5,
            }
          : { ...BALANCED_WEIGHTS };
    update(next, []);
  }
  async function next() {
    const request = {
      weights,
      unknown: unknownKeys.length === CRITERIA.length,
      unknownCriteria: unknownKeys,
    };
    if (!prioritiesSchema.safeParse(request).success) return;
    const response = await context.savePriorities(request);
    if (response?.status === "ok") navigate("/farm/analysis");
  }
  return (
    <WizardPage
      step={5}
      title={t("priorities.title")}
      subtitle={t("priorities.subtitle")}
      onNext={next}
      nextLabel={t("onboarding.finish")}
    >
      <div className="panel">
        <h2 className="form-section-title">{t("priorities.presets")}</h2>
        <div className="preset-row">
          <button
            className="preset-button water"
            onClick={() => preset("water")}
          >
            <Droplets size={21} />
            {t("priorities.saveWater")}
          </button>
          <button className="preset-button soil" onClick={() => preset("soil")}>
            <Sprout size={21} />
            {t("priorities.improveSoil")}
          </button>
          <button className="preset-button" onClick={() => preset("balanced")}>
            <SlidersHorizontal size={21} />
            {t("priorities.balanced")}
          </button>
        </div>
        <div className="priority-grid">
          {CRITERIA.map((criterion) => (
            <WeightSlider
              key={criterion}
              criterion={criterion}
              value={weights[criterion]}
              unknown={unknownKeys.includes(criterion)}
              onChange={(value) =>
                update(
                  { ...weights, [criterion]: value },
                  unknownKeys.filter((key) => key !== criterion),
                )
              }
              onUnknown={(checked) =>
                update(
                  { ...weights, ...(checked ? { [criterion]: 3 } : {}) },
                  checked
                    ? [...new Set([...unknownKeys, criterion])]
                    : unknownKeys.filter((key) => key !== criterion),
                )
              }
            />
          ))}
        </div>
        <div className="divider" />
        <UnknownOption
          checked={unknownKeys.length === CRITERIA.length}
          onChange={(checked) =>
            update({ ...BALANCED_WEIGHTS }, checked ? [...CRITERIA] : [])
          }
        />
        {unknownKeys.length > 0 && (
          <p className="field-hint mt-2">{t("priorities.unknownHint")}</p>
        )}
      </div>
      <div className="notice section-gap">
        <Leaf size={22} />
        {t("common.decisionNote")}
      </div>
    </WizardPage>
  );
}
export default function Priorities() {
  return (
    <FarmGate>
      <PrioritiesForm />
    </FarmGate>
  );
}
