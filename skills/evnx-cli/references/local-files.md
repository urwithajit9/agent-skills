# evnx on local files - set up, edit, check

**Written against evnx 0.16.0 - confirm with `evnx <command> --help`.** Flags per command:
[commands.md](commands.md).

## Which files a command reads

- `--env FILE` names the env file (`-` is stdin where the help says so); `--env-name NAME` reads
  `.env.NAME` and pairs it with `.env.NAME.example` when that exists; `--example FILE` names the
  template. `--env-name` takes a name, not a path.
- `-C/--dir DIR` names the project folder (`init`, `add`, `set`, `get`, `remove`, `doctor`).
  There is no `--path`: it was removed in 0.15.0 and exits 2.
- `[defaults] env_name` / `example` in `.evnx.toml` change the defaults. `evnx config show`
  prints every effective setting with its source; read it before guessing why a command picked
  a file. Commands print the files they paired on stderr (`files .env.prod ↔ .env.prod.example`).
- Outside a git repository only the working folder's `.evnx.toml` is read.

## Set up a project

| State | Command |
|---|---|
| Nothing yet | `evnx init --list-components`, then `evnx init --yes --with nextjs,postgresql,stripe` (or `--blueprint ID`, `--detect`, `--from-source`) |
| A template, no `.env` (fresh clone) | `evnx init --yes` writes `.env` from the template, the `.gitignore` lines and the `.evnx.toml` contract |
| Only named env files (`.env.prod`) | `evnx init --yes` offers to adopt them and sets `[defaults] env_name` |
| A sub-folder of a repository as its own project | `evnx init --here` |

Preview with `--dry-run --json`. `--no-contract` skips `.evnx.toml`. `init` writes
placeholders; the next step it prints is `evnx set --fill`.

## Fill and change values

| Job | Command |
|---|---|
| Fill every empty or placeholder value, one prompt each | `evnx set --fill` (`--only 'STRIPE_*'` narrows; `--dry-run` lists the names) |
| One value, in place | `evnx set PORT=8080 --yes` |
| One secret, without shell history | `printf %s "$VALUE" \| evnx set API_KEY --yes`, or let `evnx set API_KEY` prompt with no echo |
| A multi-line value (certificate, key, service-account JSON) | `evnx set TLS_CERT --from-file cert.pem --yes` (`-` for stdin; `--base64` for binary) |
| Only if not set yet | `evnx set NAME=value --if-missing` |
| Read one value in a script | `PORT=$(evnx get PORT)`; `evnx get NAME --exists` (exit 0 or 1, prints nothing) |

- `set --fill` needs a terminal: with none, or with `--yes` / `--json`, it exits 4 and names
  `--dry-run` and `evnx set NAME`. An agent shell has no terminal, so ask the user to run
  `evnx set --fill` themselves. Never ask them to paste a secret into the chat.
- `set` keeps the line's position, comments, `export` and quoting, writes atomically, and keeps
  one `.bak` (`evnx undo .env` swaps it back). It touches no template, contract or `.gitignore`.
  Replacing a value asks first: `--yes` after you have said what changes. A value on the command
  line works but stays in shell history; evnx warns.
- `get` refuses a secret-looking name without `--reveal` (exit 4), even into a pipe. Do not add
  `--reveal` unless the user asked for that value, and never echo it back.
- `set --from-file` / `add custom NAME --from-file`: one NAME, at most 64 KiB, the final line
  break dropped (`--keep-trailing-newline` keeps it); stored double-quoted with `\n`; a dry run
  prints only the size.

## Add and remove variables

| Job | Command |
|---|---|
| Known ids | `evnx add --list` |
| A service, framework or blueprint | `evnx add service stripe --dry-run --json`, then `--yes` |
| Your own names | `evnx add custom FEATURE_X=false --yes` (`--desc`, `--category`, `--required`, `--optional`) |
| Many from another file | `evnx add import config.json --dry-run`, then `--yes` |
| Remove | `evnx remove OLD_NAME --all --dry-run` (`--template`, `--contract`, `--all`), then `--yes` |
| Is it gone everywhere? | `evnx remove OLD_NAME --check` |

- `add` writes the value to `.env` and a placeholder to `.env.example` (`--no-template` writes
  only the env file).
- `add import` reads `.env`, `.properties`, INI, JSON, YAML (flat, nested with `__`, a
  Kubernetes Secret, compose `environment:`, GitHub Actions `env:`), CSV and `web.config`.
  Names become UPPER_SNAKE (`app.log_level` becomes `APP__LOG_LEVEL`). `--from` names the
  format (needed for stdin), `--section`, `--only`, `--exclude` narrow it. Collisions, arrays,
  `null`, binary values and invalid names exit 2 and write nothing; names `.env` already has are
  kept. The dry run shows the source-to-name mapping, never a value.
- `remove` refuses to leave a dangling `${NAME}` (`--allow-dangling`), and a pattern that
  matches every name needs `--all-names`.

## Check

| Job | Command |
|---|---|
| Everything about `.env` vs the template and contract | `evnx validate` (`--strict` also reports undeclared names) |
| One report: doctor, validate, sync both ways, scan | `evnx doctor --all` (verdict 2 if a part could not run, else 1 if any found something) |
| Setup only: gitignore, file modes, env files git would commit | `evnx doctor` (`--fix` repairs) |
| Names in `.env` and the template agree (fast, for hooks) | `evnx sync --check` |
| `.env.example` against the `[vars]` contract, no `.env` needed | `evnx spec check` |
| Two environments | `evnx diff .env.staging .env.production` (names and values; `--show-values` to print values) |
| What evnx parsed, names and flags only | `evnx parse` |

- `validate` exits 1 on errors (placeholders, missing required names, a forward `${VAR}`
  reference); URL, port and email checks are warnings unless `--fail-on warning`. Its next
  steps name `evnx set --fill` for placeholders. `--fix --dry-run` previews repairs.
- `sync` only adds names: `--direction forward` (or `--to example`) adds to the template with
  placeholders, `--direction reverse` (`--to env`) adds to `.env`; `--yes` writes without asking;
  `--prune` removes stale template names.
- `align` gives env files the template's sections, comments and order without touching values.

## Undo

Every command that changes an env file keeps `<file>.bak` (mode 600, git-ignored, recorded in
`.evnx/backups.json`). `evnx history` lists the copies, `evnx undo .env` swaps the file with its
backup (run again to swap back). `evnx restore` is for `evnx backup` archives, not `.bak` files.
