---
name: evnx-cli
description: >
  Use when working with the evnx CLI to manage .env files. Triggers on tasks like:
  "set up .env", "fill in my .env", "set or get an env variable", "import variables from a
  JSON / YAML / properties file", "validate my .env", "scan for secrets", "scan git history for
  leaked keys", "install a pre-commit or pre-push secret hook", "diff .env and .env.example",
  "sync .env with .env.example", "convert .env to JSON / YAML / Kubernetes / Terraform / GitHub
  / AWS / GCP", "migrate secrets to a secret manager", "encrypt or restore a .env backup",
  "run a command with my .env", "set up evnx in CI/CD", "evnx doctor", "evnx cloud / vault",
  "remove someone from our vaults", or any mention of evnx. Also use when evnx is installed and
  the user wants to create, check, scan, convert, sync, back up or share .env files.
license: MIT
metadata:
  author: urwithajit9
  version: "3.0.0"
  evnx_version: "0.16.0"
  homepage: https://docs.evnx.dev
  repository: https://github.com/urwithajit9/agent-skills
---

# evnx CLI

evnx manages `.env` files: create and edit them, check them against a template and a contract,
scan files and git history for secrets, convert them to deployment formats, move them into
secret managers, back them up, and share them through encrypted vaults.

This file holds the workflow and the rules, which change slowly. Flag lists, formats and
per-release detail live in [references/](references/), each stamped with the evnx version it
was checked against, and in the binary itself.

## Step one: check the version

This skill was written and checked against **evnx 0.16.0** (the pin, also `metadata.evnx_version`).
Before any other evnx command, once per session, run:

```bash
evnx --version
```

Then follow the case that matches. `<pin>` below means the pinned version above.

- **Same version as the pin:** follow this skill.
- **Not installed:** install exactly the pinned version. First tell the user which command you
  will run and why; use the channel they prefer, and ask when you cannot tell.

  ```bash
  curl -fsSL https://evnx.dev/install.sh | EVNX_VERSION=<pin> bash   # Linux, macOS
  npm install -g @evnx/cli@<pin>
  pipx install evnx==<pin>                                           # or: pip install evnx==<pin>
  cargo install evnx --version <pin> --locked --all-features
  ```

  For cargo, `--all-features` is needed: the default build has no `cloud`, `migrate`, `backup`
  or network code, so those commands are missing (release archives, npm and pip have them all).
  Homebrew (`brew install urwithajit9/evnx/evnx`) installs the latest release only and cannot
  pin. Scoop (`scoop install evnx@<pin>`) and winget
  (`winget install urwithajit9.evnx --version <pin>`) can request a version, if that version is
  available to them; check `evnx --version` afterwards. Then run `evnx --version` again.
- **Older than the pin:** never replace or upgrade it on your own. Tell the user what this skill
  relies on that their version lacks (the rows of
  [references/version-notes.md](references/version-notes.md) newer than their version), and
  suggest the pinned upgrade with their channel's command above (`evnx update` prints the
  upgrade command for how this copy was installed, and changes nothing). Until they upgrade,
  use that binary's `evnx <command> --help`, and do not use a behaviour from a newer row.
- **Newer than the pin:** keep it. The commands in this skill still work: exit codes, the JSON
  `run` header and the flag spellings are stable (`docs/STABILITY.md` in the evnx repository),
  and a removed spelling exits 2 and names its replacement. For anything this skill does not
  cover, or a feature newer than the pin, run `evnx --help`, `evnx <command> --help` or
  `evnx commands --json` and use what they say, not memory.

`evnx commands --json` gives the whole surface at once: every command, flag, exit code, docs URL
and the features this build was compiled with.

## Principles

1. **Never print secret values.** Do not `cat` a `.env` or paste values into chat, commits or
   logs. `evnx parse` lists names and flags; `evnx scan` shows masked previews; `evnx get`
   refuses a secret-looking name without `--reveal`. Use `--values`, `--show-values` or
   `--reveal` only when the user asks, and never echo what comes back. Write only obviously
   fake values in examples.
