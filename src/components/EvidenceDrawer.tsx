import {
  AlertTriangle,
  BookOpen,
  CircleHelp,
  FileQuestion,
  ListChecks,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import type { CriterionKey, Strategy } from "../lib/api/types";
import { Modal } from "./Modal";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { DataGapChips } from "./DataGapChips";

export function EvidenceDrawer({
  strategy,
  criterion,
  onClose,
}: {
  strategy: Strategy | null;
  criterion: CriterionKey | null;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const score = strategy && criterion ? strategy.criteria[criterion] : null;
  return (
    <Modal
      open={!!strategy && !!criterion}
      onClose={onClose}
      drawer
      title={t("compare.evidenceFor", {
        criterion: criterion ? t(`priorities.${criterion}`) : "",
      })}
    >
      {strategy && score && (
        <div className="evidence-content">
          <span className="badge">{t(`strategies.${strategy.kind}`)}</span>
          <div className="evidence-score">
            <strong>{score.confidence === "none" ? "—" : score.score}</strong>
            <span>{t("compare.outOf")}</span>
            <ConfidenceBadge confidence={score.confidence} />
          </div>
          <section>
            <h3>
              <BookOpen size={20} />
              {t("compare.evidenceHeading")}
            </h3>
            {score.evidence.length ? (
              <ul>
                {score.evidence.map((text, index) => (
                  <li key={index}>{t(text, { defaultValue: text })}</li>
                ))}
              </ul>
            ) : (
              <p className="field-hint">{t("compare.noEvidence")}</p>
            )}
          </section>
          <section>
            <h3>
              <ListChecks size={20} />
              {t("compare.assumptions")}
            </h3>
            {score.assumptions.length ? (
              <ul>
                {score.assumptions.map((text, index) => (
                  <li key={index}>{t(text, { defaultValue: text })}</li>
                ))}
              </ul>
            ) : (
              <p className="field-hint">{t("common.notProvided")}</p>
            )}
          </section>
          <section>
            <h3>
              <FileQuestion size={20} />
              {t("compare.dataGaps")}
            </h3>
            {score.dataGaps.length ? (
              <DataGapChips gaps={score.dataGaps} />
            ) : (
              <p className="field-hint">{t("common.notProvided")}</p>
            )}
          </section>
          <section className="evidence-risk">
            <h3>
              <AlertTriangle size={20} />
              {t("compare.risks")}
            </h3>
            <ul>
              {strategy.risks.map((risk, index) => (
                <li key={index}>{t(risk.text, { defaultValue: risk.text })}</li>
              ))}
            </ul>
          </section>
          <p className="notice notice-warning">
            <CircleHelp size={20} />
            {t("compare.confidenceNote")}
          </p>
        </div>
      )}
    </Modal>
  );
}
