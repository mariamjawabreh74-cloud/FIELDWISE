import { ArrowUpRight, Info } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useFarm } from "../hooks/useFarm";
import { useCrops, useScenarios } from "../hooks/useFieldData";
import { FarmGate } from "../components/WizardPage";
import { PageHeader } from "../components/PageHeader";
import { AsyncState } from "../components/AsyncState";
import { RotationTimeline } from "../components/RotationTimeline";

function PlannerContent() {
  const { t } = useTranslation();
  const { farm } = useFarm();
  const scenarios = useScenarios(farm!.id);
  const crops = useCrops();
  return (
    <div className="planner-page animate-in">
      <PageHeader
        eyebrow={t("planner.eyebrow")}
        title={t("planner.title")}
        subtitle={t("planner.subtitle")}
      />
      <div className="notice notice-warning mb-6">
        <Info size={20} />
        {t("planner.demoNotice")}
      </div>
      <AsyncState resource={scenarios}>
        {(strategies) => (
          <AsyncState resource={crops}>
            {(cropList) => (
              <RotationTimeline
                strategies={strategies}
                crops={cropList}
                onSave={(kind, rotation) => scenarios.save(kind, { rotation })}
                pending={scenarios.pending}
                error={scenarios.saveError}
              />
            )}
          </AsyncState>
        )}
      </AsyncState>
      <p className="field-hint section-gap">{t("planner.editNotice")}</p>
      {scenarios.result?.simulated && (
        <p className="field-hint mt-2">{t("api.rotationScoreNote")}</p>
      )}
      <div className="button-row justify-end section-gap">
        <Link to="/farm/compare" className="button button-primary">
          {t("planner.compare")}
          <ArrowUpRight size={19} className="directional" />
        </Link>
      </div>
    </div>
  );
}
export default function Planner() {
  return (
    <FarmGate>
      <PlannerContent />
    </FarmGate>
  );
}
