import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import manifest from "../public/setup/computer-setup.manifest.json";
import setupExample from "../public/setup/state.example.json";
import registrySource from "../content/workbench-steps.json";
import { parseRegistry, phaseIds, projectCatalog } from "../src/workbench/registry";
import { phaseGate, record, type Progress } from "../src/workbench/model";

// These checks read contracts and synthetic state only; no setup commands are executed.
const registry = parseRegistry(registrySource);
const catalog = projectCatalog(registry, phaseIds.map(id => ({
  id, title: id, url: `https://starter.devthomas.site/phases/${id.slice(-1)}`, preview: id === "phase-3",
})));
const [ide, windows, macos, remote, transfer, authentication, serve, troubleshooting, skill] = await Promise.all([
  "public/setup/ide.md", "public/setup/windows.md", "public/setup/macos.md",
  "public/setup/remote-access.md", "public/setup/file-transfer.md", "public/setup/authentication.md",
  "public/setup/private-workbench.md", "public/setup/tool-troubleshooting.md",
  "public/skills/computer-setup/current/SKILL.md",
].map(file => readFile(file, "utf8")));

function capability(id: string) {
  const result = manifest.required_capabilities.find(item => item.id === id);
  assert.ok(result, `Required setup capability ${id} exists`);
  return result;
}

function section(document: string, heading: string) {
  const marker = `## ${heading}\n`;
  const normalized = document.replace(/\r\n/g, "\n");
  const start = normalized.indexOf(marker);
  assert.notEqual(start, -1, `Focused guidance section exists: ${heading}`);
  const end = normalized.indexOf("\n## ", start + marker.length);
  return normalized.slice(start + marker.length, end === -1 ? undefined : end);
}

function completePhaseTwo(): Progress {
  return {
    schema_version: 1, starter_pack_version: registry.version, updated_at: "2026-09-10T12:00:00Z",
    phase: { current: "phase-2", status: "in_progress" },
    steps: Object.fromEntries(Object.entries(registry.steps)
      .filter(([, step]) => step.gate_for.includes("phase-2") && !step.completion)
      .map(([id]) => [id, { status: "completed" }])),
  };
}

function assertPrivateServeExamples(document: string) {
  const blocks = [...document.matchAll(/```(?:text|bash|powershell|sh)\r?\n([\s\S]*?)```/g)];
  assert.ok(blocks.length >= 2, "The guide provides listener and Serve command examples");
  for (const line of blocks.flatMap(([, body]) => body.trim().split(/\r?\n/))) {
    if (line.startsWith("python ")) {
      assert.match(line, /^python -m http\.server \d+ --bind 127\.0\.0\.1 --directory "ABS_SNAPSHOT_DIRECTORY"$/,
        "The example listener serves only the isolated snapshot on loopback");
    } else {
      assert.match(line, /^tailscale serve --https=\d+ http:\/\/127\.0\.0\.1:\d+$/,
        "The default example is a foreground private proxy, not Funnel or reset");
    }
  }
}

test("setup evidence mappings use canonical leaf IDs and a registry-derived network summary", () => {
  assert.equal(manifest.requirements_revision, registry.requirements_revision);
  for (const id of Object.keys(manifest.progress_mapping)) {
    assert.ok(Object.hasOwn(registry.steps, id), `Mapped progress ID is registered: ${id}`);
  }
  for (const id of ["cli-contexts", "tailscale-computer", "tailscale-phone", "private-network-identity"]) {
    capability(id);
    assert.equal(registry.steps[id].completion, undefined, `${id} remains a leaf`);
  }
  assert.equal(manifest.required_capabilities.some(item => item.id === "tailscale-desktop"), false);
  assert.deepEqual(capability("tailscale-computer").legacy_capability_ids, ["tailscale-desktop"]);
  assert.match(manifest.progress_mapping["tailscale-network"], /derived from registry\.steps\.tailscale-network\.completion/);
  assert.match(capability("tailscale-network").verification ?? "", /derived from registry/);
  assert.equal(registry.steps["tailscale-network"].allow_recorded_completion, undefined);
});

