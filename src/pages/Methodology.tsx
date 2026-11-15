import { useEffect } from "react";
import {
  ArrowUpRight,
  BookOpen,
  Calculator,
  CircleHelp,
  Image,
  Leaf,
  LockKeyhole,
  Orbit,
  Satellite,
  ShieldCheck,
} from "lucide-react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useMethodology } from "../hooks/useFieldData";
import { PageHeader } from "../components/PageHeader";
import { AsyncState, EmptyState } from "../components/AsyncState";
import { ResolutionBadge } from "../components/ResolutionBadge";
import { SourcePopover } from "../components/SourcePopover";

export default function Methodology() {
  const { t } = useTranslation();
  const methodology = useMethodology();
  const { hash } = useLocation();
  useEffect(() => {
    if (!methodology.data || !hash) return;
    const timer = requestAnimationFrame(() =>
      document
        .getElementById(hash.slice(1))
        ?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
    return () => cancelAnimationFrame(timer);
  }, [methodology.data, hash]);
  return (
    <div className="methodology-page animate-in">
      <PageHeader
        eyebrow={t("methodology.eyebrow")}
        title={t("methodology.title")}
        subtitle={t("methodology.subtitle")}
      />
      <AsyncState resource={methodology}>
        {(data) =>
          data.datasets.length ||
          data.formulas.length ||
          data.limitations.length ? (
            <>
              <div className="science-intro">
                <span className="science-orbit">
                  <Orbit size={42} strokeWidth={1} />
                </span>
                <div>
                  <strong>{t("home.science")}</strong>
                  <p>{t("methodology.independent")}</p>
                </div>
                <Leaf
                  size={39}
                  className="science-intro-leaf"
                  strokeWidth={1}
                />
              </div>
              <section id="datasets" className="methodology-section">
                <div className="section-heading">
                  <div>
                    <h2>
                      <Satellite size={23} />
                      {t("methodology.datasets")}
                    </h2>
                    <p>{t("methodology.date")}</p>
                  </div>
                </div>
                <div className="methodology-datasets">
                  {data.datasets.map((dataset) => (
                    <article
                      className="panel methodology-dataset"
                      key={dataset.dataset}
                    >
                      <div className="methodology-dataset-header">
                        <span className="dataset-symbol">
                          <Satellite size={23} strokeWidth={1.3} />
                        </span>
                        <div>
                          <h3>{t(`datasets.${dataset.dataset}`)}</h3>
                          <p>{t(`datasets.${dataset.dataset}Detail`)}</p>
                        </div>
                        <SourcePopover
                          provenance={dataset.provenance}
                          limitations={dataset.limitations}
                          resolution={dataset.nativeResolutionM}
                          iconOnly
                        />
                      </div>
                      <div className="methodology-resolution">
                        <span>{t("methodology.resolution")}</span>
                        <ResolutionBadge meters={dataset.nativeResolutionM} />
                      </div>
                      <p className="methodology-product">
                        {dataset.provenance
                          ? t(dataset.provenance.product, {
                              defaultValue: dataset.provenance.product,
                            })
                          : t("common.notProvided")}
                      </p>
                      <a
                        href={dataset.documentationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-link"
                      >
                        <BookOpen size={16} />
                        {t("methodology.visit")}
                        <ArrowUpRight size={16} className="directional" />
                      </a>
                    </article>
                  ))}
                </div>
              </section>
              <section
                id="limitations"
                className="methodology-section limitations-section"
              >
                <div className="section-heading">
                  <h2>
                    <ShieldCheck size={23} />
                    {t("methodology.limitations")}
                  </h2>
                </div>
                <ol className="methodology-limitations">
                  {data.limitations.map((limitation, index) => (
                    <li key={limitation}>
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <p>{t(limitation, { defaultValue: limitation })}</p>
                    </li>
                  ))}
                </ol>
              </section>
              <section className="methodology-section" id="formulas">
                <div className="section-heading">
                  <h2>
                    <Calculator size={22} />
                    {t("methodology.formulas")}
                  </h2>
                </div>
                <div className="formula-grid">
                  {data.formulas.map((formula) => (
                    <article
                      className={`panel formula-card ${formula.backendPlaceholder ? "backend-integration" : ""}`}
                      key={formula.id}
                    >
                      <span className="formula-icon">
                        {formula.backendPlaceholder ? (
                          <CircleHelp size={24} strokeWidth={1.4} />
                        ) : (
                          <Calculator size={24} strokeWidth={1.4} />
                        )}
                      </span>
                      <h3>
                        {t(formula.title, { defaultValue: formula.title })}
                      </h3>
                      <p>
                        {t(formula.description, {
                          defaultValue: formula.description,
                        })}
                      </p>
                      {formula.backendPlaceholder && (
                        <span className="formula-backend-note">
                          {t("methodology.formulaNote")}
                        </span>
                      )}
                    </article>
                  ))}
                </div>
              </section>
              <div className="methodology-footnotes">
                <section>
                  <Image size={24} strokeWidth={1.4} />
                  <h3>{t("methodology.imagery")}</h3>
                  <p>{t("methodology.imageryNote")}</p>
                </section>
                <section>
                  <LockKeyhole size={24} strokeWidth={1.4} />
                  <h3>{t("methodology.privacy")}</h3>
                  <p>{t("methodology.privacyNote")}</p>
                </section>
              </div>
              <p className="methodology-version">{t("methodology.version")}</p>
            </>
          ) : (
            <EmptyState retry={methodology.reload} />
          )
        }
      </AsyncState>
    </div>
  );
}
