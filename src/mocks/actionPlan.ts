import type { ActionPlan, ActionTask } from "../lib/api/types";

const taskRows: [string, number, string][] = [
  ["inspect", 1, "short"],
  ["soil", 1, "medium"],
  ["cover", 2, "medium"],
  ["observe", 3, "ongoing"],
  ["irrigation", 4, "short"],
  ["observe", 5, "ongoing"],
  ["irrigation", 6, "short"],
  ["observe", 7, "ongoing"],
  ["harvest", 8, "medium"],
  ["review", 9, "medium"],
  ["cover", 10, "medium"],
  ["inspect", 11, "short"],
  ["review", 12, "medium"],
];
export const actionTasks: ActionTask[] = taskRows.map(
  ([key, month, effort], index) => ({
    simulated: true,
    id: `task-${index}`,
    month,
    title: `mock.tasks.${key}`,
    description: `mock.tasks.${key}Detail`,
    effort: `mock.effort.${effort}`,
  }),
);
export const actionPlan: ActionPlan = {
  simulated: true,
  strategy: "water_conservation",
  year: 2027,
  tasks: actionTasks,
};
