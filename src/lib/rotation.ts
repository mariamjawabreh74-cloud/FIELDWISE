import type { RotationEntry } from "./api/types";

/** Reorders without mutating input; crop-specific planting windows stay attached. */
export function reorderRotation(
  rotation: RotationEntry[],
  from: number,
  to: number,
): RotationEntry[] {
  const copy = rotation.map((entry) => ({
    ...entry,
    months: [...entry.months] as [number, number],
  }));
  if (
    from < 0 ||
    from >= copy.length ||
    to < 0 ||
    to >= copy.length ||
    from === to
  )
    return copy;
  const [entry] = copy.splice(from, 1);
  copy.splice(to, 0, entry);
  return copy;
}
export function isGrowingMonth(month: number, window: [number, number]) {
  const [start, end] = window;
  return start <= end
    ? month >= start && month <= end
    : month >= start || month <= end;
}
