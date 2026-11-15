import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "../locales/en.json";
import ar from "../locales/ar.json";

function initialLanguage() {
  try {
    return localStorage.getItem("fieldwise.language") === "en" ? "en" : "ar";
  } catch {
    return "ar";
  }
}

export function applyLanguage(language: string) {
  document.documentElement.lang = language;
  document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
  document.title = `${i18n.t("common.brand", { lng: language })} — ${i18n.t("home.title", { lng: language })}`;
}

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, ar: { translation: ar } },
  lng: initialLanguage(),
  fallbackLng: "en",
  interpolation: { escapeValue: false },
  returnNull: false,
});
applyLanguage(i18n.language);
i18n.on("languageChanged", applyLanguage);
export default i18n;
