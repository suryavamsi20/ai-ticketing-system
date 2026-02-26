const STORAGE_PREFIX = "zt_analytics_v1";
const MAX_EVENTS = 80;

function safeParse(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function getUserScope() {
  if (typeof window === "undefined") return "guest";
  const rawUser = window.localStorage.getItem("user");
  const parsed = safeParse(rawUser, null);
  const email = parsed?.user?.email;
  const username = parsed?.user?.username;
  return email || username || "guest";
}

function storageKey() {
  return `${STORAGE_PREFIX}:${getUserScope()}`;
}

function getDefaultSnapshot() {
  return {
    counters: {},
    recent: [],
    updated_at: null,
  };
}

export function getInteractionSnapshot() {
  if (typeof window === "undefined") return getDefaultSnapshot();
  const stored = safeParse(window.localStorage.getItem(storageKey()), null);
  return stored && typeof stored === "object" ? stored : getDefaultSnapshot();
}

export function trackInteraction(eventName, meta = {}) {
  if (typeof window === "undefined" || !eventName) return;
  const snapshot = getInteractionSnapshot();
  const counters = { ...snapshot.counters };
  counters[eventName] = (counters[eventName] || 0) + 1;

  const event = {
    event: eventName,
    at: new Date().toISOString(),
    meta,
  };

  const recent = [event, ...(snapshot.recent || [])].slice(0, MAX_EVENTS);
  const next = {
    counters,
    recent,
    updated_at: event.at,
  };
  window.localStorage.setItem(storageKey(), JSON.stringify(next));
}

