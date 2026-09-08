import { type ReactNode } from "react";
import { CopyText } from "./CopyText";
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
  phase2Prompt: string;
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

function Prompt({
  prompt,
  phase2 = false,
  home = false,
}: {
  prompt: string;
  phase2?: boolean;
  home?: boolean;
}) {
  return (
    <section
      id="starting-prompt"
      className="prompt-workbench"
      aria-labelledby="prompt-label"
    >
      <div className="document-toolbar">
        <span id="prompt-label">
          <Icon name="terminal" size={20} />
          {phase2 ? "Phase 2 handoff" : "Your starting prompt"}
        </span>
        <span className="metadata">COPY + PASTE</span>
      </div>
      {!phase2 && <AgentBrands />}
      <CopyText
        text={prompt}
        label={phase2 ? "Phase 2 handoff text" : "Starting prompt text"}
        buttonLabel={
          home ? "Get Started" : phase2 ? "Copy Phase 2 handoff" : "Copy prompt"
        }
        copiedLabel={phase2 ? "Handoff copied" : "Prompt copied"}
        instruction={
          phase2
            ? "Paste into your computer agent. Attach your saved progress before sending."
            : "Paste into your agent, then send."
        }
        download={phase2 ? "/prompts/phase-2.txt" : "/prompts/get-started.txt"}
      />
      {!phase2 && (
        <div className="prompt-explainer">
          <h3>What happens next?</h3>
          <p>
            Your agent reads the pack and helps you take one step at a time. It
            asks before changing your computer.
          </p>
        </div>
      )}
    </section>
  );
}

function ExternalLink({
  href,
  children,
  label,
}: {
  href: string;
  children: ReactNode;
  label?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label ? `${label} (opens in a new tab)` : undefined}
    >
      {children}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

function PhaseContent({
  phase,
  data,
}: {
  phase: SiteData["phases"][number];
  data: SiteData;
}) {
  const boundary =
    phase.order === 1 ? "use-the-setup-you-have" : "complete-computer-setup";
  const split =
    phase.order < 3 ? phase.html.indexOf(`<h2 id="${boundary}"`) : -1;
  if (phase.order < 3 && split < 0)
    throw new Error(`Missing phase ${phase.order} handoff position`);
  return (
    <>
      <article
        className="prose"
        dangerouslySetInnerHTML={{
          __html: split < 0 ? phase.html : phase.html.slice(0, split),
        }}
      />
      {split >= 0 && (
        <>
          <Prompt
            prompt={phase.order === 1 ? data.prompt : data.phase2Prompt}
            phase2={phase.order === 2}
          />
          <article
            className="prose"
            dangerouslySetInnerHTML={{ __html: phase.html.slice(split) }}
          />
        </>
      )}
    </>
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
            <Icon name="arrow-right" size={16} />
          </span>
        </a>
      ))}
    </div>
  );
}

const resourceOrigin = "https://starter.devthomas.site";
type Resource = readonly [path: string, label: string, description?: string];
const templateResources: Resource[] = [
  [
    "/artifacts/progress/README.md",
    "Progress repository template",
    "Your agent uses this to keep a private record of completed work.",
  ],
  [
    "/artifacts/quick-build/README.md",
    "Quick Build templates",
    "Your agent creates the plan and project notes from these files.",
  ],
  ["/setup/computer-setup.manifest.json", "Computer Setup manifest"],
  ["/setup/state.example.json", "Setup state example"],
  ["/skills/versions.json", "Skill versions"],
];

function ResourceList({ items }: { items: Resource[] }) {
  return (
    <div className="resource-list">
      {items.map(([path, label, description]) => (
        <div className="resource-item" key={path}>
          <div className="resource-heading">
            <span className="resource-symbol">
              <Icon name={resourceIcon(path)} size={21} />
            </span>
            <div>
              <strong>{label}</strong>
              {description && <small>{description}</small>}
            </div>
          </div>
          <CopyText
            text={`${resourceOrigin}${path}`}
            label={`${label} address`}
            alwaysVisible
            buttonLabel="Copy address"
            copiedLabel="Address copied"
            instruction="Paste into your agent."
          />
        </div>
      ))}
    </div>
  );
}