2. **Values come from the user, not from you.** To fill in a `.env`, ask the user to run
   `evnx set --fill` in their own terminal (secret names are typed with no echo). Never ask them
   to paste a secret into the chat. A value on the command line stays in shell history.
3. **Look before you write.** Run `--dry-run` (`-n`) first for anything that edits files, and
   `--json` when you will read the result. Every edit keeps a `.bak`; `evnx undo FILE` puts it
   back.
4. **No terminal means no prompts.** In an agent shell or CI a question cannot be answered, and
   evnx exits 4 instead of guessing. Pass `--yes` only after you have previewed the change and
   the user agrees; pass explicit flags instead of relying on a picker.
5. **Read the exit code; "could not run" is not "clean".** See "Reading results" below.
6. **`.env` is never committed.** `.env` stays git-ignored; `.env.example` (names, placeholder
   values) and `.evnx.toml` are committed. `evnx doctor` checks it, `evnx doctor --fix` repairs
   `.gitignore` and file modes.
7. **Catch secrets before they leave the machine.** `evnx scan --staged` before a commit, the
   pre-commit and pre-push hooks to make it automatic, `evnx scan --history` for what commits
   already hold.
8. **Do not suppress to get green.** `--exit-zero`, `--update-baseline`, `evnx:allow` markers,
   `EVNX_SCAN_BYPASS`, `--no-verify` and `hooks.evnx-scan false` hide findings or skip checks.
   Use them only when the user chose to, and say what was accepted. A real exposed key is
   rotated at the provider; deleting the line is not enough.
9. **Run programs with `evnx run -- <command>`** instead of exporting a `.env` into the shell:
   the variables reach the child only, and secrets are masked in its output when it is not a
   terminal.

## Workflow by project state

| The project has | Do |
|---|---|
| No env files | `evnx init --list-components`, then `evnx init --yes --with ...` (preview with `--dry-run --json`); the user fills values with `evnx set --fill` |
| A template, no `.env` (fresh clone) | `evnx init --yes` writes `.env` from it; the user runs `evnx set --fill` |
| A `.env` | `evnx validate` (or `evnx doctor --all` for one report); placeholders: `evnx set --fill` |
| Variables to add or change | `evnx add service stripe` (also `framework`, `blueprint`, `custom`), `evnx add import FILE`, `evnx set NAME=value`, `evnx remove NAME` |
| Changes to commit | `evnx scan --staged`; once per clone `evnx scan hook install` |
| Commits to push | `evnx scan --history origin/main..HEAD`; once per clone `evnx scan hook install --pre-push` |
| A CI pipeline | [references/cicd-integration.md](references/cicd-integration.md) |
| A leaked or committed secret | Follow the next steps `evnx scan` prints (they depend on whether the key is staged, in local commits, or pushed); rotate a real key first. [references/scan.md](references/scan.md) |
| A team sharing values | `evnx auth`, `evnx vault`, `evnx cloud`; someone leaves: `evnx vault revoke --all-vaults --user EMAIL` and the rotate checklist. [references/cloud.md](references/cloud.md) |
| A deploy target | `evnx convert` (a file), `evnx migrate` (a secret manager), `evnx platform` (Vercel). [references/convert-formats.md](references/convert-formats.md) |

Settings look wrong? `evnx config show` prints every effective setting and where it came from.

## Pick the command

| Job | Command |
|---|---|
| Set up `.env`, `.env.example`, `.gitignore`, the contract | `evnx init` |
| Fill placeholders, change or read one value | `evnx set --fill`, `evnx set`, `evnx get` |
| Add or remove variables; import from another file | `evnx add`, `evnx add import`, `evnx remove` |
| Is `.env` complete and sane? | `evnx validate`, `evnx doctor` |
| Secrets in files, the index, or history | `evnx scan` (`--staged`, `--history`), `evnx scan hook` |
| Compare or align env files and the template | `evnx diff`, `evnx sync`, `evnx align`, `evnx spec check` |
| Declare required, format, secret per variable | `evnx spec init` |
| Another format; a secret manager; Vercel | `evnx convert`, `evnx migrate`, `evnx platform` |
| Render a config file from a template | `evnx template` |
| Run a program with the variables | `evnx run`, `evnx cloud run` |
| Encrypted local backup | `evnx backup`, `evnx restore` |
| Undo evnx's last change to a file | `evnx history`, `evnx undo` |
| Encrypted team sync | `evnx auth`, `evnx vault`, `evnx cloud` |
| Effective settings | `evnx config show` |
| What evnx parses, names only | `evnx parse` |
| This build's commands and features; how to upgrade | `evnx commands --json`, `evnx update` |

