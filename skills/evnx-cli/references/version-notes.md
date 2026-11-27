# evnx version notes

**Rows up to evnx 0.16.0, the version the evnx-cli skill is pinned to.** One row per change an
agent should know, newest first, from the evnx CHANGELOG. If the installed evnx is older than a
row, that row's behaviour is missing: say so, and do not rely on it. If it is newer than the last
row, read `evnx <command> --help` and the
[CHANGELOG](https://github.com/urwithajit9/evnx/blob/main/CHANGELOG.md) for what came after.

| Since | Behaviour an agent should know |
|---|---|
| v0.16.0 | A "no" at any confirmation exits 4, also in `vault`, `org`, `auth token/sessions/devices`, `cloud push` and `cloud delete-version` (they exited 0 with "Cancelled"). |
| v0.16.0 | `scan --format json` is `schema_version: 3`: every finding has `file` and `line` (number or `null`) beside `location`; YAML, JSON, TOML and notebook findings have `key_path`; optional `encoded`, `context`, `confidence_before_context`, `reason_code`; `summary.by_reason`. Under `--history`: `commit`, `blob`, `commit_time`, `git: "history"`. SARIF lists allowed and baseline findings as suppressed. |
| v0.16.0 | `scan` decodes base64, hex and percent-encoded values (16 to 4096 characters) once and checks them against the format rules; new GitLab token rules; a classic `ghp_`/`gho_`/`ghu_`/`ghr_` value whose checksum fails is dropped. A gate that passed may fail. |
| v0.16.0 | `scan` confidence can show one level higher (Authorization/Bearer header, HTTP call, connection string) or lower (`test`, `tests`, `mock`, `spec`, `fixtures` folders). Exit code, `--confidence` and counts use the level before the hint. Lockfiles get the key-format rules only. |
| v0.16.0 | `scan --history [RANGE]` (bare: from `HEAD`, incremental from the last clean run; `--full`; `all` for every ref). `scan hook install --pre-push`; `EVNX_SCAN_BYPASS="<reason>" git push` passes once and is logged. `scan hook status` reads `.pre-commit-config.yaml`. The `evnx-scan-push` pre-commit hook now runs `scan --history`. |
| v0.16.0 | `scan` next steps depend on where the key is: staged only (unstage), in local commits no remote has (`git commit --amend` / `git rebase -i`, no force push), or committed and shared (revoke, `git filter-repo`, force push). Rewrite advice only for a high-confidence key-format match. |
| v0.16.0 | `set --fill` (asks for every empty or placeholder value; needs a terminal, else exit 4), `set NAME --from-file <path\|->` and `add custom NAME --from-file` (multi-line values), `add import <FILE\|->` (.env, properties, INI, JSON, YAML, CSV, web.config). `validate` and `init` now suggest `evnx set --fill`. |
| v0.16.0 | `config show` (every setting, its value and its source; `--json`). `scan --update-baseline --reason used-in-tests\|false-positive\|fix-later`; accepted findings carry `reason_code`. |
| v0.16.0 | `vault revoke --all-vaults --user <email>`; `vault revoke` ends with a "rotate at the source" checklist of credential names (`rotate` in `--json`) and takes `--dry-run` and `--json`. `cloud watch --on-change -- <command>`. `cloud delete-version --latest`. |
| v0.16.0 | A server that answers HTTP 426 (this evnx is too old) exits 11 and names `evnx update`. `parse --show-values` implies `--values`. |
| v0.15.0 | Old flag spellings removed: they exit 2 and name the new one (`-p/--path` is `-C/--dir`; `sync --force`/`--placeholder`, `restore --force`, `cloud pull --force` are `--yes`; `--format text` is `pretty`; `--format github-actions` and `--to github-actions` are `github`; `migrate --source-file` and cloud/platform `-f/--file` are `--env`; `platform --env-name` is `--target`). `evnx commands --json` lists them under `removed`. |
| v0.15.0 | Every JSON document has a top-level `run` object (`tool`, `version`, `schema_version`, `ruleset`, `features`); not `scan rules list --json` or SARIF. `--json` is shorthand for `--format json`; `-n` for `--dry-run`. |
| v0.15.0 | One exit table: a needed confirmation with no terminal and no `--yes` exits 4 everywhere; `backup` errors are 2; a command killed by signal n exits 128+n. |
| v0.15.0 | `set NAME[=VALUE]` and `get NAME` (`--reveal` for a secret-looking name, else exit 4; `--exists` exits 0 or 1). Also `align`, `history`, `undo FILE`, `doctor --all`, `diff A B`, `run --prefer env\|vault`, `cloud run --min-version`, `init --here`, `init --no-contract`, `add --no-template`, `convert --from json`, `--to dotenv`, `--kind`. |
| v0.15.0 | `scan --policy FILE` / `EVNX_POLICY` (a floor `.evnx.toml` cannot lower), `scan --exit-only`, `scan --strict` (unknown `.evnx.toml` key exits 2). |
| v0.15.0 | `--env-name NAME` takes a name, not a path, and uses `.env.NAME.example` when it exists. `validate` runs URL, port and email checks by default, as warnings. `template` needs `--force` to replace its output. `remove` refuses to leave a dangling `${NAME}` (`--allow-dangling`); `remove '*'` needs `--all-names`. |
| v0.15.0 | `run` and `cloud run` refuse more names that start programs (`EDITOR`, `PAGER`, `GIT_ASKPASS`, `npm_config_*`, ...): exit 2 unless `--allow-unsafe-names` or `--exclude`. `auth token create` needs `--vault` or `--all-vaults` and expires in 90 days; `vault share` gives `viewer`; `vault delete` needs the full `name/environment`. |
| v0.15.0 | `convert --to yaml` quotes every value. `restore --output -` writes to stdout. Install URL: `https://evnx.dev/install.sh`. |
| v0.14.1 | 0.14.0's master password prompt hangs at a terminal; upgrade from 0.14.0. `--password-stdin` and `EVNX_MASTER_PASSWORD` were not affected. |
| v0.14.0 | CI for the cloud vault sets `EVNX_KEY_BUNDLE` (or `EVNX_KEY_BUNDLE_FILE`) beside `EVNX_TOKEN` and `EVNX_MASTER_PASSWORD`; `auth token create` and `auth key-bundle` print it. |
| v0.14.0 | `platform diff\|pull\|push --to vercel`. `remove --check NAME...`. `sync --prune`. |
| v0.14.0 | `scan` checks names in Dockerfiles, shell scripts and Python, reads notebooks cell by cell, and rates a secret under a public prefix (`NEXT_PUBLIC_`, `VITE_`) one level higher. `validate` adds `public_secret` (error) and `partial_presence` (warning). |
| v0.14.0 | `convert`: `vercel` and `doppler` print the shapes those tools read, Vercel secrets are `sensitive` in development too, `terraform` keeps the case of names, `heroku` is one `config:set` call. `<file>.bak` is replaced on each write. |
| v0.13.0 | `${VAR}` expands top to bottom, as Docker Compose does; a forward reference is an error naming the line to move. |
| v0.13.0 | Keys may contain `.`, `-`, `[`, `]`, a leading digit or non-ASCII letters; outputs that cannot hold such a name refuse it by name. |
| v0.13.0 | `scan`: `--severity` is how bad, `--confidence` how sure (before, `--severity` filtered confidence). Rule files and packs (`scan rules`), baseline, `# evnx:allow`, `--staged`, `scan hook`. |
| v0.13.0 | `evnx remove` (alias `rm`). `auth`, `vault`, `org`, `cloud` exit 10 to 15 for server failures. `cloud run` and `cloud pull` take repeatable `--vault`. GCP secret names are lowercased with `-`. |
| v0.12.0 | `evnx parse`. `validate --env -` and `--input-format json`. `update --list`. |
| v0.11.0 | `evnx run`. `scan -` reads stdin. `convert --only secrets\|public`. `spec check`. |
| v0.10.7 | `update --check` exits 0/1/2 and has `--json`. |
| v0.10.0 | `surface` was renamed `evnx commands` (the old name is an alias). |
