#!/usr/bin/env node
// Checks every `evnx ...` invocation in the skills against the real CLI:
// each command path must exist in `evnx commands --json`, and each flag must
// be one that command has (a removed spelling is reported with its
// replacement).
//
//   node scripts/check-invocations.mjs          check, exit 1 on a problem
//   node scripts/check-invocations.mjs --list   print every invocation found
//
// The binary is EVNX_BIN, or `evnx` on PATH. Node built-ins only. The idea
// follows evnx-web's scripts/check-cli-invocations.mjs.
//
// What is read: fenced code blocks tagged bash/sh/shell/console/zsh (or with
// no tag), `run:` / `entry:` / `- evnx` lines and `run: |` bodies in yaml blocks, and inline code
// spans that start with `evnx `. Prose is not read. Placeholders (`<x>`,
// `$X`, `...`) are skipped rather than guessed, and everything after a bare
// `--` belongs to the child command. A wrong word in prose, or inside a
// `text` block, is therefore not caught.

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { ROOT, findBinary, readSurface } from "./lib/evnx.mjs";

const listOnly = process.argv.includes("--list");

// Invocations written on purpose although they do not resolve, with why.
// Keep this empty unless a skill must show a wrong spelling.
const ACCEPTED = new Map([
  // ["skills/evnx-cli/SKILL.md::evnx example --old", "shows the removed spelling"],
]);

const SHELL = new Set(["", "bash", "sh", "shell", "console", "zsh"]);
const YAML = new Set(["yaml", "yml"]);
const ALWAYS = new Set(["--help", "-h", "--version", "-V"]);

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir).sort()) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (name.endsWith(".md")) out.push(p);
  }
  return out;
}