Flags and exit codes of every command: [references/commands.md](references/commands.md).

## Reading results

**Exit codes are the API.** They mean the same in every command:

| Code | Meaning | Treat as |
|---|---|---|
| 0 | Ran, nothing to report | pass |
| 1 | Ran and found something (findings, missing names, a difference, not in sync; `get`: name not in the file) | a result to report |
| 2 | Could not run: bad flag, missing file, invalid config, refused before any change | **not a pass**: investigate |
| 4 | Declined: answered no, or a confirmation was needed with no terminal and no `--yes` (also `get` without `--reveal`, `set --fill` with no terminal) | ask the user, or preview and pass `--yes` |
| 5 | `restore` wrote the result aside (`<output>.restored`) | read the message |
| 10-15 | Account and cloud: 10 not signed in, 11 forbidden (or this evnx is too old for the server), 12 plan limit, 13 unreachable, 14 conflict, 15 server error | retry only 13 and 15 |
| 141 | Output closed early (broken pipe) | ignore when you cut the output |

`run` and `cloud run` return the child's own code once it started (128+n if signal n killed
it). Branch on the code, not on the wording: human-readable text may change between releases.

**JSON has a `run` header.** Every `--json` (`--format json`) document starts with
`"run": {"tool": "evnx", "version", "schema_version", "ruleset", "features"}`. Check
`run.version` and the command's own `schema_version` before reading fields (`scan` is
`schema_version` 3). Two outputs have no header: `scan rules list --json` (an array) and
`scan --format sarif`. Status lines such as `config .evnx.toml` go to stderr, so stdout holds
only the document (or the value, for `evnx get`).

**Scan findings.** `severity` is how bad a finding is if real, `confidence` how sure evnx is;
both are floors (`--severity high` is the usual gate). A context hint may show the confidence one
level up or down; the gate uses the level before it. A finding has `file`, `line` and, in YAML,
JSON, TOML or notebooks, `key_path`; `encoded` means it was found inside a decoded value. Findings
in git-ignored, untracked files (a normal `.env`) are summarised and do not fail the run.
Lockfiles get key-format rules only. Details and accepting findings: [references/scan.md](references/scan.md).

**Next steps.** Most commands end with numbered next steps that name the exact command to run
(for example `evnx set --fill` after `init` and `validate`). Prefer them over a generic fix, and
tell the user what they say.

## References

Each file starts with the evnx version it was checked against.

- [references/commands.md](references/commands.md) - every command: usage, flags, exit codes (generated from `evnx commands --json`)
- [references/local-files.md](references/local-files.md) - init, set/get, add/import, remove, validate, doctor, sync, undo
- [references/scan.md](references/scan.md) - scan modes, reading findings, next steps, baseline and allow markers, policy, hooks, JSON
- [references/convert-formats.md](references/convert-formats.md) - `convert` targets and per-target rules
- [references/cicd-integration.md](references/cicd-integration.md) - pinned install, gates, GitHub Action, SARIF, pre-commit and prek
- [references/cloud.md](references/cloud.md) - accounts, CI tokens, vaults, revoke and rotate, cloud exit codes
- [references/version-notes.md](references/version-notes.md) - what changed in which release
- Docs: https://docs.evnx.dev - Changelog: https://github.com/urwithajit9/evnx/blob/main/CHANGELOG.md
- For `.env` practice that does not depend on evnx, see the `dotenv-best-practices` skill.
