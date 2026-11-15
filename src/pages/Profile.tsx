import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import {
  Check,
  ChevronDown,
  Droplets,
  FlaskConical,
  Sprout,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useFarm } from "../hooks/useFarm";
import type { FarmProfile } from "../lib/api/types";
import { emptyProfileValues, profileSchema } from "../lib/schemas";
import { FarmGate, WizardPage } from "../components/WizardPage";
import { UnknownOption } from "../components/UnknownOption";

function SoilTexture({ kind }: { kind: string }) {
  return (
    <svg viewBox="0 0 180 70" role="presentation">
      <rect
        width="180"
        height="70"
        rx="8"
        fill={
          kind === "clay" ? "#c2a18b" : kind === "sandy" ? "#dcc8a4" : "#a78f70"
        }
      />
      {kind === "clay" ? (
        <g stroke="#8c6d57" strokeWidth="2" opacity=".6" fill="none">
          <path d="m0 15 32 12 30-22 40 18 38-21 40 14M0 58l34-31 29 23 39-27 26 30 52-37M34 27l-2 43m31-20 12 20m53-17-5 17m17-68-12 51" />
        </g>
      ) : (
        Array.from({ length: kind === "sandy" ? 52 : 35 }, (_, index) => (
          <ellipse
            key={index}
            cx={((index * 37 + 13) % 175) + 2}
            cy={((index * 19 + 7) % 66) + 2}
            rx={kind === "sandy" ? 2 : 4 + (index % 3)}
            ry={kind === "sandy" ? 1.4 : 2.5 + (index % 2)}
            fill={
              index % 3 ? (kind === "sandy" ? "#b99c6e" : "#756448") : "#e1d1ad"
            }
            opacity=".65"
          />
        ))
      )}
    </svg>
  );
}
function ProfileForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const context = useFarm();
  const {
    register,
    watch,
    setValue,
    getValues,
    handleSubmit,
    formState: { errors },
  } = useForm<FarmProfile>({
    resolver: zodResolver(profileSchema),
    defaultValues: context.farm!.profile ?? emptyProfileValues,
  });
  const soil = watch("soilType"),
    equipment = watch("equipment");
  const updateDraft = context.updateDraft;
  useEffect(() => {
    const subscription = watch((value) =>
      updateDraft({ profile: value as FarmProfile }),
    );
    return () => subscription.unsubscribe();
  }, [watch, updateDraft]);
  const submit = handleSubmit(async (values) => {
    const response = await context.saveProfile(values);
    if (response?.status === "ok") navigate("/farm/history");
  });
  const testFields = [
    "ph",
    "organicMatter",
    "nitrogen",
    "phosphorus",
    "potassium",
  ] as const;
  return (
    <WizardPage
      step={3}
      title={t("profile.title")}
      subtitle={t("profile.subtitle")}
      formId="profile-form"
      onSaveDraft={() => context.updateDraft({ profile: getValues() })}
    >
      <form id="profile-form" onSubmit={submit} className="stack" noValidate>
        <section className="panel">
          <h2 className="form-section-title">
            <Sprout size={23} strokeWidth={1.5} />
            {t("profile.soilTitle")}
          </h2>
          <div
            className="soil-grid"
            role="radiogroup"
            aria-label={t("profile.soilTitle")}
          >
            {(["clay", "sandy", "loam"] as const).map((kind) => (
              <button
                type="button"
                key={kind}
                className={`soil-card ${soil === kind ? "selected" : ""}`}
                role="radio"
                aria-checked={soil === kind}
                onClick={() =>
                  setValue("soilType", kind, { shouldDirty: true })
                }
              >
                <SoilTexture kind={kind} />
                <strong>{t(`profile.${kind}`)}</strong>
                <span>{t(`profile.${kind}Hint`)}</span>
                {soil === kind && <Check size={17} className="soil-selected" />}
              </button>
            ))}
          </div>
          <UnknownOption
            checked={soil === "unknown"}
            onChange={() =>
              setValue("soilType", "unknown", { shouldDirty: true })
            }
          />
          <details className="soil-test-details">
            <summary>
              <FlaskConical size={20} />
              {t("profile.soilTest")}
              <span className="badge">{t("common.optional")}</span>
              <ChevronDown size={18} />
            </summary>
            <p className="field-hint mb-5">{t("profile.soilTestHint")}</p>
            <div className="soil-test-grid">
              {testFields.map((field) => (
                <div className="form-field" key={field}>
                  <label htmlFor={`soil-${field}`}>
                    {t(`profile.${field}`)}
                  </label>
                  <input
                    id={`soil-${field}`}
                    type="number"
                    step="any"
                    min="0"
                    max={
                      field === "ph"
                        ? 14
                        : field === "organicMatter"
                          ? 100
                          : undefined
                    }
                    className="input"
                    aria-invalid={!!errors.soilTest?.[field]}
                    {...register(`soilTest.${field}`, {
                      setValueAs: (value) =>
                        value === "" || value === null ? null : Number(value),
                    })}
                  />
                  {errors.soilTest?.[field] && (
                    <p className="field-error">
                      {t(
                        errors.soilTest[field]?.message ?? "profile.validation",
                      )}
                    </p>
                  )}
                  <UnknownOption
                    compact
                    checked={watch(`soilTest.${field}`) === null}
                    onChange={() =>
                      setValue(`soilTest.${field}`, null, {
                        shouldValidate: true,
                      })
                    }
                  />
                </div>
              ))}
            </div>
          </details>
        </section>
        <section className="panel">
          <h2 className="form-section-title">
            <Droplets size={23} strokeWidth={1.5} />
            {t("profile.waterTitle")}
          </h2>
          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="irrigation">{t("profile.irrigation")}</label>
              <select
                id="irrigation"
                className="select"
                {...register("irrigation")}
              >
                <option value="unknown">{t("common.unknown")}</option>
                {["drip", "rainfed", "sprinkler", "flood"].map((value) => (
                  <option key={value} value={value}>
                    {t(`profile.${value}`)}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="water">{t("profile.water")}</label>
              <select
                id="water"
                className="select"
                {...register("waterAvailability")}
              >
                <option value="unknown">{t("common.unknown")}</option>
                {["reliable", "seasonal", "limited"].map((value) => (
                  <option key={value} value={value}>
                    {t(`profile.${value}`)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="divider" />
          <fieldset>
            <legend className="field-label">{t("profile.equipment")}</legend>
            <div className="equipment-grid">
              {["tractor", "handTools", "pump", "seeder"].map((item) => (
                <label className="check-label" key={item}>
                  <input
                    className="checkbox"
                    type="checkbox"
                    checked={
                      Array.isArray(equipment) && equipment.includes(item)
                    }
                    onChange={(event) => {
                      const current = Array.isArray(equipment) ? equipment : [];
                      setValue(
                        "equipment",
                        event.target.checked
                          ? [...current, item]
                          : current.filter((value) => value !== item),
                        { shouldDirty: true },
                      );
                    }}
                  />
                  {t(`profile.${item}`)}
                </label>
              ))}
            </div>
            <UnknownOption
              checked={equipment === "unknown"}
              onChange={(value) =>
                setValue("equipment", value ? "unknown" : [], {
                  shouldDirty: true,
                })
              }
            />
          </fieldset>
          <div className="divider" />
          <div className="form-grid">
            {(["budget", "labor"] as const).map((field) => (
              <div className="form-field" key={field}>
                <label htmlFor={field}>{t(`profile.${field}`)}</label>
                <select id={field} className="select" {...register(field)}>
                  <option value="unknown">{t("common.unknown")}</option>
                  {["low", "medium", "high"].map((value) => (
                    <option key={value} value={value}>
                      {t(
                        `profile.${field}${value[0].toUpperCase()}${value.slice(1)}`,
                      )}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </section>
      </form>
    </WizardPage>
  );
}
export default function Profile() {
  return (
    <FarmGate>
      <ProfileForm />
    </FarmGate>
  );
}
