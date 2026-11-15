import {
  ArrowUpRight,
  Check,
  Leaf,
  MapPinned,
  Orbit,
  Sprout,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { PageHeader } from "../components/PageHeader";
import { useApiStatus } from "../hooks/ApiProvider";

export default function Landing() {
  const { t } = useTranslation();
  const { mockMode } = useApiStatus();
  const steps = [
    { icon: MapPinned, color: "sage", path: "/start" },
    { icon: Orbit, color: "blue", path: "/farm/analysis" },
    { icon: Sprout, color: "sand", path: "/farm/compare" },
  ];
  return (
    <div className="landing-page animate-in">
      <PageHeader
        eyebrow={t("home.eyebrow")}
        title={t("home.title")}
        subtitle={t("home.subtitle")}
        action={
          mockMode ? (
            <span className="welcome-badge">
              <span className="tiny-dot" />
              {t("common.demo")}
            </span>
          ) : undefined
        }
      />
      <section className="hero-card" aria-label={t("home.heroEyebrow")}>
        <img
          className="hero-image"
          src="/images/hero-fields.webp"
          alt={t("home.imageAlt")}
          fetchPriority="high"
        />
        <div className="hero-shade" />
        <div className="hero-content">
          <span className="hero-eyebrow">
            <span className="hero-line" />
            {t("home.heroEyebrow")}
          </span>
          <h2>{t("home.heroTitle")}</h2>
          <p>{t("home.heroBody")}</p>
          <Link to="/start" className="button button-cream hero-cta">
            <Sprout size={20} />
            {t("home.start")}
            <ArrowUpRight size={21} className="directional" />
          </Link>
          <span className="hero-small">
            <Check size={14} />
            {t("home.setupTime")}
          </span>
        </div>
        <div className="field-illustration" aria-hidden="true">
          <svg viewBox="0 0 350 260" fill="none">
            <path
              d="m58 157 104-97 145 60-111 100Z"
              fill="#d7efc5"
              fillOpacity=".1"
              stroke="#f3f4d7"
              strokeWidth="1.6"
              strokeDasharray="5 4"
            />
            <path
              d="m58 157 104-97 145 60-111 100Z"
              stroke="#f3f4d7"
              strokeWidth=".5"
            />
            <circle cx="58" cy="157" r="4" fill="#f3f4d7" />
            <circle cx="162" cy="60" r="4" fill="#f3f4d7" />
            <circle cx="307" cy="120" r="4" fill="#f3f4d7" />
            <circle cx="196" cy="220" r="4" fill="#f3f4d7" />
            <circle cx="184" cy="143" r="21" fill="white" fillOpacity=".16" />
            <circle cx="184" cy="143" r="12" fill="#f3f4d7" />
            <path
              d="M184 149v-10m0 5c-5 0-7-3-7-6 5 0 7 2 7 6Zm0-3c0-5 3-7 7-7 0 5-3 7-7 7Z"
              stroke="#2f5d3a"
              strokeWidth="1.3"
            />
          </svg>
          <div className="field-annotation">
            <span className="tiny-dot" />
            {t("home.fieldLabel")}
          </div>
        </div>
        <div className="hero-corner">
          <Orbit size={16} strokeWidth={1.4} />
          <span>{t("home.satellite")}</span>
        </div>
        <span className="hero-image-credit">{t("home.imageLabel")}</span>
      </section>
      <section className="steps-section" aria-labelledby="steps-heading">
        <div className="section-heading">
          <div>
            <h2 id="steps-heading">{t("home.stepsTitle")}</h2>
            <p>{t("home.stepsSubtitle")}</p>
          </div>
          {mockMode && (
            <Link className="text-link" to="/farm/analysis">
              {t("home.explore")}
              <ArrowUpRight size={18} className="directional" />
            </Link>
          )}
        </div>
        <div className="steps-grid">
          {steps.map(({ icon: Icon, color, path }, index) => (
            <Link to={path} key={path} className="step-card">
              <div className="step-card-top">
                <span className={`step-icon ${color}`}>
                  <Icon size={24} strokeWidth={1.5} />
                </span>
                <span className="step-number">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>
              <h3>{t(`home.step${index + 1}Title`)}</h3>
              <p>{t(`home.step${index + 1}Body`)}</p>
              <span className="step-card-arrow">
                <ArrowUpRight size={18} className="directional" />
              </span>
            </Link>
          ))}
        </div>
      </section>
      <aside className="trust-note">
        <div className="trust-icon">
          <Leaf size={25} strokeWidth={1.4} />
        </div>
        <div>
          <h3>{t("home.trustTitle")}</h3>
          <p>{t("home.trustBody")}</p>
        </div>
        <Link to="/methodology" className="trust-link">
          <span>{t("nav.methodology")}</span>
          <ArrowUpRight size={18} className="directional" />
        </Link>
      </aside>
    </div>
  );
}
