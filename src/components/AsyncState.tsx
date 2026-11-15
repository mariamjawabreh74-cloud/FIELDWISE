import type { ReactNode } from "react";
import { AlertCircle, Leaf, LoaderCircle, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { Resource } from "../hooks/useResource";
import { InsufficientData } from "./InsufficientData";

export function LoadingState({ text }: { text?: string }) {
  const { t } = useTranslation();
  return (
    <div className="loading-state" role="status">
      <LoaderCircle size={30} className="spinner" />
      <p>{text ?? t("common.loading")}</p>
    </div>
  );
}
export function ErrorState({
  retry,
  compact = false,
}: {
  retry: () => void;
  compact?: boolean;
}) {
  const { t } = useTranslation();
  if (compact)
    return (
      <div className="notice notice-error" role="alert">
        <AlertCircle size={21} />
        <span className="flex-1">{t("common.error")}</span>
        <button className="button button-ghost button-small" onClick={retry}>
          <RefreshCw size={16} />
          {t("common.retry")}
        </button>
      </div>
    );
  return (
    <div className="empty-state" role="alert">
      <AlertCircle size={36} />
      <h2>{t("common.error")}</h2>
      <p>{t("common.errorDetail")}</p>
      <button className="button button-primary" onClick={retry}>
        <RefreshCw size={18} />
        {t("common.retry")}
      </button>
    </div>
  );
}
export function EmptyState({
  title,
  detail,
  retry,
}: {
  title?: string;
  detail?: string;
  retry?: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="empty-state">
      <Leaf size={36} strokeWidth={1.3} />
      <h2>{title ?? t("common.empty")}</h2>
      <p>{detail ?? t("common.emptyDetail")}</p>
      {retry ? (
        <button className="button button-secondary" onClick={retry}>
          <RefreshCw size={18} />
          {t("common.retry")}
        </button>
      ) : (
        <Link to="/start" className="button button-primary">
          {t("home.start")}
        </Link>
      )}
    </div>
  );
}
export function AsyncState<T>({
  resource,
  children,
  allowEmpty = false,
}: {
  resource: Resource<T>;
  children: (data: T) => ReactNode;
  allowEmpty?: boolean;
}) {
  if (resource.missing)
    return <InsufficientData missingInputs={resource.missing.missing_inputs} />;
  if (resource.error) return <ErrorState retry={resource.reload} />;
  if (resource.loading && resource.data === null) return <LoadingState />;
  if (
    resource.data === null ||
    (!allowEmpty && Array.isArray(resource.data) && !resource.data.length)
  )
    return <EmptyState retry={resource.reload} />;
  return <>{children(resource.data)}</>;
}
