import { type ReactNode } from "react";
import { CopyText } from "./CopyText";
import { Feedback } from "./Feedback";
import { motion, useReducedMotion } from "motion/react";
import {
  Icon,
  AgentBrands,
  BrandIcon,
  commonAgents,
  isBrandName,
  type IconName,
} from "./Icons";

export interface SkillEntry {
  id: string;
  slug: string;
  title: string;
  summary: string;
  category: string;
  order: number;
  sourceRepo: string;
  sourcePath: string;
  sourceVersion: string | null;
  sourceRevision: string;
  sourceRef: string;
  public: boolean;
  ownedBy: string;
  relatedSkills: string[];
  prerequisites: { skillId?: string; platform?: string; application?: string; reason?: string }[];
  recommendationOnly: boolean;
}

export interface SkillLesson {
  skillId: string;
  updated: string;
  html: string;
  video?: { url: string; title?: string };
}

export interface SiteData {
  pages: { guide: string; about: string; cloudflareIphone: string };
  phases: {
    id: string;
    title: string;
    summary: string;
    status: string;
    order: number;
    html: string;
    outline: { id: string; labelHtml: string; lesson: boolean }[];
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
    referral?: { url: string; disclosure: string };
  }[];
  skills: {
    manifest: SkillEntry[];
    lessons: Record<string, SkillLesson>;
    recommendations: { group: string; description: string; items: { name: string; title: string; description: string; author: string; url: string }[] }[];
  };
  styles: {
    guides: {
      id: string;
      title: string;
      summary: string;
      status: string;
      updated: string;
      acceptedThrough: string;
      version: string;
      route: string;
      html: string;
      outline: { id: string; labelHtml: string }[];
    }[];
  };
  prompt: string;
  phase2Prompt: string;
  instructionPacket: string;
}

const milestones = [
  "Make something new",
  "Harness your power",
  "Build something great",
];
const phaseIcons = ["sprout", "blocks", "compass"] as const;
const phaseShortLabels = ["Make", "Harness", "Build"];
const nav = [
  ["/guide", "Guide"],
  ["/skills", "Skills"],
  ["/style", "Style guides"],
  ["/recommendations", "Recommendations"],
  ["/resources", "Agent resources"],
  ["/about", "About"],
  ["/contact", "Share feedback"],
];

