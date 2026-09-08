import type { CSSProperties } from "react";

export const iconNames = [
  "arrow-right",
  "arrow-up-right",
  "book-open",
  "check",
  "clipboard",
  "download",
  "file-text",
  "lock-keyhole",
  "monitor",
  "shield-check",
  "smartphone",
  "terminal",
  "sprout",
  "blocks",
  "compass",
  "list-checks",
  "folder-git-2",
  "file-json",
  "database",
  "rocket",
  "settings-2",
  "route",
  "info",
] as const;
export type IconName = (typeof iconNames)[number];

export function Icon({
  name,
  size = 20,
  className = "",
}: {
  name: IconName;
  size?: number;
  className?: string;
}) {
  const mask = `url("/icons/interface/${name}.svg")`;
  return (
    <span
      aria-hidden="true"
      className={`ui-icon ${className}`}
      style={{
        width: size,
        height: size,
        maskImage: mask,
        WebkitMaskImage: mask,
      }}
    />
  );
}

const brands = {
  chatgpt: { name: "ChatGPT", color: false },
  claude: { name: "Claude", color: true },
  antigravity: { name: "Antigravity", color: true },
  cursor: { name: "Cursor", color: false },
  github: { name: "GitHub", color: false },
  cloudflare: { name: "Cloudflare", color: true },
  neon: { name: "Neon", color: false },
  "google-ai-studio": { name: "Google AI Studio", color: false },
  lovable: { name: "Lovable", color: true },
  replit: { name: "Replit", color: true },
  vercel: { name: "Vercel", color: false },
  tailscale: { name: "Tailscale", color: false },
};
export type BrandName = keyof typeof brands;

export const commonAgents = [
  { name: "chatgpt", label: "ChatGPT" },
  { name: "claude", label: "Claude" },
  { name: "antigravity", label: "Antigravity" },
  { name: "cursor", label: "Cursor" },
] as const;

export function isBrandName(name: string): name is BrandName {
  return Object.hasOwn(brands, name);
}

export function BrandIcon({
  name,
  size = 24,
}: {
  name: BrandName;
  size?: number;
}) {
  const src = `/icons/brands/${name}.svg`;
  const style: CSSProperties = { width: size, height: size };
  return brands[name].color ? (
    <img
      className={`brand-icon brand-icon-${name}`}
      src={src}
      width={size}
      height={size}
      alt=""
      aria-hidden="true"
    />
  ) : (
    <span
      aria-hidden="true"
      className={`brand-icon brand-icon-mask brand-icon-${name}`}
      style={{
        ...style,
        maskImage: `url("${src}")`,
        WebkitMaskImage: `url("${src}")`,
      }}
    />
  );
}

export function AgentBrands() {
  return (
    <div className="agent-destinations">
      <p>Use this prompt in your agent</p>
      <ul className="agent-brands" aria-label="Agents for your starting prompt">
        {commonAgents.map(({ name, label }) => (
          <li key={name}>
            <BrandIcon name={name} />
            <span>{label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
