import { CheckCircle2, CircleHelp } from "lucide-react";
import { useTranslation } from "react-i18next";

export function UnknownOption({
  checked,
  onChange,
  compact = false,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  compact?: boolean;
  label?: string;
}) {
  const { t } = useTranslation();
  const Icon = checked ? CheckCircle2 : CircleHelp;
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      className={`unknown-option ${checked ? "selected" : ""} ${compact ? "compact" : ""}`}
      onClick={() => onChange(!checked)}
    >
      <Icon size={compact ? 16 : 19} />
      <span>{label ?? t("common.unknown")}</span>
    </button>
  );
}
