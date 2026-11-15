import { useCallback, useState } from "react";
import type { Dispatch, SetStateAction } from "react";

/** Local UI state only: drafts, chosen strategy, and completed checklist items. */
export function useLocalState<T>(
  key: string,
  initial: T,
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? (JSON.parse(saved) as T) : initial;
    } catch {
      return initial;
    }
  });
  const update = useCallback<Dispatch<SetStateAction<T>>>(
    (next) => {
      setValue((previous) => {
        const updated =
          typeof next === "function"
            ? (next as (value: T) => T)(previous)
            : next;
        try {
          localStorage.setItem(key, JSON.stringify(updated));
        } catch {
          /* The UI still works without persistent storage. */
        }
        return updated;
      });
    },
    [key],
  );
  return [value, update];
}
