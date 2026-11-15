import { Languages } from "lucide-react";
import { useTranslation } from "react-i18next";

export function LanguageToggle() {
  const { t, i18n } = useTranslation();
  const next = i18n.language === "ar" ? "en" : "ar";
  return (
    <button
      className="language-toggle"
      onClick={() => {
        void i18n.changeLanguage(next);
        try {
          localStorage.setItem("fieldwise.language", next);
        } catch {
          /* Language still changes without browser storage. */
        }
      }}
      lang={next}
      aria-label={t(
        next === "en" ? "common.languageEnglish" : "common.languageArabic",
      )}
    >
      <Languages size={18} aria-hidden="true" />
      <span>
        {t(next === "en" ? "common.languageEnglish" : "common.languageArabic")}
      </span>
    </button>
  );
}
