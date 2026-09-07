// The code-sample language preference, shared by every CodeBlock/CodeTabs on the page and remembered in localStorage.
// The SvelteKit site kept this in a writable store (src/lib/stores/preferences.js); React reads the same module-level
// value through useSyncExternalStore so all the tab groups stay in sync and the stored key stays compatible.
import { useCallback, useSyncExternalStore } from "react";

const CODE_PREFERENCE_KEY = "pb_code_preference";

/** the preferences group key the "extend" code tabs use */
export const extendGroup = "extend";

/** language per group; "" is the default group */
export type CodePreferences = Record<string, string | undefined>;

function getStorage(): Storage | null {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch (_) {
    return null;
  }
}

function getStoragePreferences(): CodePreferences {
  try {
    const raw = getStorage()?.getItem(CODE_PREFERENCE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;

    if (typeof parsed == "object" && parsed !== null) {
      return parsed as CodePreferences;
    }
  } catch (_) {}

  return {};
}

function updateStoragePreference(newValue: CodePreferences) {
  try {
    getStorage()?.setItem(CODE_PREFERENCE_KEY, JSON.stringify(newValue));
  } catch (_) {}
}

let codePreferences: CodePreferences = getStoragePreferences();

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): CodePreferences {
  return codePreferences;
}

// prerender and hydration have no localStorage, so both start from the same empty object and the stored preference is
// picked up on the render right after hydration
const serverSnapshot: CodePreferences = {};

function getServerSnapshot(): CodePreferences {
  return serverSnapshot;
}

export function setCodePreference(val: string, group = "") {
  codePreferences = { ...codePreferences, [group]: val };
  updateStoragePreference(codePreferences);
  for (const listener of listeners) listener();
}

/** every group's preference at once */
export function useCodePreferences(): CodePreferences {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** one group's preference plus its setter; the group defaults to "", the same default the Svelte store had */
export function useCodePreference(group = ""): [string | undefined, (val: string) => void] {
  const preferences = useCodePreferences();
  const set = useCallback((val: string) => setCodePreference(val, group), [group]);
  return [preferences[group], set];
}
