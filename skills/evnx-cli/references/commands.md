# evnx commands - purpose and key flags

**Generated from evnx 0.13.0 - confirm with `evnx <cmd> --help`.** This is a summary, not the
full flag list. For every flag of every command (machine-readable, with docs URLs and compiled-in
features) run `evnx commands --json`. If the installed version differs from 0.13.0, the binary
wins. Per-command pages: `https://docs.evnx.dev/cli/commands/<command>`.

## Global flags

`-v/--verbose`, `-q/--quiet` (nothing on success; findings, warnings and errors still print),
`--no-color`, `-h/--help`, `-V/--version`.

Env-file selection is per command: `--env <PATH>` (or `--source-file` / `--file` where the
command says so) and `--env-name <NAME>` (reads `.env.<NAME>`; an unknown name is an error, it
never falls back to `.env`). `[defaults]` in `.evnx.toml` can change the defaults.

## Exit codes

| Code | Meaning |
|---|---|
| 0 | Success / nothing found |
| 1 | Findings or differences (`scan`, `validate`, `diff`, `doctor`, `sync --check`, `parse`); `migrate` some GitHub uploads failed; `update --check` a newer release exists |
| 2 | Could not run: bad flag, missing file, no terminal to ask, nothing scanned. **Not a clean result** |
| 4 | You answered no to a confirmation (`add`, `remove`, `restore`, `cloud pull`) |
| 3, 5, 6 | `backup`/`restore` specific (see `backup --help`, `restore --help`) |
| 10-15 | `auth`, `vault`, `org`, `cloud` server failures: 10 not signed in, 11 forbidden, 12 plan limit, 13 unreachable, 14 conflict or locked, 15 server error or rate limited |
| child's code | `run` and `cloud run` return the command's own exit code once it started |

## Project setup and editing

| Command | Purpose | Key flags |
|---|---|---|
| `init` | Create `.env.example`, `.env`, `.gitignore` entries and the `.evnx.toml` contract | `--yes`, `--dry-run`, `--json`, `--blueprint ID`, `--with LIST`, `--list-components`, `--detect`, `--from-source`, `--force`, `--env-name`, `--path` |
| `add` | Add variables to the env file and template | `--list` (ids), `--dry-run`, `--json`, `--yes`, `--env-name`, `--path`. Subcommands: `add service <id>`, `add framework <id>` (`--language`), `add blueprint <id>`, `add custom <vars...>` (`--desc`, `--category`, `--required`, `--optional`) |
| `remove` (alias `rm`) | Delete variables (names or quoted globs) from the env file; optionally the template and contract | `--template`, `--contract`, `--all`, `--dry-run`, `--yes`, `--ignore-missing`, `--no-backup`, `--json`, `--env-name`, `--path` |
| `spec` | The `[vars]` contract in `.evnx.toml`: what each variable is | `spec init` (`--with`, `--stdout`, `--merge`, `--force`), `spec check` (read-only; `--example`, `--env`) |
| `parse` | List what evnx reads: line, key, flags. **Never values** unless `--values` | `--format pretty\|json`, `--env` (or `-` for stdin), `--env-name`, `--values`, `--yes` |

## Checking

| Command | Purpose | Key flags |
|---|---|---|
| `validate` | Check `.env` against the template/contract: missing, placeholders, weak secrets, boolean traps, expansion order | `--strict` (also report undeclared), `--fail-on error\|warning`, `--format pretty\|json\|github-actions`, `--fix` with `--dry-run` / `--rotate-weak-secrets`, `--env` (`-` = stdin), `--input-format dotenv\|json`, `--example`, `--ignore`, `--validate-formats`, `--exit-zero` |
| `scan` | Detect secrets in files, folders, stdin (`-`) or the git index | `[PATH]...`, `--staged`, `--severity`, `--confidence`, `--format pretty\|json\|sarif\|github`, `--baseline`, `--update-baseline`, `--rules FILE`, `--exclude`, `--extensions`, `--max-file-size`, `--pattern REGEX`, `--ignore-placeholders`, `--include-ignored`, `--exit-zero` |
| `scan rules` | Your own rules and rule packs | `list` (`--category`, `--json`), `new <id>`, `test <file>`, `add <name\|url\|path>` (`--format`), `update`, `remove` (`--personal` for per-user rules) |
| `scan hook` | Git pre-commit hook that runs `scan --staged` | `install`, `uninstall`, `status` |
| `diff` | Keys missing/extra vs the template, or keys and values between two environments | `--against NAME`, `--env-name`, `--env`, `--example`, `--fail-on missing,extra,different`, `--format` (pretty, json, patch), `--values`, `--show-values`, `--ignore-keys`, `--skip-without-env`, `--reverse`, `--with-stats` |
| `sync` | Keep `.env` and `.env.example` aligned by name (adds only) | `--check` (never writes; CI gate), `--direction forward\|reverse`, `--dry-run`, `--force`, `--placeholder`, `--format pretty\|json` (needs `--check`), `--skip-without-env` |
| `doctor` | Project health: gitignore, file modes, env files git would commit, structure | `--fix`, `--strict`, `--format pretty\|json`, `--skip-without-env`, `[PATH]` |

