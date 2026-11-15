import { ArrowUpRight, Sprout } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function NotFound() {
  const { t } = useTranslation();
  return (
    <div className="empty-state section-gap">
      <Sprout size={43} strokeWidth={1.2} />
      <h1 className="text-3xl mb-7">{t("common.notFound")}</h1>
      <Link to="/" className="button button-primary">
        {t("common.goHome")}
        <ArrowUpRight size={18} className="directional" />
      </Link>
    </div>
  );
}
