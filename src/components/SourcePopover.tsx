import { useState } from "react";
import { ArrowUpRight, Info, Satellite } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Provenance } from "../lib/api/types";
import { ResolutionBadge } from "./ResolutionBadge";
import { Modal } from "./Modal";

export function SourcePopover({
  provenance,
  limitations,
  resolution,
  iconOnly = false,
  additionalSources = [],
}: {
  provenance?: Provenance;
  limitations: string[];
  resolution?: number;
  iconOnly?: boolean;
  additionalSources?: Provenance[];
}) {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const date = (value: string) =>
    new Date(value).toLocaleDateString(i18n.language, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  return (
    <>
      <button
        type="button"
        className={`source-button ${iconOnly ? "icon-only" : ""}`}
        aria-label={t("common.sources")}
        onClick={() => setOpen(true)}
      >
        <Info size={15} />
        {!iconOnly && <span>{t("common.sources")}</span>}
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={t("analysis.sourceTitle")}
      >
        <div className="source-content">
          <ResolutionBadge meters={resolution} />
          {provenance ? (
            [provenance, ...additionalSources].map((source) => (
              <section
                className="source-record"
                key={`${source.dataset}-${source.product}`}
              >
                <h3>
                  <Satellite size={20} />
                  {t(`datasets.${source.dataset}`)}
                </h3>
                <dl>
                  <div>
                    <dt>{t("analysis.product")}</dt>
                    <dd>
                      {t(source.product, { defaultValue: source.product })}
                      {source.version ? <span> · {source.version}</span> : null}
                    </dd>
                  </div>
                  <div>
                    <dt>{t("analysis.period")}</dt>
                    <dd>
                      {date(source.periodStart)} – {date(source.periodEnd)}
                    </dd>
                  </div>
                  <div>
                    <dt>{t("analysis.citation")}</dt>
                    <dd>
                      {t(source.citation, { defaultValue: source.citation })}
                    </dd>
                  </div>
                </dl>
                {source.citationUrl && (
                  <a
                    href={source.citationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-link"
                  >
                    {t("methodology.visit")}
                    <ArrowUpRight size={17} className="directional" />
                  </a>
                )}
              </section>
            ))
          ) : (
            <p className="field-hint">{t("common.noData")}</p>
          )}
          <h3 className="source-limit-title">{t("analysis.limitations")}</h3>
          <ul className="source-limitations">
            {limitations.map((limitation, index) => (
              <li key={index}>{t(limitation, { defaultValue: limitation })}</li>
            ))}
          </ul>
          <p className="notice notice-warning">
            {t("analysis.nativeResolution")}
          </p>
        </div>
      </Modal>
    </>
  );
}
