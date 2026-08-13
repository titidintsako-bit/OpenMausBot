export type Theme = "light" | "dark" | "system";

const KEY = "complyos:theme";

export function getStoredTheme(): Theme {
  const v = localStorage.getItem(KEY) as Theme | null;
  return v === "light" || v === "dark" || v === "system" ? v : "system";
}
export function setStoredTheme(v: Theme) {
  localStorage.setItem(KEY, v);
}
export function applyTheme(pref: Theme) {
  const resolved =
    pref === "light" || pref === "dark"
      ? pref
      : window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
  document.documentElement.setAttribute("data-theme", resolved);
}
