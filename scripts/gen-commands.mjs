#!/usr/bin/env node
// Writes skills/evnx-cli/references/commands.md from `evnx commands --json`.
//
//   node scripts/gen-commands.mjs            write the file
//   node scripts/gen-commands.mjs --check    exit 1 if the file is out of date,
//                                            if the binary is not the pinned
//                                            version, or if a skill file's
//                                            version stamp names another version
//   node scripts/gen-commands.mjs --print-pin   print the pinned version
//
// The binary is EVNX_BIN, or `evnx` on PATH. The pin is metadata.evnx_version
// in skills/evnx-cli/SKILL.md. Node built-ins only; output is deterministic.

import { readFileSync, readdirSync, writeFileSync, existsSync } from "node:fs";
import { join, relative } from "node:path";
import { ROOT, SKILL_MD, findBinary, readSurface, readPin } from "./lib/evnx.mjs";

const OUT = join(ROOT, "skills", "evnx-cli", "references", "commands.md");
const args = process.argv.slice(2);
const checkMode = args.includes("--check");

function fail(msg) {
  console.error(msg);
  process.exit(1);
}

let pinInfo;
try {
  pinInfo = readPin();
} catch (e) {
  fail(e.message);
}
const { pin, body } = pinInfo;

if (args.includes("--print-pin")) {
  console.log(pin);
  process.exit(0);
}

let bin, surface;
try {
  bin = findBinary();
  surface = readSurface(bin);
} catch (e) {
  fail(e.message);
}
const version = surface.evnx_version;

// ─── Rendering ───────────────────────────────────────────────────────────────

const visible = surface.commands.filter((c) => !c.hidden);
const key = (c) => c.path.join(" ");

// Flags every command carries (-q, -v, --no-color): listed once, not per command.
const globalIds = (() => {
  let ids = null;
  for (const c of visible) {
    const own = new Set((c.args || []).filter((a) => !a.positional).map((a) => a.id));
    ids = ids === null ? own : new Set([...ids].filter((i) => own.has(i)));
  }
  return ids || new Set();
})();
const globalArgs = (visible[0].args || []).filter((a) => globalIds.has(a.id));

function flagName(a) {
  const long = a.long ? `--${a.long}` : null;
  const short = a.short ? `-${a.short}` : null;
  return [short, long].filter(Boolean).join("/");
}

function flagText(a) {
  let s = flagName(a);
  if (a.takes_value) {
    if (a.possible_values && a.possible_values.length) s += ` ${a.possible_values.join("|")}`;
    else if (a.value_name) s += ` <${a.value_name}>`;
  }
  return "`" + s + "`";
}

function usage(c) {
  const parts = ["evnx", ...c.path];
  const subs = visible.filter(
    (s) => s.path.length === c.path.length + 1 && key(s).startsWith(key(c) + " "),
  );
  for (const a of c.args || []) {
    if (!a.positional || a.hidden) continue;
    const name = (a.value_name || a.id).toUpperCase().replace(/[<>]/g, "");
    if (name === "COMMAND" && a.multiple) {
      // A command run by evnx: everything after `--` is its own.
      parts.push("[OPTIONS]", a.required ? "-- <COMMAND>..." : "[-- <COMMAND>...]");
      continue;
    }
    const inner = a.multiple ? `${name}...` : name;
    parts.push(a.required ? `<${inner}>` : `[${inner}]`);
  }
  if (subs.length) parts.push(c.subcommand_required ? "<SUBCOMMAND>" : "[SUBCOMMAND]");
  return parts.join(" ");
}

const exitMeaning = new Map();
for (const c of visible) {
  for (const e of c.exit_codes || []) {
    if (!exitMeaning.has(e.code)) exitMeaning.set(e.code, e);
  }
}

// Group: a top-level command's `group`; a subcommand inherits its root's.
const groupOf = new Map();
for (const c of visible) if (c.path.length === 1) groupOf.set(c.path[0], c.group || "Other");
const groups = [];
for (const c of visible) {
  const g = groupOf.get(c.path[0]) || "Other";
  if (!groups.includes(g)) groups.push(g);
}

