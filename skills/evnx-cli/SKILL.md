---
name: evnx-cli
description: >
  Use when working with the evnx CLI to manage .env files. Triggers on tasks like:
  "validate my .env", "scan for secrets", "diff .env and .env.example", "convert .env to
  JSON / YAML / Kubernetes / Docker / GitHub Actions / AWS / GCP / Terraform", "sync .env with
  .env.example", "add or remove an environment variable", "migrate secrets to a secret manager",
  "encrypt or restore a .env backup", "run a command with my .env", "scan staged changes",
  "install a secret-scanning pre-commit hook", "set up evnx in CI/CD", "evnx doctor",
  "evnx cloud / vault", or any mention of evnx. Also use when evnx is installed and the user
  wants to validate, scan, convert, diff, sync, migrate, back up, or restore .env files.
license: MIT
metadata:
  author: urwithajit9
  version: "2.0.0"
  homepage: https://docs.evnx.dev
  repository: https://github.com/urwithajit9/agent-skills
---

# evnx CLI

evnx manages `.env` files: create and edit them, validate them against a template, scan for
secrets, diff and sync environments, convert to deployment formats, migrate into secret
managers, back up, and sync through an encrypted cloud.

This skill holds the stable rules and the workflow. Flag lists and format lists change between
releases, so they live in [references/](references/) and in the binary itself.

## Before you act: check the version

Run this first, once per session, before any other evnx command:

```bash
evnx --version
```

- **The installed binary is the source of truth, not this skill.** For any command you are about
  to use, run `evnx <command> --help` and use the flags it lists. For the whole surface at once
  (commands, flags, compiled-in features, docs URLs) run `evnx commands --json`.
- **Compare the version with the "Version notes" table below.** If a behaviour you rely on is
  marked "since vX.Y.Z" and the installed version is older, do not assume it. Tell the user
  what is missing and either use the older behaviour or suggest an upgrade.
- **To upgrade:** `evnx update` prints the right upgrade command for how evnx was installed
  (it changes nothing). `evnx update --check` asks GitHub whether a newer release exists
  (exit 0 current, 1 newer exists, 2 could not tell). If several copies are installed,
  `evnx update --list` shows which one runs. Let the user run the upgrade; do not install
  software on your own.
