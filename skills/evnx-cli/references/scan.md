# evnx scan - modes, results, accepting findings, hooks

**Written against evnx 0.16.0 - confirm with `evnx scan --help` and `evnx scan hook --help`.**
Docs: https://docs.evnx.dev/cli/commands/scan

## What to scan

| Job | Command |
|---|---|
| The working tree (default `.`) | `evnx scan`, or `evnx scan src config/app.yaml` |
| What the next commit records (the git index) | `evnx scan --staged` |
| Commits about to be pushed | `evnx scan --history origin/main..HEAD` |
| Everything history ever held | `evnx scan --history all` (every ref), bare `evnx scan --history` (from `HEAD`) |
| A pipe | `git diff \| evnx scan -` |

- `--history` reads every distinct file version a range added or changed, once and whole, and
  reports it against the oldest commit that has it (`path@abc1234:LINE`). A secret that was added
  and later deleted is still found. A bare `--history` builds on the last clean history scan of
  this clone (`.git/evnx/history.json`, never committed) and reads only newer commits; `--full`
  reads everything again. Outside a git repository it exits 2.
- A folder walk skips `.git`, `node_modules`, `target`, `dist`, `build` and similar, the
  `.env.example` family, binary files, files over 1 MiB (`--max-file-size`), and evnx's own
  files in `.evnx/` (rules, `rules.lock`, `baseline.json`, `backups.json`, platform state). A
  file named on the command line is always read.
- In a git repository, findings in files git ignores and does not track (a filled-in `.env`)
  are summarised in one line and do not fail the run. `--include-ignored` counts them.
- Lockfiles (`package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`, `Cargo.lock`, `go.sum`, ...)
  get the key-format rules only, no name or entropy checks.
- A value of 16 to 4096 characters that is base64, hex or percent-encoded text is decoded once
  and checked against the format rules. Such a finding says "found inside a base64-encoded
  value, decoded once" and has `encoded` in JSON.
- YAML, JSON, TOML and notebook findings name the key: `config.yaml:3 (app.db.password)`.

## Reading a finding

- `severity` (critical, high, medium, low): how bad it is if real. `confidence` (high, medium,
  low): how sure evnx is that it is real. `--severity` and `--confidence` are floors; both must
  pass. `--severity high` is the usual CI gate.
- A context hint can move the confidence shown by one level: up for a line with an
  `Authorization`/`Bearer` header, an HTTP client call or a connection string; down for a file
  under `test`, `tests`, `mock`, `spec` or `fixtures`. The exit code, the `--confidence` floor
  and the counts use the level before the hint (`confidence_before_context` in JSON).
- `value_preview` is masked (`AKIA…9W`); evnx never prints the full value. Do not try to
  recover it.
- `matched_by: "value"` with high confidence means a known key format matched. A finding from a
  variable name or entropy alone may be harmless; check it before acting.

## Follow the next steps evnx prints

They depend on where the key is, and they are right more often than a generic rule:

| Where the key is | evnx says |
|---|---|
| Staged, never committed | Unstage it (`git restore --staged FILE`, or `git rm --cached FILE` before the first commit), move the value into `.env`; nothing to rewrite |
| In local commits no remote has (`--history`, pre-push hook) | Take the key out, then `git commit --amend` (or `git rebase -i <commit>^`); push as usual, no force push |
| Committed and on a remote, or no remote to ask | Revoke or rotate first, then `git filter-repo` and a coordinated force push |
| Flagged by name, entropy or lower confidence | "Check FILE": confirm, then accept it if it is not a secret |

Rotating at the provider comes first whenever a real key left the machine. Rewriting history
changes every clone: tell the user and let them decide.

## Accepting a finding on purpose

Only when the user decided it is not a secret, or accepts it for now. Say what you accepted.

- Inline, on the line or the line above: `evnx:allow <rule-id> reason=used-in-tests` (or
  `false-positive`, `fix-later`), then free text.
- Baseline: `evnx scan --update-baseline --reason fix-later` writes `.evnx/baseline.json`
  (fingerprints, rule, file; never a value; safe to commit) and exits 0. Later runs report those
  findings as `known` and fail only on new ones. `--baseline FILE` reads another file.
- `--exit-zero` only stops exit 1; a scan that could not run still exits 2. Use it for an
  advisory step, never a gate.

## Configuration

`[scan]` in `.evnx.toml`: `exclude`, `severity`, `confidence`, `disable`, `builtins`,
`extensions`, `max_file_size`, `ignore_placeholders`, and `[[scan.patterns]]` for custom
expressions. There is no `exclude_patterns`: an unknown key is a warning ("did you mean") and is
ignored, and `--strict` makes it exit 2. `evnx config show` lists every effective setting and the
file, variable or flag it came from.

- `--no-config`: ignore the repository's `.evnx.toml` (no disabled rules, no severity floor, no
  excludes, no default baseline). For a CI gate the scanned change cannot weaken.
- `--policy FILE` (or `EVNX_POLICY`; the flag wins): a file outside the repository with
  `required_rules`, `max_severity_floor` and `allow_disable`. A conflicting `.evnx.toml` or flag
  exits 2 before any file is read. The installed hooks honour `EVNX_POLICY`.
- `--exit-only` prints nothing and answers with the exit code.
- `evnx scan rules list` shows the rules this build has; `scan rules new|test|add|update|remove`
  manage your own rule files and packs.

## Git hooks

| Command | Effect |
|---|---|
| `evnx scan hook install` | `.git/hooks/pre-commit` runs `evnx scan --staged` (honours `core.hooksPath`) |
| `evnx scan hook install --pre-push` | `.git/hooks/pre-push` scans the commits each push adds beyond the remote |
| `evnx scan hook status` (`--pre-push`) | installed, turned off, or run through pre-commit/prek (with the `rev` it finds in `.pre-commit-config.yaml`, and whether that rev is older than this evnx) |
| `evnx scan hook uninstall` (`--pre-push`) | removes only evnx's block |

Both hooks block on findings, on a scan that cannot run, and when evnx is not on `PATH`.
`install` refuses a hook that pre-commit or prek manages; use the hook ids in
[cicd-integration.md](cicd-integration.md) there.

Ways past a hook, each the user's call, never yours alone:

- `EVNX_SCAN_BYPASS="<reason>" git push` pushes once; the reason is required and is logged with
  the time and commits in `.git/evnx/bypass.log`.
- `git commit --no-verify` / `git push --no-verify` skips the hook without a record.
- `git config hooks.evnx-scan false` turns evnx's hooks off for the clone.

## JSON (`--json`)

`run` header (`ruleset` is the rule-set id, e.g. `builtin@0.16.0`), then `schema_version: 3`,
`findings[]` (exactly what fails the run), `allowed[]` and `known[]` when there are accepted
findings, `summary` (counts by confidence and severity, `allowed`, `by_reason`), `files[]` and
`effective_config` (with `rules_digest`). A finding has `rule_id`, `status` (`new`, `known`,
`allowed`),
`fingerprint`, `pattern`, `severity`, `confidence`, `value_preview`, `location`, `file`, `line`,
`variable`, `matched_by`, `git`, `action_url`, and when they apply `key_path`, `encoded`,
`context`, `confidence_before_context`, `reason_code`, and under `--history` `commit`, `blob`,
`commit_time`. Read `file` and `line` rather than splitting `location`.
