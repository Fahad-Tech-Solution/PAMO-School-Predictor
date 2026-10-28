/** sessionStorage helpers for “back to list” with filters preserved. */

export const APPLICATIONS_RETURN_KEY = "pamo:applications:return";
export const SCHOOLS_RETURN_KEY = "pamo:schools:return";

function isListHref(basePath: string, href: string): boolean {
  if (href === basePath) return true;
  return href.startsWith(`${basePath}?`);
}

function fromListFlagKey(storageKey: string): string {
  return `${storageKey}:from-list`;
}

export function readListReturnHref(basePath: string, storageKey: string): string {
  if (typeof window === "undefined") return basePath;
  try {
    const stored = sessionStorage.getItem(storageKey);
    if (stored && isListHref(basePath, stored)) {
      return stored;
    }
  } catch {
    // ignore quota / private mode
  }
  return basePath;
}

export function writeListReturnHref(
  basePath: string,
  storageKey: string,
  href: string,
): void {
  if (typeof window === "undefined") return;
  if (!isListHref(basePath, href)) return;
  try {
    sessionStorage.setItem(storageKey, href);
  } catch {
    // ignore
  }
}

/** Mark that the user is navigating from this list into a child route. */
export function markNavigatedFromList(storageKey: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(fromListFlagKey(storageKey), "1");
  } catch {
    // ignore
  }
}

export function consumeNavigatedFromList(storageKey: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const key = fromListFlagKey(storageKey);
    const flagged = sessionStorage.getItem(key) === "1";
    if (flagged) sessionStorage.removeItem(key);
    return flagged;
  } catch {
    return false;
  }
}

type NavigationEntryLike = { url?: string | null; index?: number };
type NavigationLike = {
  currentEntry?: NavigationEntryLike | null;
  entries?: () => NavigationEntryLike[];
};

/** True when the previous history entry is exactly this list path (Chromium). */
export function previousHistoryEntryIsList(basePath: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const navigation = (
      window as Window & { navigation?: NavigationLike }
    ).navigation;
    if (!navigation?.currentEntry || typeof navigation.entries !== "function") {
      return false;
    }
    const entries = navigation.entries();
    const idx = navigation.currentEntry.index;
    if (idx == null || idx <= 0) return false;
    const prev = entries[idx - 1];
    if (!prev?.url) return false;
    const url = new URL(prev.url);
    if (url.origin !== window.location.origin) return false;
    return url.pathname === basePath;
  } catch {
    return false;
  }
}

/**
 * Prefer a fast history.back() only when we know the previous entry is this list
 * (Navigation API) or we marked a list→child click. Otherwise use remembered href.
 */
export function shouldUseHistoryBackToList(
  basePath: string,
  storageKey: string,
): boolean {
  if (typeof window === "undefined" || window.history.length <= 1) {
    return false;
  }
  if (previousHistoryEntryIsList(basePath)) {
    // Drop any stale from-list marker so a later Back is not over-eager.
    try {
      sessionStorage.removeItem(fromListFlagKey(storageKey));
    } catch {
      // ignore
    }
    return true;
  }
  return consumeNavigatedFromList(storageKey);
}
