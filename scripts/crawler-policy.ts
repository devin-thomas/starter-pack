// Google-Extended covers both training and grounding. Limit permission to public curriculum.
export const googleResourcePaths = ["/agent/", "/skills/", "/phases/", "/artifacts/", "/setup/", "/prompts/", "/schemas/", "/help/", "/recommendations.json", "/guide.md", "/about.md", "/llms.txt"];
export const googleResourcePolicy = `User-agent: Google-Extended\n${googleResourcePaths.map(path => `Allow: ${path}`).join("\n")}\n`;

export function assertGoogleResourceAccess(robots: string) {
  const groups: { agents: string[]; rules: { allow: boolean; path: string }[] }[] = [];
  let group: typeof groups[number] | undefined;
  for (const raw of robots.split(/\r?\n/)) {
    const line = raw.split("#")[0].trim();
    const match = line.match(/^(user-agent|allow|disallow)\s*:\s*(.*)$/i);
    if (!match) continue;
    const [, key, value] = match;
    if (key.toLowerCase() === "user-agent") {
      if (!group || group.rules.length) { group = { agents: [], rules: [] }; groups.push(group); }
      group.agents.push(value.toLowerCase());
    } else if (group && value) group.rules.push({ allow: key.toLowerCase() === "allow", path: value });
  }
  const exact = groups.filter(group => group.agents.includes("google-extended"));
  const rules = (exact.length ? exact : groups.filter(group => group.agents.includes("*"))).flatMap(group => group.rules);
  for (const path of [...googleResourcePaths, "/agent/start.md", "/agent/catalog.json", "/agent/phase-1-packet.txt", "/prompts/get-started.txt", "/skills/starter-pack/current/SKILL.md", "/phases/1.md", "/artifacts/progress/README.md", "/artifacts/progress/starter-progress.json", "/schemas/starter-progress.schema.json"]) {
    // Our policy is literal. Reject unknown pattern rules for manual review instead of guessing.
    if (rules.some(rule => /[*$]/.test(rule.path))) throw new Error("Review Google-Extended wildcard policy before declaring learner resources reachable.");
    const matched = rules.filter(rule => path.startsWith(rule.path)).sort((a,b) => b.path.length - a.path.length || Number(b.allow) - Number(a.allow));
    if (matched[0] && !matched[0].allow) throw new Error(`Google-Extended is blocked from ${path} by live robots.txt`);
  }
}