`--skip-without-env` (on `diff`, `sync`, `doctor`) is for pre-commit hooks on a fresh clone. Do
not use it in CI, where a check that never ran must not pass.

## Output and delivery

| Command | Purpose | Key flags |
|---|---|---|
| `convert` | Render a `.env` as another format | `--to FORMAT` (see [convert-formats.md](convert-formats.md)), `-o/--output`, `--force`, `--include`, `--exclude`, `--only secrets\|public`, `--prefix`, `--transform`, `--base64`, `--allow-empty`, `--allow-collisions`, per-target name flags |
| `migrate` | Print the vendor commands that move secrets into a manager (GitHub Actions uploads instead) | `--to`, `--print-only`, `--dry-run`, `--include`, `--exclude`, `--strip-prefix`, `--add-prefix`, `--skip-existing`, `--overwrite`, `--yes`, `--repo`, per-target flags |
| `template` | Render a config file from a template and a `.env` (`{{VAR}}`, `{{VAR\|default:x}}`) | `--input`, `--output` (`-` = stdout), `--dry-run`, `--mode`, `--mkdir`, `--allow-unresolved`, `--gitignore` |
| `run` | Run a command with a `.env` in its environment | `evnx run [--env F] [--include G] [--exclude G] [--mask\|--no-mask] -- <command>` |
| `completions` | Shell completion script | `<shell>` |

`migrate --to` values: `github-actions`, `aws-secrets-manager`, `doppler`, `infisical`,
`gcp-secret-manager`, `azure-keyvault`, `vercel`, `heroku`, `railway`. Run `evnx migrate --help`
for the current list and each target's required flags.

## Backup and cloud

| Command | Purpose | Key flags |
|---|---|---|
| `backup` | Encrypted backup of a `.env` (passphrase-based, no account) | `<env>`, `--output`, `--key-file` (or `EVNX_PASSWORD`), `--keep N`, `--verify` |
| `restore` | Decrypt a backup | `<backup>`, `--output`, `--password-file`, `--dry-run`, `--inspect`, `--yes` |
| `auth` | Account: `register`, `login`, `logout`, `status`, `token create\|list\|revoke`, `totp`, `sessions`, `devices` | `--password-stdin` on login/register; `token create <name> --scope <vault>` for CI; `EVNX_TOKEN` env var for a token |
| `vault` | Encrypted vaults: `create`, `list`, `delete`, `share`, `members`, `role`, `revoke`, `rekey`, `leave` | `--yes`, `--password-stdin` |
| `org` | Organisations, seats, billing | subcommands only; see `evnx org --help` |
| `cloud` | `push`, `pull`, `run`, `history`, `diff`, `audit`, `watch`, `link`, `unlink`, `export`, `delete-version`, `status` | `--vault` (repeatable on `pull` and `run`), `--password-stdin`, `--yes`, `--file`, `--env-name`, `--mask`; `export --to FORMAT` |

A token authenticates API requests but does not decrypt: a pipeline also needs the master
password: `--password-stdin` takes precedence; `EVNX_MASTER_PASSWORD` (since 0.12.0) is the
no-terminal fallback and warns on every use. Scope CI tokens to one vault. Never put either on a
command line.

## About evnx itself

| Command | Purpose | Key flags |
|---|---|---|
| `commands` (alias `surface`) | Every command, flag and compiled-in feature of this build | `--json`, `--compact` (with `--json`) |
| `update` | Print the upgrade command for how this copy was installed; never self-replaces | `--check` (exit 0 current, 1 newer, 2 unknown), `--list`, `--json` |