function Prompt({
  prompt,
  phase2 = false,
  home = false,
  instructionPacket,
}: {
  prompt: string;
  phase2?: boolean;
  home?: boolean;
  instructionPacket?: string;
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
      {!phase2 && instructionPacket && (
        <details className="prompt-explainer packet-recovery">
          <summary>Chat can't open the guide?</summary>
          <CopyText text={instructionPacket} label="Phase 1 instruction packet" buttonLabel="Copy instruction packet" copiedLabel="Instruction packet copied" instruction="Paste into the same chat. Keep your existing progress." download="/agent/phase-1-packet.txt" />
          <a className="text-link" href="/agent/phase-1-packet.txt" download="starter-pack-phase-1.txt"><Icon name="download" size={17} /> Download instruction packet (.txt)</a>
        </details>
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
  const internal = new URL(href, resourceOrigin).origin === resourceOrigin;
  return (
    <a
      href={href}
      target={internal ? undefined : "_blank"}
      rel={internal ? undefined : "noopener noreferrer"}
      aria-label={label ? internal ? label : `${label} (opens in a new tab)` : undefined}
    >
      {children}
      {!internal && <span className="sr-only"> (opens in a new tab)</span>}
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
    <div className={`phase-content phase-${phase.order}`}>
      <nav className="phase-outline" aria-label="On this page">
        <details>
          <summary>Steps and lessons in this phase</summary>
          <ol>
            {phase.outline.map((item) => (
              <li key={item.id} className={item.lesson ? "outline-lesson" : undefined}>
                <a href={`#${item.id}`}>
                  {item.lesson && <span className="outline-label">Lesson</span>}
                  <span dangerouslySetInnerHTML={{ __html: item.labelHtml }} />
                </a>
              </li>
            ))}
          </ol>
        </details>
      </nav>
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
            instructionPacket={data.instructionPacket}
          />
          <article
            className="prose"
            dangerouslySetInnerHTML={{ __html: phase.html.slice(split) }}
          />
        </>
      )}
    </div>
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
    "/artifacts/progress-workbench/README.md",
    "Progress Workbench instructions",
    "Your agent assembles and runs your local progress dashboard during setup.",
  ],
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
        ["/style/TypeScript.md", "TypeScript style guide"],
        ["/style/catalog.json", "Style guide catalog"],
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
}: {
  item: SiteData["recommendations"][number];
}) {
  const devinsPick = item.id === "chatgpt" || item.id === "google-ai-studio";
  const internal = new URL(item.url, resourceOrigin).origin === resourceOrigin;
  return (
    <article className="recommendation">
      <div className="recommendation-top">
        <span className="eyebrow">{item.category.replaceAll("_", " ")}</span>
        <span className={`requirement ${devinsPick ? "devin-pick" : `requirement-${item.requirement}`}`}>
          {devinsPick
            ? "Devin's Pick"
            : item.status === "deprecated"
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
              <Icon
                name={
                  item.category === "phone-app"
                    ? "smartphone"
                    : item.id === "authenticator"
                      ? "shield-check"
                      : "blocks"
                }
                size={25}
              />
            )}
          </span>
          <span>{item.name}</span>
          <Icon name={internal ? "arrow-right" : "arrow-up-right"} size={17} />
        </ExternalLink>
      </h2>
      {item.reason.split("\n\n").map((paragraph, index) => (
        <p key={index}>
          {item.id === "primary-ai-phone-app"
            ? paragraph.split(/(ChatGPT|Claude|Cursor)/g).map((part, partIndex) =>
                /^(ChatGPT|Claude|Cursor)$/.test(part)
                  ? <strong key={partIndex}>{part}</strong>
                  : part,
              )
            : paragraph}
        </p>
      ))}
      {item.referral && (
        <div className="recommendation-referral">
          <p>No AI subscription yet? If you decide to try ChatGPT, you can use my optional referral link.</p>
          <p>
            <ExternalLink href={item.referral.url}>Use my ChatGPT referral</ExternalLink>
            {" or "}
            <ExternalLink href="https://chatgpt.com/">go directly to ChatGPT</ExternalLink>.
          </p>
          <p>{item.referral.disclosure}</p>
        </div>
      )}
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
            <strong>{phase === 2 ? "One development harness" : "An AI companion on your phone"}</strong>
            <p>{phase === 2 ? "Choose a harness for your project work." : "Supported phone companions:"}</p>
            <ul
              className="rail-agent-options"
              aria-label="Common AI agent options"
            >
              {commonAgents.filter(({ name }) => phase === 2 || name !== "antigravity").map(({ name, label }) => (
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
          Required phone apps: your primary AI app, GitHub Mobile, and an
          authenticator.
        </p>
        <p className="account-summary">
          Account checklist: GitHub, Cloudflare, Neon, your phone companion, and
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

const categoryLabels: Record<string, string> = {
  plan: "Plan", build: "Build", specialized: "Specialized", fun: "Fun",
};

function SkillPage({ entry, lesson, manifest, lessons }: { entry: SkillEntry; lesson: SkillLesson; manifest: SkillEntry[]; lessons: Record<string, SkillLesson> }) {
  const sourceUrl = `https://github.com/${entry.sourceRepo}/blob/${entry.sourceRef}/${entry.sourcePath}`;
  const relatedEntries = entry.relatedSkills
    .map((id) => manifest.find((s) => s.id === id))
    .filter((s): s is SkillEntry => s != null && s.public && !s.recommendationOnly);
  const skillPrereqs = entry.prerequisites.filter((p) => p.skillId);
  const platformPrereqs = entry.prerequisites.filter((p) => p.platform || p.application);

  return (
    <>
      <PageHeading
        label={categoryLabels[entry.category] || entry.category}
        title={entry.title}
        description={entry.summary}
      />
      {lesson.video && (
        <div className="skill-video">
          <video controls src={lesson.video.url}>
            {lesson.video.title && <track kind="captions" label={lesson.video.title} />}
          </video>
        </div>
      )}
      <article className="prose" dangerouslySetInnerHTML={{ __html: lesson.html }} />
      {platformPrereqs.length > 0 && (
        <section className="skill-meta-section">
          <h2>Compatibility</h2>
          <ul>
            {platformPrereqs.map((p, i) => (
              <li key={i}>{p.reason || p.platform || p.application}</li>
            ))}
          </ul>
        </section>
      )}
      {(skillPrereqs.length > 0 || relatedEntries.length > 0) && (
        <section className="skill-meta-section">
          {skillPrereqs.length > 0 && (
            <>
              <h2>Prerequisites</h2>
              <ul>
                {skillPrereqs.map((p) => {
                  const linked = manifest.find((s) => s.id === p.skillId);
                  return (
                    <li key={p.skillId}>
                      {linked && lessons[linked.slug] ? <a href={`/skills/${linked.slug}`}>{linked.title}</a> : linked ? <strong>{linked.title}</strong> : p.skillId}
                      {p.reason && ` — ${p.reason}`}
                    </li>
                  );
                })}
              </ul>
            </>
          )}
          {relatedEntries.length > 0 && (
            <>
              <h2>Related skills</h2>
              <ul>
                {relatedEntries.map((s) => (
                  <li key={s.id}>
                    {lessons[s.slug] ? <a href={`/skills/${s.slug}`}>{s.title}</a> : <strong>{s.title}</strong>} — {s.summary}
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}
      <section className="skill-meta-section skill-source">
        <h2>Source</h2>
        <p>
          Canonical implementation: <a href={`https://github.com/${entry.sourceRepo}/tree/${entry.sourceRef}/${entry.sourcePath.replace(/\/[^/]+$/, "")}`} target="_blank" rel="noopener noreferrer">
            {entry.sourceRepo}<Icon name="arrow-up-right" size={13} /><span className="sr-only"> (opens in a new tab)</span>
          </a>
          {entry.sourceVersion && <span className="metadata"> v{entry.sourceVersion}</span>}
        </p>
      </section>
      <a href="/skills" className="text-link">
        All skills
        <Icon name="arrow-right" size={15} />
      </a>
    </>
  );
}

function SkillsHub({ data }: { data: SiteData }) {
  const categories = data.skills.manifest[0] ? [...new Set(data.skills.manifest.map((s) => s.category))] : [];
  const orderedCategories = ["plan", "build", "specialized", "fun"].filter((c) => categories.includes(c));
  return (
    <>
      <PageHeading
        label="SKILLS"
        title="Tools for every stage of a build."
        description="Agent skills that help you plan, build, maintain, and ship. Pick what fits your current job."
      />
      <p className="muted">
        Skills are reusable instructions your agent follows. You do not need all of them. Start with the one that matches your next step.
      </p>
      {orderedCategories.map((cat) => (
        <section key={cat} className="content-section">
          <h2>{categoryLabels[cat] || cat}</h2>
          <div className="recommendation-list">
            {data.skills.manifest
              .filter((s) => s.category === cat && s.public && !s.recommendationOnly)
              .sort((a, b) => a.order - b.order)
              .map((s) => {
                const hasLesson = !!data.skills.lessons[s.id];
                return hasLesson ? (
                  <a key={s.id} href={`/skills/${s.slug}`} className="recommendation skill-card">
                    <h3>{s.title}</h3>
                    <p>{s.summary}</p>
                  </a>
                ) : (
                  <div key={s.id} className="recommendation skill-card">
                    <h3>{s.title}</h3>
                    <p>{s.summary}</p>
                  </div>
                );
              })}
          </div>
        </section>
      ))}
      <section className="content-section">
        <h2>Third-party recommendations</h2>
        <p>Skills and resources from other authors that complement this collection.</p>
        <a className="text-link" href="/skills/recommendations">
          Browse recommendations
          <Icon name="arrow-right" size={15} />
        </a>
      </section>
    </>
  );
}

function SkillRecommendations({ data }: { data: SiteData }) {
  return (
    <>
      <PageHeading
        label="SKILL RECOMMENDATIONS"
        title="Worth learning from."
        description="Third-party skills and resources that complement the Starter Pack collection. These are not authored or maintained by Devin."
      />
      {data.skills.recommendations.map((group) => (
        <section key={group.group} className="content-section">
          <div className="section-heading">
            <h2>{group.group}</h2>
            <p className="muted">{group.description}</p>
          </div>
          <div className="recommendation-list">
            {group.items.map((item) => (
              <div key={item.name} className="recommendation skill-card">
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                <span className="metadata">By {item.author}</span>
              </div>
            ))}
          </div>
        </section>
      ))}
      <p className="muted">
        All skills above are authored by their respective creators. Source and installation:{" "}
        <ExternalLink href="https://github.com/mattpocock/skills">
          mattpocock/skills<Icon name="arrow-up-right" size={12} />
        </ExternalLink>{" "}
        and{" "}
        <ExternalLink href="https://aihero.dev/skills">
          aihero.dev<Icon name="arrow-up-right" size={12} />
        </ExternalLink>
      </p>
      <a href="/skills" className="text-link">
        Back to all skills
        <Icon name="arrow-right" size={15} />
      </a>
    </>
  );
}

type StyleGuideEntry = SiteData["styles"]["guides"][number];

function StyleHub({ data }: { data: SiteData }) {
  return (
    <>
      <PageHeading
        label="STYLE GUIDES"
        title="Style guides."
        description="Public house rules for code I write and agent work I direct."
      />
      <div className="style-guide-grid">
        {data.styles.guides.map((guide) => (
          <a className="style-guide-card" href={guide.route} key={guide.id}>
            <div className="style-guide-card-top">
              <span className="style-status">{guide.status.replaceAll("-", " ")}</span>
              <span className="metadata">{guide.acceptedThrough}</span>
            </div>
            <h2>{guide.title}</h2>
            <p>{guide.summary}</p>
            <span className="text-link">
              Read guide
              <Icon name="arrow-right" size={15} />
            </span>
          </a>
        ))}
      </div>
      <p className="muted style-hub-note">
        More language guides will appear here as their rules are developed.
      </p>
    </>
  );
}

function StyleGuidePage({ guide }: { guide: StyleGuideEntry }) {
  return (
    <>
      <PageHeading
        label="STYLE GUIDE"
        title={guide.title}
        description={guide.summary}
      />
      <div className="style-status-bar" aria-label="Guide status">
        <span className="style-status">{guide.status.replaceAll("-", " ")}</span>
        <span>{guide.acceptedThrough}</span>
        <span>Updated {guide.updated}</span>
      </div>
      <section className="style-agent-panel" aria-labelledby="style-agent-access">
        <div className="section-heading">
          <h2 id="style-agent-access">Agent access</h2>
          <span className="metadata">MARKDOWN + JSON</span>
        </div>
        <p className="muted">
          Give an agent the Markdown address when you want it to follow this style guide.
        </p>
        <div className="style-agent-links">
          <CopyText
            text={`${resourceOrigin}${guide.route}.md`}
            label="Style guide Markdown address"
            alwaysVisible
            buttonLabel="Copy Markdown address"
            copiedLabel="Markdown address copied"
          />
          <CopyText
            text={`${resourceOrigin}${guide.route}.json`}
            label="Style guide JSON address"
            alwaysVisible
            buttonLabel="Copy JSON address"
            copiedLabel="JSON address copied"
          />
        </div>
      </section>
      <article
        className="prose style-guide-prose"
        dangerouslySetInnerHTML={{ __html: guide.html }}
      />
    </>
  );
}

export default function App({ path, data }: { path: string; data: SiteData }) {
  const normalized = path.replace(/\/$/, "") || "/";
  const phaseNumber = /^\/phases\/[123]$/.test(normalized)
    ? Number(normalized.at(-1))
    : 0;
  const phase = data.phases.find((item) => item.order === phaseNumber);
  const skillSlug = normalized.startsWith("/skills/") ? normalized.slice("/skills/".length) : null;
  const skillPage = skillSlug ? (() => {
    const entry = data.skills.manifest.find((s) => s.slug === skillSlug && s.public && !s.recommendationOnly);
    const lesson = entry ? data.skills.lessons[entry.id] : undefined;
    return entry && lesson ? { entry, lesson } : null;
  })() : null;
  const styleGuide = data.styles.guides.find((guide) => guide.route === normalized);
  const styleRoute = normalized === "/style" || normalized.startsWith("/style/");
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
        <a className="header-guide" href={styleRoute ? "/style" : "/skills"}>
          <Icon name="book-open" size={16} />
          {styleRoute ? "Style guides" : "Skills"}
        </a>
      </header>
      {!styleRoute && (
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
      )}
      <div className={`workspace${styleRoute ? " style-workspace" : ""}`}>
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
                <Prompt prompt={data.prompt} instructionPacket={data.instructionPacket} home />
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

                <Prompt prompt={data.prompt} instructionPacket={data.instructionPacket} />
              </>
            ) : normalized === "/help/cloudflare-iphone" ? (
              <>
                <PageHeading
                  label="EXTRA CREDIT / IPHONE"
                  title="Deploy a static site to Cloudflare from your iPhone"
                  description="Turn website files from your agent into a public site using Files and Safari."
                />
                <div className="phase-content help-guide">
                  <article
                    className="prose"
                    dangerouslySetInnerHTML={{ __html: data.pages.cloudflareIphone }}
                  />
                </div>
                <div className="step-actions">
                  <a className="secondary-action" href="/phases/1#extra-credit-put-your-app-online">
                    Back to Phase 1 extra credit
                  </a>
                </div>
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
                  <section id="choose-your-agent" className="recommendation-group">
                    <div className="recommendation-group-heading">
                      <span className="eyebrow">HARNESS</span>
                      <h2>Choose your development harness</h2>
                      <p>
                        Your harness is where your agent works on project files
                        and runs development tools during Phase 2. I use Codex.
                        Your phone companion is a separate choice below.
                      </p>
                    </div>
                    <div className="recommendation-list">
                      {data.recommendations
                        .filter((item) => item.category === "harness")
                        .map((item) => (
                          <RecommendationCard item={item} key={item.id} />
                        ))}
                    </div>
                  </section>
                  <section id="choose-your-ide" className="recommendation-group sr-only">
                    <div className="recommendation-group-heading">
                      <span className="eyebrow">COMPUTER SETUP</span>
                      <h2>Your IDE follows your harness</h2>
                      <p>Your agent installs and configures it as part of the approved setup batch.</p>
                    </div>
                    <ul>
                      <li><strong>Antigravity:</strong> <ExternalLink href="https://antigravity.google/download">Antigravity IDE</ExternalLink></li>
                      <li><strong>Cursor:</strong> <ExternalLink href="https://cursor.com/download">Cursor</ExternalLink></li>
                      <li><strong>All other routes, including ChatGPT/Codex and Claude Code:</strong> <ExternalLink href="https://code.visualstudio.com/">VS Code</ExternalLink></li>
                    </ul>
                  </section>
                  <section className="recommendation-group">
                    <div className="recommendation-group-heading">
                      <span className="eyebrow">REQUIRED</span>
                      <h2>Core accounts and tools</h2>
                      <p>
                        Start with a companion on your phone, then prepare
                        these apps and accounts.
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
                        Google AI Studio is my pick. These are all recommended
                        options for making your first working thing.
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
            ) : normalized === "/style" ? (
              <StyleHub data={data} />
            ) : styleGuide ? (
              <StyleGuidePage guide={styleGuide} />
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
                <section className="field-lesson" aria-labelledby="workbench-download">
                  <h2 id="workbench-download">See your progress on your own computer</h2>
                  <p>Download the Workbench, then open it with your saved progress JSON. Your agent keeps the record up to date. This site stays a shared guide.</p>
                  <a className="primary-action" href="/artifacts/progress-workbench/index.html" download="index.html">Download Progress Workbench <Icon name="download" size={18} /></a>
                </section>
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
            ) : normalized === "/contact" ? (
              <Feedback />
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
            ) : normalized === "/skills" ? (
              <SkillsHub data={data} />
            ) : normalized === "/skills/recommendations" ? (
              <SkillRecommendations data={data} />
            ) : normalized.startsWith("/skills/") && skillPage ? (
              <SkillPage entry={skillPage.entry} lesson={skillPage.lesson} manifest={data.skills.manifest} lessons={data.skills.lessons} />
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
        {!styleRoute && <ContextRail phase={phaseNumber} data={data} />}
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
