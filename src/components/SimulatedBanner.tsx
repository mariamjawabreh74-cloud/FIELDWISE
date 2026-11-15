import { FlaskConical } from "lucide-react";
import { useTranslation } from "react-i18next";

export function SimulatedBanner({ simulated }: { simulated: boolean }) {
  const { t } = useTranslation();
  if (!simulated) return null;
  return (
    <div
      className="simulated-banner"
      role="note"
      data-testid="simulated-banner"
    >
      <FlaskConical size={16} aria-hidden="true" />
      <strong>{t("common.simulated")}</strong>
      <span className="banner-separator" aria-hidden="true">
        ·
      </span>
      <span className="banner-detail">{t("common.simulatedDetail")}</span>
    </div>
  );
}
