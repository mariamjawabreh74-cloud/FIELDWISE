import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Leaf,
  Printer,
  Sprout,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import type {
  ActionPlan as ActionPlanData,
  StrategyKind,
} from "../lib/api/types";
import { useFarm } from "../hooks/useFarm";
import { useActionPlan } from "../hooks/useFieldData";
import { useSelectedStrategy } from "../hooks/useSelectedStrategy";
import { useLocalState } from "../hooks/useLocalState";
import { FarmGate } from "../components/WizardPage";
import { PageHeader } from "../components/PageHeader";
import { AsyncState, EmptyState } from "../components/AsyncState";

const strategyKinds: StrategyKind[] = [
  "existing",
  "water_conservation",
  "soil_improvement",
];
function PlanView({ plan, farmId }: { plan: ActionPlanData; farmId: string }) {
  const { t, i18n } = useTranslation();
  const [month, setMonth] = useState<number | "all">(1);
  const [checked, setChecked] = useLocalState<Record<string, boolean>>(
    `fieldwise.checklist.${farmId}.${plan.strategy}.${plan.year}`,
    {},
  );
  const done = plan.tasks.filter((task) => checked[task.id]).length;
  const total = plan.tasks.length;
  const percent = total ? Math.round((done / total) * 100) : 0;
  const months = Array.from({ length: 12 }, (_, index) => index + 1);
  const visibleCount = plan.tasks.filter(
    (task) => month === "all" || task.month === month,
  ).length;
  return (
    <>
      <section className="panel season-calendar no-print">
        <div className="calendar-heading">
          <div>
            <h2>
              <CalendarDays size={22} />
              {t("plan.calendar")}
            </h2>
            <p>
              {new Intl.NumberFormat(i18n.language, {
                useGrouping: false,
              }).format(plan.year)}{" "}
              <span>·</span> {t(`strategies.${plan.strategy}`)}
            </p>
          </div>
          <div
            className="plan-progress"
            role="progressbar"
            aria-valuenow={done}
            aria-valuemin={0}
            aria-valuemax={total}
            aria-label={t("plan.completed", { done, total })}
          >
            <svg viewBox="0 0 48 48" aria-hidden="true">
              <circle
                cx="24"
                cy="24"
                r="20"
                fill="none"
                stroke="#e7eddf"
                strokeWidth="3"
              />
              <circle
                cx="24"
                cy="24"
                r="20"
                fill="none"
                stroke="#91a873"
                strokeWidth="3"
                strokeDasharray={`${percent * 1.257} 125.7`}
                strokeLinecap="round"
                transform="rotate(-90 24 24)"
              />
            </svg>
            <span>{percent}%</span>
          </div>
        </div>
        <div className="month-calendar">
          {months.map((value) => {
            const tasks = plan.tasks.filter((task) => task.month === value);
            const complete =
              tasks.length > 0 && tasks.every((task) => checked[task.id]);
            return (
              <button
                type="button"
                key={value}
                className={`month-button ${month === value ? "selected" : ""} ${complete ? "complete" : ""}`}
                onClick={() => setMonth(value)}
                aria-pressed={month === value}
              >
                <span className="month-number">
                  {String(value).padStart(2, "0")}
                </span>
                <strong>{t(`months.${value}`)}</strong>
                <span className="month-task-dots">
                  {complete ? (
                    <Check size={15} />
                  ) : (
                    <>
                      {tasks.slice(0, 4).map((task) => (
                        <i
                          key={task.id}
                          className={checked[task.id] ? "complete" : ""}
                        />
                      ))}
                    </>
                  )}
                </span>
              </button>
            );
          })}
        </div>
        <div className="calendar-summary">
          <span>
            <Check size={16} />
            {t("plan.completed", { done, total })}
          </span>
          <button
            className="text-link"
            onClick={() => setMonth("all")}
            aria-pressed={month === "all"}
          >
            {t("plan.all")}
          </button>
        </div>
      </section>
      <section className="plan-checklist section-gap">
        <div className="section-heading checklist-heading no-print">
          <div>
            <h2>{t("plan.tasks")}</h2>
            <p>
              {month === "all"
                ? t("plan.all")
                : t("plan.selectedMonth", { month: t(`months.${month}`) })}
            </p>
          </div>
          <div className="month-navigation">
            <button
              className="icon-button"
              disabled={month === 1}
              onClick={() =>
                setMonth(typeof month === "number" ? Math.max(1, month - 1) : 1)
              }
              aria-label={t("plan.previous")}
            >
              <ChevronLeft size={21} className="directional" />
            </button>
            <button
              className="icon-button"
              disabled={month === 12}
              onClick={() =>
                setMonth(
                  typeof month === "number" ? Math.min(12, month + 1) : 1,
                )
              }
              aria-label={t("plan.next")}
            >
              <ChevronRight size={21} className="directional" />
            </button>
          </div>
        </div>
        {visibleCount === 0 && (
          <div className="panel empty-month no-print">
            <Leaf size={31} />
            <p>{t("plan.empty")}</p>
          </div>
        )}
        {months.map((value) => {
          const tasks = plan.tasks.filter((task) => task.month === value);
          if (!tasks.length) return null;
          return (
            <div
              className={`plan-month-group ${month !== "all" && month !== value ? "is-filtered" : ""}`}
              key={value}
            >
              <h3 className={month === "all" ? "" : "print-only"}>
                {t(`months.${value}`)}
              </h3>
              <ul className="plan-task-list">
                {tasks.map((task) => (
                  <li
                    className={`plan-task ${checked[task.id] ? "is-complete" : ""}`}
                    key={task.id}
                  >
                    <label className="task-checkbox">
                      <input
                        type="checkbox"
                        className="checkbox"
                        checked={!!checked[task.id]}
                        aria-label={t(
                          checked[task.id] ? "plan.uncheck" : "plan.check",
                          { task: t(task.title, { defaultValue: task.title }) },
                        )}
                        onChange={(event) =>
                          setChecked((previous) => ({
                            ...previous,
                            [task.id]: event.target.checked,
                          }))
                        }
                      />
                    </label>
                    <div className="task-copy">
                      <h4>{t(task.title, { defaultValue: task.title })}</h4>
                      <p>
                        {t(task.description, {
                          defaultValue: task.description,
                        })}
                      </p>
                      <span className="task-effort">
                        <Clock3 size={14} />
                        {t(task.effort, { defaultValue: task.effort })}
                      </span>
                    </div>
                    <Sprout size={22} className="task-leaf" strokeWidth={1.3} />
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </section>
      <p className="plan-local-note no-print">
        <Check size={15} />
        {t("plan.local")}
      </p>
      {plan.simulated && (
        <p className="notice notice-warning section-gap">
          <Leaf size={22} />
          {t("plan.demoNote")}
        </p>
      )}
      <p className="plan-print-disclaimer print-only">
        {t("common.decisionNote")}
      </p>
    </>
  );
}
function ActionPlanContent() {
  const { t, i18n } = useTranslation();
  const { farm } = useFarm();
  const [search, setSearch] = useSearchParams();
  const [stored, setStored] = useSelectedStrategy(farm!.id);
  const queryStrategy = search.get("strategy") as StrategyKind | null;
  const selected =
    queryStrategy && strategyKinds.includes(queryStrategy)
      ? queryStrategy
      : strategyKinds.includes(stored)
        ? stored
        : "water_conservation";
  const plan = useActionPlan(farm!.id, selected);
  function choose(value: StrategyKind) {
    setStored(value);
    setSearch({ strategy: value }, { replace: true });
  }
  return (
    <div className="action-plan-page animate-in">
      <div className="print-only print-heading">
        <strong>{t("plan.printTitle")}</strong>
        <p>
          {t(farm!.name, { defaultValue: farm!.name })} ·{" "}
          {plan.data?.year
            ? new Intl.NumberFormat(i18n.language, {
                useGrouping: false,
              }).format(plan.data.year)
            : ""}
        </p>
      </div>
      <PageHeader
        eyebrow={t("plan.eyebrow")}
        title={t("plan.title")}
        subtitle={t("plan.subtitle")}
        action={
          <button
            className="button button-primary no-print"
            disabled={!plan.data}
            onClick={() => window.print()}
          >
            <Printer size={19} />
            {t("common.print")}
          </button>
        }
      />
      <div className="plan-strategy-picker no-print">
        <label htmlFor="plan-strategy">
          <Sprout size={20} />
          {t("plan.strategy")}
        </label>
        <select
          id="plan-strategy"
          className="select"
          value={selected}
          onChange={(event) => choose(event.target.value as StrategyKind)}
        >
          {strategyKinds.map((kind) => (
            <option value={kind} key={kind}>
              {t(`strategies.${kind}`)}
            </option>
          ))}
        </select>
      </div>
      <AsyncState resource={plan}>
        {(value) =>
          value.tasks.length ? (
            <PlanView
              key={`${farm!.id}-${value.strategy}-${value.year}`}
              plan={value}
              farmId={farm!.id}
            />
          ) : (
            <EmptyState title={t("plan.noPlan")} retry={plan.reload} />
          )
        }
      </AsyncState>
    </div>
  );
}
export default function ActionPlan() {
  return (
    <FarmGate>
      <ActionPlanContent />
    </FarmGate>
  );
}