test("the required editor follows the computer harness while preserving its primary agent surface", () => {
  assert.equal(manifest.ide.required, true);
  assert.equal(manifest.ide.select_from, "development_harness_not_phone_companion");
  assert.deepEqual(manifest.ide.harness_to_ide, { antigravity: "antigravity", cursor: "cursor" });
  assert.equal(manifest.ide.default, "vscode");
  for (const route of ["codex", "claude-code"]) assert.ok(manifest.ide.default_includes.includes(route));
  capability("selected-agentic-harness");
  capability("selected-ide");
  assert.equal(manifest.ide.preserve_settings, true);
  assert.ok(manifest.ide.verification.includes("markdown_displays"));
  assert.ok(manifest.ide.verification.includes("integrated_terminal_resolves_applicable_baseline_tools"));
  assert.match(ide, /agent application and Antigravity IDE separately/);
  assert.match(ide, /does not require an editing lesson or moving your agent into an extension/);
});

test("every relevant CLI has ordinary-resolution checks in four real launch contexts", () => {
  for (const context of ["current_shell", "new_terminal", "ide_terminal", "harness_subprocess"]) {
    assert.ok(manifest.cli_verification.contexts.includes(context), context);
  }
  assert.ok(manifest.cli_verification.contexts.includes("alternate_shell_or_wsl_if_selected"));
  assert.equal(manifest.cli_verification.use_ordinary_resolution, true);
  assert.match(manifest.cli_verification.applies_to, /later_selected/);
  assert.match(manifest.progress_mapping["cli-contexts"], /capabilities\.\*\.contexts/);
  assert.match(manifest.cli_verification.project_local_tools, /never_add_project_node_modules_bin_to_global_PATH/);
  assert.deepEqual([...manifest.cli_verification.outcomes].sort(), ["failed", "not_applicable", "not_tested", "passed"]);
  for (const field of ["scope", "install_source", "architecture", "resolved_path", "verified_at", "contexts"]) {
    assert.ok(manifest.cli_verification.record.includes(field), field);
  }
});

test("the per-tool example leaves untested contexts unknown rather than copying successful evidence", () => {
  const example = troubleshooting.match(/```json\s*([\s\S]*?)\s*```/);
  assert.ok(example, "Per-tool evidence example exists");
  const value: unknown = JSON.parse(example[1]);
  assert.ok(record(value) && record(value.contexts));
  const contexts: Record<string, unknown> = value.contexts;
  for (const context of ["current_shell", "new_terminal", "ide_terminal", "harness_subprocess"]) {
    const check: unknown = contexts[context];
    assert.ok(record(check));
    assert.equal(check.status, "not_tested", context);
    assert.equal(typeof check.reason, "string", context);
  }
  assert.equal(value.verified_at, null);
  assert.equal(value.resolved_path, null);
});

test("Windows and macOS guidance distinguish persistent PATH from the actual parent process", () => {
  const windowsPath = section(windows, "PATH: persistence and process inheritance");
  assert.match(windowsPath, /fresh parent and subprocess/);
  assert.match(windowsPath, /Preserve existing entries, order, registry value type/);
  assert.match(windowsPath, /Native Windows and WSL are different environments/);
  const macPath = section(macos, "PATH across shells and GUI-launched tasks");
  assert.match(macPath, /ZDOTDIR/);
  assert.match(macPath, /GUI app may inherit an environment without reading these files/);
  assert.match(macPath, /Do not symlink all startup files together/);
  assert.match(macPath, /shadows `env`/);
});

test("Python is required up front and named package-manager ceremony is not a gate", () => {
  capability("uv");
  assert.match(capability("python").provisioned_or_discovered_by ?? "", /reuse_healthy_existing_interpreter/);
  assert.equal(manifest.workbench.serve_when, "python_interpreter_verified");
  assert.equal(manifest.policies.package_manager_is_not_a_gate_when_supported_direct_tools_suffice, true);
  assert.equal(manifest.policies.compare_supported_binary_and_package_manager_routes, true);
  assert.equal(manifest.policies.avoid_source_build_when_supported_binary_exists, true);
  for (const id of ["homebrew", "system-package-manager", "winget"]) {
    assert.equal(manifest.required_capabilities.some(item => item.id === id), false, id);
  }
  assert.match(macos, /Do not install it only to pass `brew --version`/);
  assert.ok(manifest.platforms.windows.extra_required.includes("powershell-7"));
});