function isPlaceholder(t) {
  return /^[<$\[{]/.test(t) || t.includes("…") || t.includes("...") || /^[A-Z][A-Z0-9_]*$/.test(t);
}

/** Commands in a shell snippet: comments stripped, continuations joined, split on ; && || | $( */
function commandsIn(block) {
  const joined = block.replace(/\\\n/g, " ");
  const out = [];
  for (let line of joined.split("\n")) {
    line = line.replace(/^\s*\$\s+/, "");
    const hash = line.search(/(^|\s)#/);
    if (hash !== -1) line = line.slice(0, hash);
    for (let part of line.split(/&&|\|\||;|\||\$\(|`/)) {
      part = part.trim().replace(/^(?:[A-Z_][A-Z0-9_]*=("[^"]*"|'[^']*'|\S*)\s+)+/, "");
      if (/^evnx(\s|$)/.test(part)) out.push(part);
    }
  }
  return out;
}

function yamlCommands(block) {
  const out = [];
  for (const line of block.split("\n")) {
    // `run: evnx ...`, `entry: evnx ...`, `- evnx ...`, and lines of a `run: |` block.
    const m =
      line.match(/^\s*(?:-\s+)?(?:run|entry):\s*(.*)$/) ||
      line.match(/^\s*-\s+(evnx\s.*)$/) ||
      line.match(/^\s*(evnx\s.*)$/);
    if (m) out.push(...commandsIn(m[1].replace(/^["']|["']$/g, "")));
  }
  return out;
}

const bin = (() => {
  try {
    return findBinary();
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
})();
let surface;
try {
  surface = readSurface(bin);
} catch (e) {
  console.error(e.message);
  process.exit(1);
}

// Index: path -> command; alias paths -> canonical path.
const byPath = new Map();
const canonical = new Map();
for (const c of surface.commands) {
  const p = c.path.join(" ");
  byPath.set(p, c);
  canonical.set(p, p);
  for (const a of [...(c.visible_aliases || []), ...(c.aliases || [])]) {
    canonical.set([...c.path.slice(0, -1), a].join(" "), p);
  }
}
const subsOf = new Map();
for (const [alias, p] of canonical) {
  const parts = alias.split(" ");
  if (parts.length < 2) continue;
  const parent = canonical.get(parts.slice(0, -1).join(" ")) || parts.slice(0, -1).join(" ");
  if (!subsOf.has(parent)) subsOf.set(parent, new Set());
  subsOf.get(parent).add(parts[parts.length - 1]);
}

const seen = [];
const problems = [];

function check(text, file) {
  const toks = text
    .split(/\s+/)
    .map((t) => t.replace(/[)"'`,]+$/, "").replace(/^["'(]+/, ""))
    .filter(Boolean);
  const dd = toks.indexOf("--");
  if (dd !== -1) toks.length = dd;
  seen.push({ file, text });

  const bad = (why) => {
    const k = `${file}::${text}`;
    if (!ACCEPTED.has(k)) problems.push({ file, text, why });
  };

  // Walk the command path as deep as the tree goes.
  let path = "";
  let i = 1;
  const flagsSeenBeforePath = [];
  while (i < toks.length) {
    const t = toks[i];
    if (t.startsWith("-")) {
      if (path === "") flagsSeenBeforePath.push(t);
      i++;
      // a flag value is never a subcommand name, but we cannot tell values apart
      // from words here, so the walk only continues on known subcommand names.
      continue;
    }
    if (isPlaceholder(t)) break;
    if (path === "") {
      if (!/^[a-z][a-z0-9-]*$/.test(t)) return; // output such as "evnx 0.16.0", not a command
      if (!canonical.has(t)) return bad(`\`evnx ${t}\` is not a command`);
      path = canonical.get(t);
      i++;
      continue;
    }
    const subs = subsOf.get(path);
    if (!subs || !subs.size) break;
    if (subs.has(t)) {
      path = canonical.get(`${path} ${t}`);
      i++;
      continue;
    }
    if (t === "help") break;
    const cmd = byPath.get(path);
    const takesArgs = (cmd.args || []).some((a) => a.positional);
    if (takesArgs && !cmd.subcommand_required) break;
    return bad(`\`evnx ${path}\` has no \`${t}\` subcommand`);
  }
  if (path === "") {
    for (const f of flagsSeenBeforePath) {
      if (!ALWAYS.has(f.split("=")[0])) bad(`\`evnx\` has no top-level flag \`${f}\``);
    }
    return;
  }
  const cmd = byPath.get(path);
  const longs = new Set();
  const shorts = new Set();
  for (const a of cmd.args || []) {
    if (a.long) longs.add(a.long);
    if (a.short) shorts.add(a.short);
  }
  const removed = new Map((cmd.removed || []).map((r) => [r.old, r.new]));
  for (const t of toks.slice(1)) {
    if (t === "-" || !t.startsWith("-")) continue;
    if (ALWAYS.has(t)) continue;
    if (t.startsWith("--")) {
      const name = t.slice(2).split("=")[0];
      if (!name || isPlaceholder(name)) continue;
      if (!longs.has(name)) {
        const hit = [...removed.keys()].find((old) => old.split(/,\s*|\s+/).includes(`--${name}`));
        bad(
          hit
            ? `\`evnx ${path}\`: \`--${name}\` was removed; use \`${removed.get(hit)}\``
            : `\`evnx ${path}\` has no \`--${name}\` flag`,
        );
      }
    } else if (/^-[A-Za-z]+$/.test(t)) {
      for (const ch of t.slice(1)) {
        if (!shorts.has(ch) && !ALWAYS.has(`-${ch}`)) bad(`\`evnx ${path}\` has no \`-${ch}\` flag`);
      }
    }
  }
  // Removed values of a flag that still exists: `--format github-actions`.
  const words = toks.slice(1).flatMap((t) => (t.startsWith("--") && t.includes("=") ? t.split("=", 2) : [t]));
  for (const [old, now] of removed) {
    const m = old.match(/^(--[a-z0-9-]+)\s+(\S+)$/);
    if (!m) continue;
    for (let k = 0; k + 1 < words.length; k++) {
      if (words[k] === m[1] && words[k + 1] === m[2]) {
        bad(`\`evnx ${path}\`: \`${old}\` was removed; use \`${now}\``);
      }
    }
  }
}

const files = walk(join(ROOT, "skills"));
for (const file of files) {
  const rel = relative(ROOT, file);
  const text = readFileSync(file, "utf8");
  const fenced = /^[ \t]*```([A-Za-z0-9_-]*)[^\n]*\n([\s\S]*?)^[ \t]*```/gm;
  let rest = text;
  for (const m of text.matchAll(fenced)) {
    const lang = m[1].toLowerCase();
    if (SHELL.has(lang)) for (const c of commandsIn(m[2])) check(c, rel);
    else if (YAML.has(lang)) for (const c of yamlCommands(m[2])) check(c, rel);
    rest = rest.replace(m[0], "");
  }
  for (const m of rest.matchAll(/`([^`]+)`/g)) {
    const t = m[1].replace(/\s+/g, " ").trim();
    if (!/^evnx\s/.test(t)) continue;
    for (const c of commandsIn(t)) check(c, rel);
  }
}

if (listOnly) {
  const uniq = [...new Set(seen.map((s) => s.text))].sort();
  for (const u of uniq) console.log("  " + u);
  console.log(`\n${uniq.length} distinct invocations in ${files.length} files`);
  process.exit(0);
}

if (problems.length) {
  console.error(`${problems.length} invocation(s) do not resolve against ${bin} (evnx ${surface.evnx_version}):`);
  for (const p of problems) console.error(`  ${p.file}: ${p.why}\n      ${p.text}`);
  process.exit(1);
}
console.log(
  `ok: ${seen.length} evnx invocations in ${files.length} files resolve against ${bin} (evnx ${surface.evnx_version})`,
);
