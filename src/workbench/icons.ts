import type { Phase, Status } from "./model";

export const interfaceIcons = ["arrow-right", "arrow-up-right", "book-open", "check", "clipboard", "file-text", "lock-keyhole", "monitor", "shield-check", "smartphone", "terminal", "sprout", "blocks", "compass", "list-checks", "folder-git-2", "file-json", "rocket", "settings-2", "route", "info"] as const;
export const extraIcons = ["mail", "refresh-cw", "clock", "circle", "minus", "skip-forward"] as const;
export const brandIcons = ["chatgpt", "claude", "cursor", "antigravity", "google-ai-studio", "github", "cloudflare", "tailscale"] as const;
export type IconName = typeof interfaceIcons[number] | typeof extraIcons[number] | typeof brandIcons[number];
export const phaseIcons: Record<Phase, IconName> = { "phase-1": "sprout", "phase-2": "blocks", "phase-3": "compass" };
export const statusIcons: Record<Status, IconName> = { not_started: "circle", in_progress: "route", completed: "check", skipped: "skip-forward", deferred: "clock", not_applicable: "minus" };

export function icon(name: IconName, badge = false) {
  const result = document.createElement("span");
  result.className = `icon${badge ? " icon-badge" : ""}`;
  result.dataset.icon = name;
  result.setAttribute("aria-hidden", "true");
  return result;
}

export function providerIcon(value: string): IconName | undefined {
  const name = value.trim().toLowerCase();
  if (/^(codex|chatgpt|openai)(\b|[-_])/.test(name)) return "chatgpt";
  if (/^claude(\b|[-_])/.test(name)) return "claude";
  if (/^cursor(\b|[-_])/.test(name)) return "cursor";
  if (/^(google[- ]?)?antigravity(\b|[-_])/.test(name)) return "antigravity";
  if (/^(google[- ]?)?ai[- ]studio(\b|[-_])/.test(name)) return "google-ai-studio";
  if (name === "github") return "github";
  if (name === "cloudflare") return "cloudflare";
  if (name === "tailscale") return "tailscale";
  return undefined;
}