function Resources({ phase }: { phase?: number }) {
  const items: Resource[] = phase
    ? [
        [`/phases/${phase}.md`, "Phase guide for your agent"],
        [`/phases/${phase}.json`, "Phase data"],
        ...(phase === 2
          ? ([
              [
                "/skills/computer-setup/SKILL.md",
                "Computer Setup instructions",
              ],
              ["/skills/quick-build/SKILL.md", "Quick Build instructions"],
            ] satisfies Resource[])
          : ([
              ["/skills/starter-pack/SKILL.md", "Starter Pack instructions"],
            ] satisfies Resource[])),
      ]
    : [
        [
          "/agent/start.md",
          "Agent entry point",
          "The first file your agent reads after you send the starting prompt.",
        ],
        [
          "/skills/starter-pack/SKILL.md",
          "Starter Pack instructions",
          "How your agent guides you and keeps your place.",
        ],
        [
          "/skills/computer-setup/SKILL.md",
          "Computer Setup instructions",
          "How your agent inspects and sets up a computer with your approval.",
        ],
        [
          "/skills/quick-build/SKILL.md",
          "Quick Build instructions",
          "How your agent turns an idea into an approved plan and a live project.",
        ],
        ["/agent/catalog.json", "Resource catalog"],
        ["/recommendations.json", "Recommendations data"],
        ["/guide.md", "Guide for your agent"],
        ["/about.md", "About the pack for your agent"],
        ["/guide.json", "Guide data"],
        ["/about.json", "About data"],
        ["/llms.txt", "Agent discovery index"],
      ];
  if (phase) return <ResourceList items={items} />;
  return (
    <>
      <ResourceList items={items.slice(0, 4)} />
      <details className="content-section agent-files">
        <summary>Catalog and reference files</summary>
        <ResourceList items={items.slice(4)} />
      </details>
    </>
  );
}

function AgentFiles({ phase }: { phase: number }) {
  return (
    <details className="content-section agent-files">
      <summary>Files for your agent</summary>
      <p className="muted">
        Your agent follows these files from the prompt. If it asks for an
        address, copy one here. On iPhone, you can also touch and hold the
        address to select and copy it.
      </p>
      <Resources phase={phase} />
    </details>
  );
}

