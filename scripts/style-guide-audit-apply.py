from pathlib import Path
import json

# One-time audited migration, run only on the staging branch. Each replacement
# refuses unexpected source; nothing here writes to main or changes other guides.
def replace_once(path, old, new):
    p=Path(path); source=p.read_text()
    if source.count(old)!=1: raise RuntimeError(f'{path}: expected exactly one original block')
    p.write_text(source.replace(old,new,1))

p=Path('src/App.tsx'); source=p.read_text()
start=source.index('function StyleAgentLinks(')
end=source.index('\nfunction StyleGuidePage(',start)
source=source[:start]+'''function StyleAgentLinks({ guide }: { guide: StyleGuideEntry }): ReactNode {
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const markdownUrl: string = `${resourceOrigin}${guide.route}.md`;

  async function copyAgentLink(): Promise<void> {
    try {
      if (!navigator.clipboard) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(markdownUrl);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("failed");
    }
  }

  return (
    <span className="style-agent-inline">
      <button type="button" onClick={copyAgentLink}>
        {copyStatus === "copied" ? "Agent link copied" : "Copy for agent"}
      </button>
      <span className="sr-only" role="status">
        {copyStatus === "copied" ? "Style guide address copied." : ""}
      </span>
      {copyStatus === "failed" && (
        <span className="style-agent-fallback" role="status">
          <label htmlFor="style-agent-address">Copy unavailable. Select this address:</label>
          <input id="style-agent-address" readOnly value={markdownUrl} />
        </span>
      )}
    </span>
  );
}
''' +source[end:]
old='''            <span className="style-status">
              {guide.status === "in-progress"
                ? "In progress"
                : guide.status.replaceAll("-", " ")}
            </span>'''
new='''            {guide.status === "in-progress" && (
              <span className="style-status">In progress</span>
            )}'''
assert source.count(old)==1;source=source.replace(old,new)
old='''        <span className="style-status">
          {guide.status === "in-progress"
            ? "In progress"
            : guide.status.replaceAll("-", " ")}
        </span>
        <span>Updated {guide.updated}</span>'''
new='''        {guide.status === "in-progress" && (
          <span className="style-status">In progress</span>
        )}
        <span>Version {guide.version}</span>
        <span>Updated {guide.updated}</span>'''
assert source.count(old)==1;source=source.replace(old,new);p.write_text(source)

p=Path('src/index.css');p.write_text(p.read_text()+'''\n/* Only shown when the small agent-copy control cannot access the clipboard. */
.style-agent-inline { flex-wrap: wrap; }
.style-agent-fallback { display: grid; gap: 6px; flex-basis: 100%; min-width: 0; }
.style-agent-fallback input { box-sizing: border-box; width: 100%; min-width: 0; padding: 6px; color: var(--text); background: var(--surface); border: 1px solid var(--line); font: inherit; }
''')

replace_once('scripts/content.ts','''        id: "style-guides",
        status: "in-progress",''','''        id: "style-guides",
        status: data.styles.guides.some((guide) => guide.status === "in-progress") ? "in-progress" : "stable",''')
replace_once('scripts/build.ts','''import { buildWorkbench } from "./workbench";''','''import { buildWorkbench } from "./workbench";
import { jsonResourceReferences, markdownResourceReferences } from "./style-guide-links";''')
p=Path('scripts/build.ts');s=p.read_text();start=s.index('    : file.endsWith(".json")\n',s.index('  const references = '));end=s.index('\n  for (const reference of references)',start)
s=s[:start]+'''    : file.endsWith(".json")
      ? jsonResourceReferences(text)
      : file.endsWith(".txt")
        ? hostedUrls(text)
        : markdownResourceReferences(text);'''+s[end:];p.write_text(s)
replace_once('scripts/verify-deployment.ts','''if (!styleHtml.includes("TypeScript") || !styleHtml.includes("Agent access") || !styleHtml.includes("In progress")) {
  throw new Error("The TypeScript style guide page is incomplete.");
}''','''const visibleStyleHtml = styleHtml.replace(/<script\\b[^>]*>[\\s\\S]*?<\\/script>/gi, "");
if (!visibleStyleHtml.includes("TypeScript") || !visibleStyleHtml.includes("Copy for agent") || !visibleStyleHtml.includes("style-guide-prose")) {
  throw new Error("The TypeScript style guide page is incomplete.");
}''')
p=Path('package.json');j=json.loads(p.read_text());j['devDependencies']['prettier']='3.6.2'
j['scripts']['format:style']='node scripts/style-guide-check.mjs --write'
j['scripts']['check:style']='node scripts/style-guide-check.mjs && tsx --test scripts/style-guide-links.test.ts'
j['scripts']['verify:style']='node scripts/style-guide-surfaces.mjs'
j['scripts']['check']='tsx scripts/prepare-startup.ts --check && npm run typecheck && npm run check:style && npm run test:workbench && npm run test:startup && npm run build && npm run verify:style'
p.write_text(json.dumps(j,indent=2)+'\n')
