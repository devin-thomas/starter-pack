import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  Icon,
  AgentBrands,
  BrandIcon,
  commonAgents,
  isBrandName,
  type IconName,
} from "./Icons";

export interface SiteData {
  pages: { guide: string; about: string };
  phases: {
    id: string;
    title: string;
    summary: string;
    status: string;
    order: number;
    html: string;
  }[];
  recommendations: {
    id: string;
    name: string;
    category: string;
    requirement: string;
    status: string;
    recommended_by: string;
    checked_at: string;
    reason: string;
    url: string;
  }[];
  prompt: string;
}

const milestones = [
  "Make something",
  "Build something meaningful",
  "Build something serious",
];
const phaseIcons = ["sprout", "blocks", "compass"] as const;
const phaseShortLabels = ["Make", "Build", "Go deeper"];
const nav = [
  ["/guide", "Guide"],
  ["/recommendations", "Recommendations"],
  ["/resources", "Agent resources"],
  ["/about", "About"],
];

function Prompt({ prompt }: { prompt: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
  async function copy() {
    try {
      if (!navigator.clipboard) {
        setStatus("failed");
        return;
      }
      await navigator.clipboard.writeText(prompt);
      setStatus("copied");
    } catch {
      setStatus("failed");
    }
  }
  return (
    <section className="prompt-workbench" aria-labelledby="prompt-label">
      <div className="document-toolbar">
        <span id="prompt-label">
          <Icon name="terminal" size={20} /> Your starting prompt
        </span>
        <span className="metadata">COPY + PASTE</span>
      </div>
      <AgentBrands />
      <div className="prompt-controls">
        <button className="primary-action" onClick={copy}>
          {status === "copied" ? (
            <Icon name="check" size={17} />
          ) : (
            <Icon name="clipboard" size={17} />
          )}
          {status === "copied" ? "Prompt copied" : "Get Started"}
          <Icon name="arrow-right" size={17} />
        </button>
        <span>Copy, then paste into your agent.</span>
      </div>
      <div className="copy-status" role="status" aria-live="polite">
        {status === "copied" &&
          "Ready. Paste this into a new conversation with your agent."}
        {status === "failed" && (
          <>
            Clipboard unavailable. Download the prompt instead: {" "}
            <a href="/prompts/get-started.txt" download>
              get-started.txt
            </a>
            .
          </>
        )}
      </div>
      <div className="prompt-explainer" aria-labelledby="prompt-explainer-label">
        <h3 id="prompt-explainer-label">What happens when I copy this?</h3>
        <p>
          Copying only puts this text on your clipboard. Once you paste it into
          your agent and send it, your agent reads the pack, finds your starting
          point, and guides you one step at a time. It asks before making
          changes to your computer.
        </p>
      </div>
    </section>
  );
}

function PhaseCards() {
  return (
    <div className="phase-cards">
      {milestones.map((title, i) => (
        <a
          href={`/phases/${i + 1}`}
          className={`phase-card phase-${i + 1}`}
          key={title}
        >
          <span className="concept-icon">
            <Icon name={phaseIcons[i]} size={24} />
          </span>
          <span className="eyebrow">
            PHASE 0{i + 1}
            {i === 2 && " / PREVIEW"}
          </span>
          <h3>{title}</h3>
          <p>
            {
              [
                "Set up your accounts. Make one small thing work. A phone is enough to begin.",
                "Set up your computer. Shape a real idea, build it, and put it online.",
                "A look ahead at deeper planning, deliberate decisions, and larger builds.",
              ][i]
            }
          </p>
          <span className="card-link">
            {i === 2 ? "Explore the preview" : "Open phase"}
            <Icon name="arrow-up-right" size={16} />
          </span>
        </a>
      ))}
    </div>
  );
}

function Resources({ phase }: { phase?: number }) {
  const links = phase
    ? [
        [`/phases/${phase}.md`, "Phase Markdown"],
        [`/phases/${phase}.json`, "Phase JSON"],
        ...(phase === 2
          ? [
              ["/skills/computer-setup/SKILL.md", "Computer Setup skill"],
              ["/skills/quick-build/SKILL.md", "Quick Build skill"],
            ]
          : [["/skills/starter-pack/SKILL.md", "Starter Pack skill"]]),
      ]
    : [
        [
          "/agent/start.md",
          "Start here",
          "The small entry point your agent reads first.",
        ],
        [
          "/skills/starter-pack/SKILL.md",
          "Starter Pack skill",
          "Guidance for moving through the pack and keeping your place.",
        ],
        [
          "/skills/computer-setup/SKILL.md",
          "Computer Setup skill",
          "Inspect, plan, and set up a computer with your approval.",
        ],
        [
          "/skills/quick-build/SKILL.md",
          "Quick Build skill",
          "Turn an idea into an approved plan and a live project.",
        ],
        [
          "/artifacts/",
          "Progress templates",
          "Starter files for the progress record you and your agent keep.",
        ],
        [
          "/agent/catalog.json",
          "Resource catalog",
          "Find the focused resource for the step you are on.",
        ],
        [
          "/recommendations.json",
          "Recommendations data",
          "Tool choices, reasons, and checked dates.",
        ],
        [
          "/prompts/get-started.txt",
          "Starting prompt",
          "A plain-text copy to save or share.",
        ],
      ];
  return (
    <div className="resource-list">
      {links.map(([href, label, description]) => (
        <a key={href} href={href}>
          <span className="resource-symbol">
            <Icon name={resourceIcon(href)} size={21} />
          </span>
          <span>
            <strong>{label}</strong>
            {description && <small>{description}</small>}
          </span>
          <Icon name="arrow-up-right" size={16} />
        </a>
      ))}
    </div>
  );
}

function resourceIcon(href: string): IconName {
  if (href.includes("computer-setup")) return "monitor";
  if (href.includes("quick-build")) return "blocks";
  if (href.includes("starter-pack") || href.includes("start.md"))
    return "compass";
  if (href.includes("artifacts")) return "folder-git-2";
  if (href.includes("recommendations")) return "list-checks";
  if (href.endsWith(".json")) return "file-json";
  if (href.includes("prompts")) return "terminal";
  return "file-text";
}

function ContextRail({ phase, data }: { phase: number; data: SiteData }) {
  const checked = data.recommendations
    .map((item) => item.checked_at)
    .filter(Boolean)
    .sort()
    .at(-1);
  return (
    <aside className="context-rail" aria-label="Your starting point">
      <section>
        <span className="eyebrow">WHAT YOU NEED</span>
        <div className="need-item">
          <Icon name="terminal" size={18} />
          <div>
            <strong>One capable AI agent</strong>
            <p>
              Use the agent you already have. Common options include:
            </p>
            <ul className="rail-agent-options" aria-label="Common AI agent options">
              {commonAgents.map(({ name, label }) => (
                <li key={name}>
                  <BrandIcon name={name} size={20} />
                  <span>{label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="need-item">
          {phase === 2 ? (
            <Icon name="monitor" size={18} />
          ) : (
            <Icon name="smartphone" size={18} />
          )}
          <div>
            <strong>
              {phase === 2
                ? "A computer + your phone"
                : "Start on your phone. Finish on a computer."}
            </strong>
            <p>
              {phase === 2
                ? "Phase 2 is computer-based; your phone can connect remotely."
                : "Phase 1 works from a phone. Phase 2 requires a computer or a reliable remote connection to one."}
            </p>
          </div>
        </div>
        <p className="account-summary">
          Account checklist: GitHub, Cloudflare, Neon, your primary agent, and
          one instant app builder.
        </p>
        <a className="text-link" href="/recommendations">
          See the recommended tools
          <Icon name="arrow-up-right" size={14} />
        </a>
      </section>
      <section>
        <span className="eyebrow">THE PATH</span>
        <h2>One milestone at a time.</h2>
        <ol className="milestone-list">
          {milestones.map((title, i) => (
            <li
              key={title}
              className={`phase-${i + 1} ${phase === i + 1 ? "current" : ""}`}
            >
              <span className="rail-number">
                <Icon name={phaseIcons[i]} size={17} />
              </span>
              <div>
                <strong>{title}</strong>
                <small>
                  {i === 0
                    ? "A working first build"
                    : i === 1
                      ? "A meaningful project, live"
                      : "Preview of what comes next"}
                </small>
              </div>
            </li>
          ))}
        </ol>
      </section>
      <section className="privacy-note">
        <Icon name="shield-check" size={20} />
        <h2>No Starter Pack account.</h2>
        <p>
          Your agent tracks progress; this site does not. Your progress stays
          with you and your agent, in your own files and private GitHub repo.
        </p>
      </section>
      <div className="rail-footnote">
        Curated by Devin Thomas
        {checked && (
          <>
            <br />
            Recommendations checked {checked}
          </>
        )}
      </div>
    </aside>
  );
}

export default function App({ path, data }: { path: string; data: SiteData }) {
  const normalized = path.replace(/\/$/, "") || "/";
  const phaseNumber = /^\/phases\/[123]$/.test(normalized)
    ? Number(normalized.at(-1))
    : 0;
  const phase = data.phases.find((item) => item.order === phaseNumber);
  const reducedMotion = useReducedMotion();
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="brand-header">
        <div className="brand">
          <span className="brand-mark">
            <img
              src="/uppercut-labs-logo.png"
              alt="Sol"
              width="32"
              height="32"
            />
          </span>
          <div className="brand-wordmark">
            <a className="brand-name" href="/">
              Starter Pack
            </a>
            <span className="brand-attribution">
              by <a href="https://devthomas.site">Devin Thomas</a>
            </span>
          </div>
        </div>
        <div className="header-status">
          <span className="status-dot" />
          Free to use
          <span className="status-divider" />
          No account required
        </div>
        <a className="header-guide" href="/guide">
          <Icon name="book-open" size={16} />
          Guide
        </a>
      </header>
      <nav className="progress-rail" aria-label="The three phases">
        {milestones.map((title, index) => (
          <a
            href={`/phases/${index + 1}`}
            key={title}
            className={`phase-${index + 1} ${phaseNumber === index + 1 ? "active" : ""}`}
            aria-current={phaseNumber === index + 1 ? "page" : undefined}
          >
            <span className="step-number">
              <Icon name={phaseIcons[index]} size={22} />
            </span>
            <span className="progress-label">
              <small>
                {index === 2 ? "PHASE 3 / PREVIEW" : `PHASE ${index + 1}`}
              </small>
              <span className="phase-full-label">{title}</span>
              <span className="phase-short-label">
                {phaseShortLabels[index]}
              </span>
            </span>
            {index === 2 && (
              <Icon name="lock-keyhole" className="preview-icon" size={14} />
            )}
          </a>
        ))}
      </nav>
      <div className="workspace">
        <main id="main" className="workspace-main">
          <motion.div
            initial={false}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: reducedMotion ? 0 : 0.24 }}
          >
            {normalized === "/" ? (
              <>
                <div className="page-heading">
                  <span className="eyebrow">
                    <Icon name="sprout" size={19} />
                    START HERE
                  </span>
                  <h1>
                    Your first build
                    <br />
                    starts here.
                  </h1>
                  <p>
                    A practical pack for making things with an AI agent, from
                    your first working idea to a project you can put online.
                  </p>
                </div>
                <Prompt prompt={data.prompt} />
                <a className="browse-link" href="/guide">
                  <Icon name="book-open" size={17} />
                  Prefer to look around? Browse the guide
                  <Icon name="arrow-right" size={16} />
                </a>
                <section className="content-section">
                  <div className="section-heading">
                    <h2>Three phases. A clear next step.</h2>
                    <span className="metadata">V1: PHASES 1 + 2</span>
                  </div>
                  <PhaseCards />
                </section>
                <section className="content-section how-it-works">
                  <h2 className="icon-heading">
                    <Icon name="route" size={23} />
                    You bring the idea. Your agent helps you build.
                  </h2>
                  <p>
                    Paste the prompt into your agent. It figures out where you
                    are, reads the guidance for your next step, and keeps a
                    record you own. You make the decisions and tell it what is
                    working.
                  </p>
                  <a className="text-link" href="/guide">
                    How the companion works
                    <Icon name="arrow-right" size={15} />
                  </a>
                </section>
              </>
            ) : normalized === "/guide" ? (
              <>
                <PageHeading
                  label="THE GUIDE"
                  title="A small start. A real project."
                  description="Follow the pack with your agent, or browse each phase at your own pace."
                />
                <PhaseCards />
                <article
                  className="content-section prose"
                  dangerouslySetInnerHTML={{ __html: data.pages.guide }}
                />
                <p className="muted">
                  <a className="text-link" href="/guide.md">
                    Markdown
                  </a>{" "}
                  /{" "}
                  <a className="text-link" href="/guide.json">
                    JSON
                  </a>
                </p>
                <Prompt prompt={data.prompt} />
              </>
            ) : phase ? (
              <>
                <PageHeading
                  label={`PHASE 0${phaseNumber}${phaseNumber === 3 ? " / PREVIEW" : ""}`}
                  title={phase.title}
                  description={phase.summary}
                />
                {phaseNumber === 3 && (
                  <div className="notice">
                    <Icon name="book-open" size={18} />
                    <p>
                      This is a preview. The complete Phase 3 curriculum is not
                      part of this release.
                    </p>
                  </div>
                )}
                <article
                  className="prose"
                  dangerouslySetInnerHTML={{ __html: phase.html }}
                />
                <section className="content-section">
                  <h2 className="icon-heading">
                    <Icon name="terminal" size={22} />
                    For your agent
                  </h2>
                  <p className="muted">
                    Share the focused guidance for this phase.
                  </p>
                  <Resources phase={phaseNumber} />
                </section>
                <div className="step-actions">
                  <a
                    href={
                      phaseNumber === 1
                        ? "/guide"
                        : `/phases/${phaseNumber - 1}`
                    }
                    className="secondary-action"
                  >
                    {phaseNumber === 1 ? "Back to guide" : "Previous phase"}
                  </a>
                  <span className="metadata">0{phaseNumber} / 03</span>
                  <a
                    className="primary-action"
                    href={phaseNumber < 3 ? `/phases/${phaseNumber + 1}` : "/"}
                  >
                    {phaseNumber < 3
                      ? phaseNumber === 2
                        ? "Phase 3 preview"
                        : "Continue to Phase 2"
                      : "Get Started"}
                    <Icon name="arrow-right" size={16} />
                  </a>
                </div>
              </>
            ) : normalized === "/recommendations" ? (
              <>
                <PageHeading
                  label="THE TOOLKIT"
                  title="Tools I would hand a friend."
                  description="Devin Thomas's current picks, with a reason for each one. Your agent helps you use the tools that fit your next step."
                />
                <div className="recommendation-list">
                  {data.recommendations.map((item) => (
                    <article className="recommendation" key={item.id}>
                      <div className="recommendation-top">
                        <span className="eyebrow">
                          {item.category.replaceAll("_", " ")}
                        </span>
                        <span
                          className={`requirement requirement-${item.requirement}`}
                        >
                          {item.status === "deprecated"
                            ? "Deprecated"
                            : item.requirement.replaceAll("_", " ")}
                        </span>
                      </div>
                      <h2>
                        <a href={item.url}>
                          <span className="tool-mark">
                            {isBrandName(item.id) ? (
                              <BrandIcon name={item.id} size={27} />
                            ) : (
                              <Icon name="blocks" size={25} />
                            )}
                          </span>
                          <span>{item.name}</span>
                          <Icon name="arrow-up-right" size={17} />
                        </a>
                      </h2>
                      <p>{item.reason}</p>
                      <div className="recommendation-meta">
                        <span>
                          Recommended by {item.recommended_by || "Devin Thomas"}
                        </span>
                        <span>Checked {item.checked_at}</span>
                      </div>
                    </article>
                  ))}
                </div>
              </>
            ) : normalized === "/resources" ? (
              <>
                <PageHeading
                  label="SKILLS + RESOURCES"
                  title="The pack behind your agent."
                  description="Readable, focused guidance you can inspect, save, or share directly with your agent."
                />
                <Resources />
                <section className="content-section">
                  <h2>Phase guides</h2>
                  {[1, 2, 3].map((number) => (
                    <div className="phase-resource" key={number}>
                      <h3>
                        Phase {number}: {milestones[number - 1]}
                      </h3>
                      <Resources phase={number} />
                    </div>
                  ))}
                </section>
                <a className="text-link" href="/llms.txt">
                  Agent discovery index
                  <Icon name="arrow-up-right" size={15} />
                </a>
              </>
            ) : normalized === "/about" ? (
              <>
                <PageHeading
                  label="ABOUT THE PACK"
                  title="A starting point, from me to you."
                  description="I'm Devin Thomas. This is the collection of tools and guidance I would give a friend who wants to start building with an AI agent."
                />
                <article
                  className="prose"
                  dangerouslySetInnerHTML={{ __html: data.pages.about }}
                />
                <p className="muted">
                  <a className="text-link" href="/about.md">
                    Markdown
                  </a>{" "}
                  /{" "}
                  <a className="text-link" href="/about.json">
                    JSON
                  </a>
                </p>
                <a href="/" className="primary-action">
                  Get Started
                  <Icon name="arrow-right" size={16} />
                </a>
              </>
            ) : (
              <>
                <PageHeading
                  label="PAGE NOT FOUND"
                  title="Let's find your next step."
                  description="This page is not in the pack. The guide is a good place to pick up again."
                />
                <a href="/guide" className="primary-action">
                  Open the guide
                  <Icon name="arrow-right" size={16} />
                </a>
              </>
            )}
          </motion.div>
        </main>
        <ContextRail phase={phaseNumber} data={data} />
      </div>
      <footer className="site-footer">
        <div>
          <strong>Starter Pack</strong>
          <span>By Devin Thomas / Uppercut Labs</span>
        </div>
        <nav aria-label="Footer">
          {nav.map(([href, label]) => (
            <a
              key={href}
              href={href}
              aria-current={normalized === href ? "page" : undefined}
            >
              {label}
            </a>
          ))}
          <a href="/prompts/get-started.txt" download>
            <Icon name="download" size={13} />
            Prompt
          </a>
        </nav>
      </footer>
    </div>
  );
}

function PageHeading({
  label,
  title,
  description,
}: {
  label: string;
  title: string;
  description: string;
}) {
  return (
    <div className="page-heading">
      <span className="eyebrow">
        <span className="small-rule" />
        {label}
      </span>
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
  );
}