function RecommendationCard({
  item,
  featured = false,
}: {
  item: SiteData["recommendations"][number];
  featured?: boolean;
}) {
  return (
    <article
      className={`recommendation${featured ? " recommendation-featured" : ""}`}
    >
      <div className="recommendation-top">
        <span className="eyebrow">{item.category.replaceAll("_", " ")}</span>
        <span className={`requirement requirement-${item.requirement}`}>
          {item.status === "deprecated"
            ? "Deprecated"
            : item.requirement.replaceAll("_", " ")}
        </span>
      </div>
      <h2>
        <ExternalLink href={item.url} label={item.name}>
          <span className="tool-mark">
            {isBrandName(item.id) ? (
              <BrandIcon name={item.id} size={27} />
            ) : (
              <Icon name="blocks" size={25} />
            )}
          </span>
          <span>{item.name}</span>
          <Icon name="arrow-up-right" size={17} />
        </ExternalLink>
      </h2>
      <p>{item.reason}</p>
      <div className="recommendation-meta">
        <span>Recommended by {item.recommended_by || "Devin Thomas"}</span>
        <span>Checked {item.checked_at}</span>
      </div>
    </article>
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
            <p>Use the agent you already have. Common options include:</p>
            <ul
              className="rail-agent-options"
              aria-label="Common AI agent options"
            >
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
          <Icon name="arrow-right" size={14} />
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
              by{" "}
              <ExternalLink href="https://devthomas.site">
                Devin Thomas <Icon name="arrow-up-right" size={12} />
              </ExternalLink>
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
                <Prompt prompt={data.prompt} home />
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
                <PhaseContent phase={phase} data={data} />
                <AgentFiles phase={phaseNumber} />
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
                  description="Start with the required tools, choose one instant builder, and keep Vercel as an optional hosting path."
                />
                <p className="muted">
                  Tool links open in a new tab so you can return to the pack.
                </p>
                <div className="recommendation-groups">
                  <section className="recommendation-group">
                    <div className="recommendation-group-heading">
                      <span className="eyebrow">REQUIRED</span>
                      <h2>Core accounts and tools</h2>
                      <p>
                        These are the foundations for the full Starter Pack
                        path.
                      </p>
                    </div>
                    <div className="recommendation-list">
                      {data.recommendations
                        .filter((item) => item.requirement === "required")
                        .map((item) => (
                          <RecommendationCard item={item} key={item.id} />
                        ))}
                    </div>
                  </section>
                  <section className="recommendation-group">
                    <div className="recommendation-group-heading">
                      <span className="eyebrow">INSTANT BUILDERS</span>
                      <h2>Choose one instant builder</h2>
                      <p>
                        Google AI Studio is the recommended option. The others
                        are alternatives for making your first working thing.
                      </p>
                    </div>
                    <div className="recommendation-list">
                      {data.recommendations
                        .filter((item) => item.category === "instant-builder")
                        .sort((a, b) =>
                          a.id === "google-ai-studio"
                            ? -1
                            : b.id === "google-ai-studio"
                              ? 1
                              : 0,
                        )
                        .map((item) => (
                          <RecommendationCard
                            item={item}
                            featured={item.id === "google-ai-studio"}
                            key={item.id}
                          />
                        ))}
                    </div>
                  </section>
                  <section className="recommendation-group">
                    <div className="recommendation-group-heading">
                      <span className="eyebrow">OPTIONAL</span>
                      <h2>Vercel, if you want another hosting path</h2>
                      <p>
                        Vercel is an alternate deployment option, not a required
                        account.
                      </p>
                    </div>
                    <div className="recommendation-list">
                      {data.recommendations
                        .filter((item) => item.requirement === "optional")
                        .map((item) => (
                          <RecommendationCard item={item} key={item.id} />
                        ))}
                    </div>
                  </section>
                </div>
              </>
            ) : normalized === "/resources" ? (
              <>
                <PageHeading
                  label="SKILLS + RESOURCES"
                  title="The pack behind your agent."
                  description="These addresses are for your agent to read. Copy one when it asks for a specific file."
                />
                <p className="muted">
                  Reading on your own?{" "}
                  <a className="text-link" href="/guide">
                    Open the guide
                  </a>
                  . To begin with an agent,{" "}
                  <a className="text-link" href="/guide#starting-prompt">
                    go to the starting prompt
                  </a>
                  .
                </p>
                <p className="muted">
                  Addresses are selectable text. On iPhone, touch and hold an
                  address to copy it, or use Copy address.
                </p>
                <Resources />
                <p>
                  <a className="text-link" href="/artifacts">
                    Progress and planning templates{" "}
                    <Icon name="arrow-right" size={15} />
                  </a>
                </p>
                <section className="content-section">
                  <h2>Phase guides</h2>
                  {[1, 2, 3].map((number) => (
                    <details
                      className="phase-resource agent-files"
                      key={number}
                    >
                      <summary>
                        Phase {number}: {milestones[number - 1]}
                      </summary>
                      <p>
                        <a className="text-link" href={`/phases/${number}`}>
                          Read Phase {number}{" "}
                          <Icon name="arrow-right" size={15} />
                        </a>
                      </p>
                      <Resources phase={number} />
                    </details>
                  ))}
                </section>
              </>
            ) : normalized === "/artifacts" ? (
              <>
                <PageHeading
                  label="FILES FOR YOUR AGENT"
                  title="Progress and planning templates."
                  description="Your agent uses these starter files to keep your progress and prepare your project. You review its summaries and decide what to do next."
                />
                <p className="muted">
                  Copy an address into your agent if it asks for a template.
                  Your completed progress and private project notes stay in your
                  own storage.
                </p>
                <ResourceList items={templateResources} />
                <p>
                  <a className="text-link" href="/resources">
                    All agent resources
                  </a>
                </p>
                <a className="text-link" href="/guide#starting-prompt">
                  Go to the starting prompt
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
            Download prompt (.txt)
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
