import { useState, type ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  LoaderCircle,
  Save,
  ShieldCheck,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Stepper } from "./Stepper";
import { PageHeader } from "./PageHeader";
import { useFarm } from "../hooks/useFarm";
import { WIZARD_STEPS } from "../lib/constants";
import { EmptyState, ErrorState, LoadingState } from "./AsyncState";
import { InsufficientData } from "./InsufficientData";

export function FarmGate({ children }: { children: ReactNode }) {
  const context = useFarm();
  if (context.loading) return <LoadingState />;
  if (context.error) return <ErrorState retry={context.retry} />;
  if (context.missing)
    return (
      <InsufficientData
        missingInputs={context.missing.missing_inputs}
        onResolve={context.clearMissing}
      />
    );
  if (!context.farm) return <EmptyState />;
  return <>{children}</>;
}
export function WizardPage({
  step,
  title,
  subtitle,
  children,
  onNext,
  formId,
  onSaveDraft,
  nextLabel,
}: {
  step: number;
  title: string;
  subtitle: string;
  children: ReactNode;
  onNext?: () => void;
  formId?: string;
  onSaveDraft?: () => void;
  nextLabel?: string;
}) {
  const { t } = useTranslation();
  const farm = useFarm();
  const [saved, setSaved] = useState(false);
  const saveDraft = () => {
    onSaveDraft?.();
    farm.saveDraft();
    setSaved(true);
  };
  if (farm.missing)
    return (
      <InsufficientData
        missingInputs={farm.missing.missing_inputs}
        onResolve={farm.clearMissing}
      />
    );
  return (
    <div className="wizard-page animate-in">
      <Stepper current={step} />
      <PageHeader
        eyebrow={t("onboarding.eyebrow")}
        title={title}
        subtitle={subtitle}
      />
      {children}
      {farm.saveError && (
        <div className="section-gap">
          <ErrorState
            compact
            retry={() => {
              if (formId)
                (
                  document.getElementById(formId) as HTMLFormElement | null
                )?.requestSubmit();
              else onNext?.();
            }}
          />
        </div>
      )}
      <footer className="wizard-footer">
        <Link
          to={step ? WIZARD_STEPS[step - 1].path : "/"}
          className="button button-ghost"
        >
          <ArrowLeft size={18} className="directional" />
          {t("common.back")}
        </Link>
        <div className="wizard-footer-actions">
          <button
            className="button button-secondary"
            onClick={saveDraft}
            type="button"
          >
            <Save size={18} />
            {t("common.saveDraft")}
          </button>
          <button
            className="button button-primary"
            disabled={farm.pending}
            type={formId ? "submit" : "button"}
            form={formId}
            onClick={formId ? undefined : onNext}
          >
            {farm.pending ? (
              <LoaderCircle size={18} className="spinner" />
            ) : null}
            {nextLabel ?? t("common.next")}
            <ArrowRight size={18} className="directional" />
          </button>
        </div>
      </footer>
      <div className="wizard-saved" role="status">
        {farm.storageError ? (
          <span className="field-error">{t("common.storageError")}</span>
        ) : saved ? (
          <>
            <CheckCircle2 size={16} />
            {t("common.saved")}
          </>
        ) : (
          <>
            <ShieldCheck size={15} />
            {t("common.localOnly")}
          </>
        )}
      </div>
    </div>
  );
}
