import type { SkillEntry } from "./App";

export const skillsPackage = "@uppercut-labs/skills";
export const skillsPackageUrl = `https://www.npmjs.com/package/${skillsPackage}`;
export const skillsInstallDescription = `${skillsPackage} is the premier and primary way to get Uppercut Labs agent skills. Pick a skill and the installer brings along its required skill dependencies. Requires Node.js 22 or newer.`;
export const skillHosts = ["codex", "claude", "cursor", "antigravity", "grokbot", "grokcli"] as const;
export type SkillHost = (typeof skillHosts)[number];

export function skillInstallation(entry?: SkillEntry, host: SkillHost = "codex") {
  if (entry?.package) {
    if (!entry.package.name) throw new Error(`No published package for ${entry.id}`);
    return {
      package: entry.package.name,
      description: `${skillsPackage} is the primary way to get the collection's skills. ${entry.title} currently ships separately inside ${entry.package.name}, so use its package command below.`,
      command: `npm install --save-dev ${entry.package.name}`,
      prompt: `Help me install and use ${entry.title} in this project. It currently ships inside ${entry.package.name}, separately from ${skillsPackage}. Run npm install --save-dev ${entry.package.name} in the project folder, then read node_modules/${entry.package.name}/${entry.package.skillPath}. Follow the skill's setup instructions and report any installation failure.`,
    };
  }
  return {
    package: skillsPackage,
    description: skillsInstallDescription,
    command: entry
      ? `npx ${skillsPackage} add ${entry.id} --host ${host} --project .`
      : `npx ${skillsPackage} list`,
    prompt: entry
      ? `Install the ${entry.title} skill (${entry.id}) for this project using ${skillsPackage}, the primary Uppercut Labs skills installer. Identify my agent host and project folder, then run npx ${skillsPackage} add ${entry.id} --host <host> --project <project-folder> with the actual values. Supported hosts: ${skillHosts.join(", ")}. Keep required skill dependencies enabled. Read the installed skill and help me use it for my next task. Report any installation failure or existing-file conflict.`
      : `Help me choose and install an Uppercut Labs agent skill using ${skillsPackage}, the premier and primary way to get these skills. Run npx ${skillsPackage} list, match a skill to my next task, and identify my agent host and project folder. Then run npx ${skillsPackage} add <skillname> --host <host> --project <project-folder> with the actual values. Supported hosts: ${skillHosts.join(", ")}. Keep required skill dependencies enabled. Read the installed skill and help me use it. Report any installation failure or existing-file conflict. Cappy currently ships separately inside @uppercut-labs/cappy.`,
  };
}

export function skillInstallationMarkdown(entry?: SkillEntry) {
  const installation = skillInstallation(entry);
  return `## Get ${entry?.title ?? "the skills"}\n\n${installation.description}\n\n\`\`\`sh\n${installation.command}\n\`\`\`\n\n${entry && !entry.package ? "Run in your project folder. This command selects Codex; replace codex with your host: " + skillHosts.join(", ") + ".\n\n" : ""}Copy this prompt to your agent:\n\n\`\`\`text\n${installation.prompt}\n\`\`\`\n\n[npm package](${skillsPackageUrl})\n`;
}