- **If the binary is newer than the table's last row,** trust `--help` over this skill, and
  read the [CHANGELOG](https://github.com/urwithajit9/evnx/blob/main/CHANGELOG.md) for what
  moved. Per-command pages: `https://docs.evnx.dev/cli/commands/<command>` (the exact URL is
  the `docs_url` field in `evnx commands --json`).
- **If `evnx` is not installed,** say so and point to the install channels `evnx update`
  lists (`cargo install evnx`, `npm install -g @evnx/cli`, `pip install evnx`, Homebrew, Scoop,
  winget, or the install script). A build compiled without some features
  lacks the matching commands (`cloud`, `migrate`, `backup`, network access for
  `update --check`); `evnx commands` shows which features this build has.

## Principles

1. **Never print secret values.** Do not `cat` a `.env` or paste its values into chat, commits
   or logs. `evnx parse` lists names and flags without values; `evnx scan` shows only masked
   previews. Use `--values`/`--show-values` only when the user explicitly asks, and never
   echo what comes back. Use fake or masked keys in any example you write.
2. **Look before you write.** Prefer `--dry-run` for anything that edits files (`init`, `add`,
   `remove`, `validate --fix`, `sync`, `restore`, `template`), and `--json` when you will read
   the result programmatically instead of scraping text.
3. **Read the exit code; "could not run" is not "clean".** Exit 0 is clean. Exit 1 means
   findings or differences. Exit 2 means evnx could not give a verdict (bad flag, missing file,
   no terminal to ask). Treat 2 as a failure to investigate, never as a pass. Exit 4 means the
   user declined a prompt. Cloud commands use 10-15 (see below). Per-command tables:
   [references/commands.md](references/commands.md).
4. **No terminal means no prompts.** In CI or an agent shell, prompts cannot be answered.
   Pass `--yes` (or `--force` where the command says so) only after you have previewed the
   change, and pass explicit flags instead of relying on interactive selection.
5. **`.env` is never committed.** `.env` stays git-ignored; `.env.example` (names, placeholder
   values) is committed. Check with `evnx doctor` (`evnx doctor --fix` repairs `.gitignore`
   and file modes).
6. **Catch secrets before they leave the machine.** Use `evnx scan --staged` before a commit,
   and `evnx scan hook install` to make it automatic. In CI gate on `evnx scan --severity high`.
7. **Do not suppress to get green.** `--exit-zero`, `--update-baseline` and `# evnx:allow`
   markers hide findings. Use them only when the user chose to accept a finding, and say what
   you accepted. If a secret was really exposed, rotate it at the provider; deleting the file
   or the line is not enough.
8. **Run programs with `evnx run`** instead of exporting a `.env` into the shell:
   `evnx run -- <command>` hands the variables to the child process only, and masks secrets in
   output when it is not a terminal.

## Pick the command

| Job | Command |
|---|---|
| Set up `.env`, `.env.example`, `.gitignore`, contract | `evnx init` |
| Add / remove variables (service, framework, blueprint, custom) | `evnx add`, `evnx remove` |
| Is `.env` complete and sane vs the template? | `evnx validate` |
| Hunt for committed or about-to-be-committed secrets | `evnx scan` (`--staged`, `scan hook`, `scan rules`) |
| Compare two env files or env vs template | `evnx diff` |
| Keep `.env` and `.env.example` aligned | `evnx sync` (`--check` is the CI gate) |
| Declare required/format/secret per variable | `evnx spec init`, `evnx spec check` |
| Output as JSON, Kubernetes, Terraform, ... | `evnx convert` |
| Move into a secret manager | `evnx migrate` (prints commands; `--print-only` to save them) |
| Render a config file from a template | `evnx template` |
| Encrypted local backup | `evnx backup`, `evnx restore` |
| Encrypted team sync | `evnx auth`, `evnx vault`, `evnx cloud` |
| Project health | `evnx doctor` |
| See what evnx parses, names only | `evnx parse` |

## Typical flows

Check a project (read-only):

```bash
evnx doctor
evnx validate --strict
evnx scan --severity high
evnx diff --fail-on missing
```

Add variables safely:

```bash
evnx add --list                          # ids that exist in this version
evnx add service stripe --dry-run --json # preview the names that would be added
evnx add service stripe --yes            # then write (also updates .env.example)
```

Before committing:

```bash
evnx scan --staged
evnx scan hook install                   # automatic from now on
```

Convert or migrate: run `evnx convert --help` for the current target list, preview on stdout,
and only write to a file (`-o`) the user wants; the output holds real values. See
[references/convert-formats.md](references/convert-formats.md).

CI: [references/cicd-integration.md](references/cicd-integration.md).

## Reading scan results

- `severity` (critical, high, medium, low) is how bad a finding is if real.
  `confidence` (high, medium, low) is how sure evnx is that it is real. `--severity` and
  `--confidence` filter each; both must pass.
- A finding in a git-ignored, untracked file (a normal local `.env`) is summarised in one
  line and does not fail the run; `--include-ignored` lists them.
- To accept existing findings deliberately: `evnx scan --update-baseline` (fingerprints only,
  safe to commit) or a same-line `# evnx:allow <rule-id> - reason` marker.

## Version notes

Rows append as releases ship. Check the installed version against the "since" column before
relying on a behaviour. Anything not listed here: use `--help`.

| Since | Behaviour an agent should know |
|---|---|
| v0.13.0 | `${VAR}` expands top to bottom, as Docker Compose does: it reads the value assigned above it, and a forward reference is an error naming the line to move. Older versions used each variable's last value. |
| v0.13.0 | Keys may contain `.`, `-`, `[`, `]`, a leading digit or non-ASCII letters; outputs that cannot hold such a name (e.g. shell, GitHub Actions) refuse it by name. |
| v0.13.0 | `scan --format json` is `schema_version: 2`: `severity` (how bad) is separate from `confidence` (how sure). `--severity` filters risk; before, it filtered confidence, which is now `--confidence`. SARIF `ruleId` is a stable rule id. |
| v0.13.0 | `scan` gains rule files and packs (`scan rules`), baseline (`--baseline`, `--update-baseline`), `# evnx:allow` markers, `--staged`, and `scan hook install\|uninstall\|status`. 63 built-in rules (13 in 0.12). A `--severity high` gate may fail on more than before. |
| v0.13.0 | `evnx remove` (alias `rm`) deletes variables from the env file, and from the template and contract with `--template`, `--contract` or `--all`. |
| v0.13.0 | Declining a confirmation in `add` and `remove` exits 4 (`add` exited 0 before). Some `--help` text may still say otherwise; the exit code is what to trust. |
| v0.13.0 | `auth`, `vault`, `org` and `cloud` exit 10-15 for server failures: 10 not signed in, 11 forbidden, 12 plan limit, 13 unreachable, 14 conflict or locked, 15 server error or rate limited. Earlier: 1 or 2. |
| v0.13.0 | `cloud run` and `cloud pull` take repeatable `--vault` (merged left to right; a duplicate key is refused unless `--allow-override`). |
| v0.13.0 | GCP secret names are lowercased with `-` in `convert --to gcp-secrets`, `migrate --to gcp-secret-manager` and `cloud export --to gcp-secrets` (`DB_URL` becomes `db-url`). `convert --to vercel` marks secret-looking variables `sensitive`. `backup`/`restore --output -` is refused. |
| v0.12.0 | `evnx parse` (names and flags, never values). `validate` reads stdin or JSON (`--env -`, `--input-format json`). `update --list`. Declining the shared overwrite prompt (e.g. `restore`, `cloud pull`) exits 4. |
| v0.11.0 | `evnx run`. `template` with an unresolved placeholder exits 2. `scan -` reads stdin. `convert --only secrets\|public`. `spec check`. `--env-name` on `init` and `add`. `restore` defaults to the recorded file name. |
| v0.10.7 | `update --check` exits 0/1/2 and has `--json`. |
| v0.10.0 | `surface` was renamed `evnx commands` (the old name still works as an alias). |

## References

Each file starts with the evnx version it was generated from; confirm with `--help`.

- [references/commands.md](references/commands.md) - per-command purpose, key flags, exit codes
- [references/convert-formats.md](references/convert-formats.md) - `convert` targets and per-target rules
- [references/cicd-integration.md](references/cicd-integration.md) - GitHub Action, scan gate, SARIF, pre-commit
- Docs: https://docs.evnx.dev - Changelog: https://github.com/urwithajit9/evnx/blob/main/CHANGELOG.md
- For `.env` format and security practice that does not depend on evnx, see the
  `dotenv-best-practices` skill.
