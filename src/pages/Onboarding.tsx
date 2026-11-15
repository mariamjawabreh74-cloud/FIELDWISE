import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight, Leaf, MapPin, ShieldCheck, Sprout } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useFarm } from "../hooks/useFarm";
import { useApiStatus } from "../hooks/ApiProvider";
import { useLocalState } from "../hooks/useLocalState";
import { WizardPage } from "../components/WizardPage";
import { UnknownOption } from "../components/UnknownOption";
import { WIZARD_STEPS } from "../lib/constants";
import { farmNameSchema } from "../lib/schemas";
import { ErrorState, LoadingState } from "../components/AsyncState";

export default function Onboarding() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const farm = useFarm();
  const { mockMode } = useApiStatus();
  const [name, setName] = useLocalState("fieldwise.new-farm-name", "");
  const [unknown, setUnknown] = useState(false);
  if (farm.loading) return <LoadingState />;
  if (farm.error) return <ErrorState retry={farm.retry} />;
  const resume = !!farm.farm && !farm.farm.id.startsWith("demo-");
  async function start() {
    const request = farmNameSchema.safeParse({ name, unknown });
    if (!request.success) return;
    const result = await farm.createFarm({ name: unknown ? "" : name });
    if (result?.status === "ok") navigate("/farm/location");
  }
  async function demo() {
    const result = await farm.createFarm({ demo: true });
    if (result?.status === "ok") navigate("/farm/location");
  }
  return (
    <WizardPage
      step={0}
      title={t("onboarding.title")}
      subtitle={t("onboarding.subtitle")}
      onNext={start}
    >
      {resume && (
        <div className="resume-card">
          <Sprout size={25} />
          <div>
            <strong>{t("onboarding.draftFound")}</strong>
            <p>{t(farm.farm!.name, { defaultValue: farm.farm!.name })}</p>
          </div>
          <button
            className="button button-secondary"
            onClick={() =>
              navigate(
                WIZARD_STEPS[
                  Math.max(1, Math.min(5, farm.farm!.onboardingStep))
                ].path,
              )
            }
          >
            {t("onboarding.resume")}
            <ArrowUpRight size={18} className="directional" />
          </button>
        </div>
      )}
      <div className="onboarding-grid">
        <div className="panel onboarding-form">
          <span className="large-leaf-icon">
            <Sprout size={31} strokeWidth={1.4} />
          </span>
          <div className="form-field">
            <label htmlFor="farm-name">{t("onboarding.nameLabel")}</label>
            <p className="field-hint">{t("onboarding.nameHint")}</p>
            <input
              id="farm-name"
              className="input"
              value={name}
              disabled={unknown}
              maxLength={100}
              onChange={(event) => setName(event.target.value)}
              placeholder={t("onboarding.namePlaceholder")}
            />
            <UnknownOption checked={unknown} onChange={setUnknown} />
          </div>
          {resume && (
            <p className="field-hint section-gap">
              {t("onboarding.newNotice")}
            </p>
          )}
          {mockMode && (
            <button
              className="demo-farm-link"
              onClick={demo}
              disabled={farm.pending}
            >
              <MapPin size={19} />
              {t("onboarding.demo")}
              <ArrowUpRight size={17} className="directional" />
            </button>
          )}
        </div>
        <aside className="onboarding-aside">
          <div className="onboarding-illustration" aria-hidden="true">
            <span className="illustration-sun" />
            <svg viewBox="0 0 300 200" fill="none">
              <path d="M0 140Q80 65 165 125T300 100V200H0Z" fill="#d3ddbf" />
              <path d="M0 170Q100 105 300 150V200H0Z" fill="#a9bc90" />
              <path
                d="M80 200q85-55 220-28M36 200q95-70 264-48M5 187q99-61 230-49"
                stroke="#e7edda"
                strokeWidth="3"
              />
              <path
                d="M104 144V85m0 37c-22 0-32-14-30-31 19 1 31 12 30 31Zm1-13c-1-23 13-35 34-34 0 23-14 36-34 34Z"
                stroke="#55784b"
                strokeWidth="3"
                fill="#8fa87b"
              />
            </svg>
          </div>
          <ShieldCheck size={25} />
          <h2>{t("onboarding.privacyTitle")}</h2>
          <p>{t("onboarding.privacyBody")}</p>
          <span className="onboarding-aside-foot">
            <Leaf size={16} />
            {t("common.unsure")}
          </span>
        </aside>
      </div>
    </WizardPage>
  );
}
