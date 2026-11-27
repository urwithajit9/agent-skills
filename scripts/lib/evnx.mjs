// Shared helpers for the two checks in scripts/: find the evnx binary, read
// its command surface (`evnx commands --json`), and read the version the
// evnx-cli skill is pinned to. Node built-ins only.

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { delimiter, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const SKILL_MD = join(ROOT, "skills", "evnx-cli", "SKILL.md");

/** The binary to read: EVNX_BIN if set (it must exist), else `evnx` on PATH. */
export function findBinary() {
  const fromEnv = process.env.EVNX_BIN;
  if (fromEnv) {
    if (!existsSync(fromEnv)) {
      throw new Error(`EVNX_BIN is set to ${fromEnv}, which does not exist`);
    }
    return fromEnv;
  }
  const exts = process.platform === "win32" ? [".exe", ".cmd", ""] : [""];
  for (const dir of (process.env.PATH || "").split(delimiter)) {
    if (!dir) continue;
    for (const ext of exts) {
      const p = join(dir, "evnx" + ext);
      if (existsSync(p)) return p;
    }
  }
  throw new Error("no evnx binary: set EVNX_BIN to its path, or put evnx on PATH");
}

/**
 * The parsed `evnx commands --json`. Refuses a build without the optional
 * features: such a build lacks the cloud, migrate and backup commands, and
 * every check against it would be wrong about them.
 */
export function readSurface(bin) {
  const raw = execFileSync(bin, ["commands", "--json"], {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    stdio: ["ignore", "pipe", "pipe"],
  });
  const data = JSON.parse(raw);
  if (data.schema !== 1) {
    throw new Error(`evnx commands --json has schema ${data.schema}; these scripts read schema 1`);
  }
  const need = ["backup", "cloud", "migrate", "net"];
  const missing = need.filter((f) => !(data.features || []).includes(f));
  if (missing.length) {
    throw new Error(
      `${bin} was built without ${missing.join(", ")}; use a release binary or ` +
        "`cargo install evnx --all-features` so every command is present",
    );
  }
  if (!Array.isArray(data.commands) || data.commands.length < 20) {
    throw new Error(`evnx commands --json lists ${data.commands?.length ?? 0} commands`);
  }
  return data;
}

/** `metadata.evnx_version` from the evnx-cli SKILL.md frontmatter. */
export function readPin() {
  const text = readFileSync(SKILL_MD, "utf8");
  const fm = text.match(/^---\n([\s\S]*?)\n---\n/);
  if (!fm) throw new Error(`${SKILL_MD} has no frontmatter`);
  const m = fm[1].match(/^\s+evnx_version:\s*["']?([0-9]+\.[0-9]+\.[0-9]+)["']?\s*$/m);
  if (!m) throw new Error(`${SKILL_MD}: no metadata.evnx_version in the frontmatter`);
  return { pin: m[1], body: text.slice(fm[0].length) };
}