test("network devices, both transfer directions and actual harness control map to distinct unknown records", () => {
  const mappings = [
    ["tailscale-computer", "tailscale_computer"], ["tailscale-phone", "tailscale_phone"],
    ["private-network-identity", "device_identity"], ["phone-to-computer-file", "phone_to_computer_file"],
    ["computer-to-phone-file", "computer_to_phone_file"], ["verified-phone-connection", "phone_harness_interaction"],
  ] as const;
  assert.equal(new Set(mappings.map(([, key]) => key)).size, 6);
  assert.deepEqual(Object.keys(setupExample.remote_access.checks).sort(), mappings.map(([, key]) => key).sort());
  for (const [id, key] of mappings) {
    assert.equal(manifest.progress_mapping[id], `remote_access.checks.${key}`);
    const check = setupExample.remote_access.checks[key];
    assert.equal(check.status, "not_tested", id);
    assert.equal(check.verified_at, null, id);
    assert.equal(check.evidence, null, id);
  }
  const receipt = section(transfer, "Check each direction once");
  assert.match(receipt, /(?:preserve|retain) the first direction's success/i);
  assert.match(receipt, /actual destination behavior/);
  assert.match(remote, /not merely a chatbot, unrelated cloud machine or empty remote desktop/);
});

test("synthetic network summary and legacy remote flag cannot replace any device or identity check", () => {
  assert.equal(phaseGate(completePhaseTwo(), catalog)?.complete, true, "Synthetic baseline is complete");
  for (const missing of ["tailscale-computer", "tailscale-phone", "private-network-identity"]) {
    const progress = completePhaseTwo();
    delete progress.steps[missing];
    progress.steps["tailscale-network"] = { status: "completed" };
    progress.environment = { remote_access_ready: true };
    assert.equal(phaseGate(progress, catalog)?.complete, false, missing);
    assert.ok(phaseGate(progress, catalog)?.missing.includes("phase-2-remote-baseline"), missing);
  }
});

test("synthetic one-way transfer or native phone control cannot complete the other remote outcomes", () => {
  for (const missing of ["phone-to-computer-file", "computer-to-phone-file", "verified-phone-connection"]) {
    const progress = completePhaseTwo();
    progress.steps[missing] = { status: "deferred" };
    const before = JSON.stringify(progress);
    assert.equal(phaseGate(progress, catalog)?.complete, false, missing);
    assert.equal(JSON.stringify(progress), before, "Checking does not erase other successes");
  }
});

test("a synthetic tool-install pass cannot bypass missing execution-context evidence", () => {
  const progress = completePhaseTwo();
  progress.steps["cli-contexts"] = { status: "in_progress", next_action: "Verify the actual harness subprocess." };
  progress.steps["computer-setup"] = { status: "completed" };
  assert.equal(progress.steps["system-cli-baseline"].status, "completed");
  const gate = phaseGate(progress, catalog);
  assert.equal(gate?.complete, false);
  assert.ok(gate?.missing.includes("computer-setup"));
});

test("email preferences, the viewer and optional private access never become phase gates", () => {
  assert.equal(manifest.development_email.phase_gate, false);
  assert.equal(manifest.workbench.phase_gate, false);
  assert.equal(setupExample.remote_access.private_workbench.selected, false);
  assert.equal(setupExample.remote_access.private_workbench.persistent, false);
  for (const id of ["development-email", "progress-workbench"]) assert.deepEqual(registry.steps[id].gate_for, []);
  assert.equal(phaseGate(completePhaseTwo(), catalog)?.complete, true);
});

test("private Workbench guidance uses an explicit projection and isolated regular-file allowlist", () => {
  assert.equal(manifest.workbench.bind, "127.0.0.1");
  assert.equal(manifest.workbench.remote_share_boundary, "isolated_allowlisted_snapshot_with_approved_progress_projection");
  const boundary = section(serve, "Build a separate allowlisted snapshot");
  assert.match(boundary, /Never proxy the normal Python viewer serving the private progress repository/);
  assert.match(boundary, /explicit field allowlist, not a blacklist or recursive copy/);
  assert.match(boundary, /Never merge it back into real progress/);
  assert.match(boundary, /no symlinks, junctions, reparse points/);
  assertPrivateServeExamples(serve);
});

test("Serve command guards reject public tunnels, reset-all and broad listener roots", () => {
  for (const command of [
    "tailscale funnel --https=8443 http://127.0.0.1:8011", "tailscale serve reset", "tailscale down",
    'python -m http.server 8011 --bind 0.0.0.0 --directory "ABS_SNAPSHOT_DIRECTORY"',
    'python -m http.server 8011 --bind 127.0.0.1 --directory "ABS_PROGRESS_FOLDER"',
  ]) {
    assert.throws(() => assertPrivateServeExamples(`${serve}\n\`\`\`text\n${command}\n\`\`\`\n`), command);
  }
  const endpoint = section(serve, "Configure only the approved Serve endpoint");
  assert.match(endpoint, /Do not add `--bg` without intentional approval/);
  assert.match(endpoint, /Never use reset-all/);
  assert.match(endpoint, /Stop only this snapshot listener, not unrelated processes/);
});

test("private Serve acceptance requires denied paths and effective audience evidence", () => {
  const audience = section(serve, "Approve the content, audience and lifecycle");
  assert.match(audience, /adding a narrow grant does not cancel broader access/);
  const checks = section(serve, "Verify before calling it ready");
  for (const probe of ["/.git/config", "/.env", "/setup/computer.json", "/reports/check.md", "/%2e%2e/outside-probe.txt"]) {
    assert.ok(checks.includes(probe), `Denied path probe: ${probe}`);
  }
  assert.match(checks, /unapproved identity\/device cannot reach/);
  assert.match(checks, /Existing unrelated Serve\/Funnel routes still behave as before/);
  assert.match(checks, /If audience verification is unavailable, do not claim owner-only readiness/);
});

test("provider auth and Git privacy guidance preserve account safeguards and private-save evidence", () => {
  const privacy = section(authentication, "Git privacy before the first useful push");
  assert.match(privacy, /git config --local user.email/);
  assert.match(privacy, /Preserve global identity/);
  assert.match(privacy, /Keep GitHub's email-privacy protection enabled/);
  assert.match(privacy, /Never rewrite shared history/);
  assert.match(privacy, /Verify the remote revision and saved files, then recheck private visibility/);
  assert.match(authentication, /phone's localhost points to the phone/);
  assert.equal(setupExample.private_save.private_visibility_verified, false);
  assert.equal(setupExample.private_save.remote_files_verified, false);
});

test("conditional pnpm and module guidance keeps approvals named and resolution runtime-specific", () => {
  const pnpm = section(troubleshooting, "pnpm: a dependency build was blocked");
  assert.match(pnpm, /Keep its lockfile and pinned package-manager version/);
  assert.match(pnpm, /pnpm approve-builds esbuild/);
  assert.match(pnpm, /Never approve all packages/);
  assert.doesNotMatch(pnpm, /approve-builds\s+--all/);
  assert.match(pnpm, /Do not paste a newer setting into an older tool/);
  const modules = section(troubleshooting, "Node and TypeScript: module mismatch");
  assert.match(modules, /First identify who executes the failing file/);
  assert.match(modules, /NodeNext is not a universal repair/);
  assert.match(modules, /Validate both the repaired helper and unchanged app/);
});

test("Docker remains optional and last with licensing and conditional Rosetta checks", () => {
  const containers = manifest.optional_packs.containers;
  assert.deepEqual(containers.tools, ["docker-desktop"]);
  assert.equal(containers.phase_gate, false);
  assert.equal(containers.install_order, "last");
  assert.equal(containers.verify_current_license_and_host_suitability, true);
  assert.ok(containers.excluded.includes("orbstack"));
  assert.match(containers.rosetta, /only_if_actual_architecture.*with_approval/);
  assert.equal(manifest.required_capabilities.some(item => item.id === "docker-desktop"), false);
  const docker = section(troubleshooting, "Docker Desktop and Rosetta: only when selected");
  assert.match(docker, /never promise it is universally free for commercial use/);
  assert.match(docker, /Do not copy a dated error as a mandatory Rosetta step/);
  assert.match(docker, /Do not remove existing images, containers or volumes/);
});

test("setup stages skills before use without claiming copied context is a native installation", async () => {
  assert.match(skill, /native_discovered.*context_only.*not_tested/);
  assert.match(skill, /Stage the current \[Quick Build skill\]/);
  assert.match(skill, /before their first use/);
  assert.match(skill, /25-skill bundle, orchestration and Phase 3 are not setup requirements/);
  assert.equal(skill, await readFile(`public/skills/computer-setup/${manifest.skill_version}/SKILL.md`, "utf8"));
});
