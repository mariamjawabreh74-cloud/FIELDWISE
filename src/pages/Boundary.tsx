import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Polygon } from "geojson";
import { MapPinned } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useFarm } from "../hooks/useFarm";
import { useDemoFarm } from "../hooks/useFieldData";
import { useApiStatus } from "../hooks/ApiProvider";
import { FarmGate, WizardPage } from "../components/WizardPage";
import { PolygonEditor } from "../components/PolygonEditor";
import { UnknownOption } from "../components/UnknownOption";
import { validateBoundary } from "../lib/geometry";
import { ErrorState } from "../components/AsyncState";

function BoundaryForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const context = useFarm();
  const { mockMode } = useApiStatus();
  const demo = useDemoFarm();
  const [shape, setShape] = useState<Polygon | null>(context.farm!.boundary);
  const [unknown, setUnknown] = useState(context.farm!.boundaryUnknown);
  const [touched, setTouched] = useState(false);
  const validation = validateBoundary(shape);
  function update(value: Polygon | null) {
    setShape(value);
    setTouched(true);
    setUnknown(false);
    context.updateDraft({ boundary: value, boundaryUnknown: false });
  }
  function setUnknownValue(value: boolean) {
    setUnknown(value);
    context.updateDraft({
      boundaryUnknown: value,
      ...(value ? { boundary: null } : {}),
    });
    if (value) setShape(null);
  }
  async function next() {
    setTouched(true);
    if (!unknown && !validation.valid) return;
    const result = await context.saveBoundary({
      boundary: unknown ? null : shape,
      unknown,
    });
    if (result?.status === "ok") navigate("/farm/profile");
  }
  return (
    <WizardPage
      step={2}
      title={t("boundary.title")}
      subtitle={t("boundary.subtitle")}
      onNext={next}
    >
      <div className="panel map-panel">
        <PolygonEditor
          value={shape}
          onChange={update}
          center={context.farm!.location ?? demo.data?.location}
        />
        {mockMode && (
          <div className="mt-5">
            <button
              className="button button-secondary"
              onClick={() => demo.data?.boundary && update(demo.data.boundary)}
              disabled={!demo.data}
            >
              <MapPinned size={19} />
              {t("boundary.useDemo")}
            </button>
          </div>
        )}
        {demo.error && mockMode && <ErrorState retry={demo.reload} compact />}
        {touched && !unknown && validation.errors.length > 0 && (
          <div className="notice notice-warning section-gap" role="alert">
            <ul>
              {validation.errors.map((error) => (
                <li key={error}>{t(`boundary.errors.${error}`)}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <div className="unknown-section">
        <UnknownOption checked={unknown} onChange={setUnknownValue} />
        {unknown && <p className="field-hint">{t("boundary.unknownHint")}</p>}
      </div>
    </WizardPage>
  );
}
export default function Boundary() {
  return (
    <FarmGate>
      <BoundaryForm />
    </FarmGate>
  );
}