function renderCommand(c) {
  const lines = [];
  const depth = c.path.length;
  const heading = depth === 1 ? "###" : "####";
  const aliases = (c.visible_aliases || []).length
    ? ` (alias ${c.visible_aliases.map((a) => "`" + a + "`").join(", ")})`
    : "";
  lines.push(`${heading} \`${usage(c)}\`${aliases}`, "");
  lines.push(c.about.replace(/\s+/g, " ").trim());
  lines.push("");
  const own = (c.args || []).filter((a) => !a.positional && !a.hidden && !globalIds.has(a.id));
  if (own.length) lines.push(`- Flags: ${own.map(flagText).join(", ")}`);
  const codes = (c.exit_codes || []).map((e) => e.code).filter((n) => n !== 141);
  let exits = codes.join(", ");
  if (c.child_exit_code) exits += "; then the command's own code (128+n if signal n killed it)";
  lines.push(`- Exit: ${exits}`);
  if (c.network && c.network !== "local") lines.push(`- Network: ${c.network}`);
  if ((c.removed || []).length) {
    lines.push(
      `- Removed spellings (exit 2): ${c.removed.map((r) => "`" + r.old + "` → `" + r.new + "`").join(", ")}`,
    );
  }
  if (depth === 1 && c.docs_url) lines.push(`- Docs: ${c.docs_url}`);
  lines.push("");
  return lines.join("\n");
}

function render() {
  const out = [];
  out.push("# evnx commands");
  out.push("");
  out.push(
    `**Generated from evnx ${version}** by \`scripts/gen-commands.mjs\` from \`evnx commands --json\`. ` +
      "Do not edit by hand: run the script. If the installed evnx is another version, its " +
      "`evnx <command> --help` and `evnx commands --json` win over this file.",
  );
  out.push("");
  out.push(
    `Build features: ${surface.features.map((f) => "`" + f + "`").join(", ")}. A build without ` +
      "`cloud`, `migrate` or `backup` (a plain `cargo install evnx`) lacks those commands; " +
      "`evnx commands` says what a build has. Hidden flags and commands are left out.",
  );
  out.push("");
  out.push("## On every command");
  out.push("");
  out.push(
    `${globalArgs.map(flagText).join(", ")}, \`-h/--help\`, \`-V/--version\`. ` +
      "`network`: `local` reads files only; `local-with-network` has modes that reach GitHub, " +
      "Vercel or the release list; `account` needs an evnx account and a connection.",
  );
  out.push("");
  out.push("## Exit codes");
  out.push("");
  out.push("| Code | Id | Meaning |");
  out.push("|---|---|---|");
  for (const code of [...exitMeaning.keys()].sort((a, b) => a - b)) {
    const e = exitMeaning.get(code);
    out.push(`| ${code} | \`${e.id}\` | ${e.meaning} |`);
  }
  out.push("");
  out.push(
    "Each command below lists the codes it can return (141, a closed pipe, applies to all). " +
      "`run` and `cloud run` return the command's own code once it has started.",
  );
  out.push("");
  for (const g of groups) {
    out.push(`## ${g}`);
    out.push("");
    for (const c of visible) {
      if ((groupOf.get(c.path[0]) || "Other") !== g) continue;
      out.push(renderCommand(c));
    }
  }
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd() + "\n";
}

// ─── Run ─────────────────────────────────────────────────────────────────────

const text = render();

if (!checkMode) {
  writeFileSync(OUT, text);
  console.log(`wrote ${relative(ROOT, OUT)} from ${bin} (evnx ${version})`);
  if (version !== pin) {
    console.log(`note: the binary is ${version} but SKILL.md pins ${pin}; --check will fail`);
  }
  process.exit(0);
}

const problems = [];
if (version !== pin) {
  problems.push(
    `the binary is evnx ${version}, but skills/evnx-cli/SKILL.md pins ${pin} (metadata.evnx_version)`,
  );
}
if (!new RegExp(`evnx ${pin.replace(/\./g, "\\.")}\\b`).test(body)) {
  problems.push(`the body of skills/evnx-cli/SKILL.md does not name evnx ${pin}`);
}
const current = existsSync(OUT) ? readFileSync(OUT, "utf8") : "";
if (current !== text) {
  problems.push(`${relative(ROOT, OUT)} is out of date: run node scripts/gen-commands.mjs`);
}
// Every hand-written reference of evnx-cli carries a version stamp in its first lines.
const refDir = join(ROOT, "skills", "evnx-cli", "references");
for (const f of readdirSync(refDir).filter((n) => n.endsWith(".md")).sort()) {
  const head = readFileSync(join(refDir, f), "utf8").split("\n").slice(0, 6).join("\n");
  const m = head.match(/evnx (\d+\.\d+\.\d+)/);
  if (!m) problems.push(`skills/evnx-cli/references/${f}: no "evnx X.Y.Z" stamp in its first lines`);
  else if (m[1] !== pin) {
    problems.push(`skills/evnx-cli/references/${f}: stamped evnx ${m[1]}, the pin is ${pin}`);
  }
}

if (problems.length) {
  console.error(`gen-commands --check failed (${relative(ROOT, SKILL_MD)} pins ${pin}):`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
console.log(`ok: commands.md matches evnx ${version} (${bin}), and every stamp names ${pin}`);
