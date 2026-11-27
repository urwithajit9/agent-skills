# evnx commands

**Generated from evnx 0.16.0** by `scripts/gen-commands.mjs` from `evnx commands --json`. Do not edit by hand: run the script. If the installed evnx is another version, its `evnx <command> --help` and `evnx commands --json` win over this file.

Build features: `backup`, `cloud`, `migrate`, `net`. A build without `cloud`, `migrate` or `backup` (a plain `cargo install evnx`) lacks those commands; `evnx commands` says what a build has. Hidden flags and commands are left out.

## On every command

`-v/--verbose`, `-q/--quiet`, `--no-color`, `-h/--help`, `-V/--version`. `network`: `local` reads files only; `local-with-network` has modes that reach GitHub, Vercel or the release list; `account` needs an evnx account and a connection.

## Exit codes

| Code | Id | Meaning |
|---|---|---|
| 0 | `ok` | Ran, nothing to report |
| 1 | `findings` | Ran, and found something: findings, problems, a difference, not in sync |
| 2 | `error` | Could not run: usage, config, I/O, or refused before any change |
| 4 | `declined` | Declined: answered no, or a confirmation was needed with no terminal and no --yes |
| 5 | `restored_aside` | restore wrote the result aside, to <output>.restored |
| 10 | `not_signed_in` | Not signed in, or the token was rejected |
| 11 | `forbidden` | Forbidden, or the email is not verified |
| 12 | `plan_limit` | The plan's limit is reached |
| 13 | `unreachable` | Server unreachable, not an evnx server, or TLS roots unusable |
| 14 | `conflict` | Conflict, or locked |
| 15 | `server_error` | Server error, or rate limited |
| 141 | `broken_pipe` | Output closed early (broken pipe) |

Each command below lists the codes it can return (141, a closed pipe, applies to all). `run` and `cloud run` return the command's own code once it has started.

## Local files

### `evnx init`

Interactive project setup — the template, .env and the .evnx.toml contract

- Flags: `--blueprint <ID>`, `--with <LIST>`, `--list-components`, `--detect`, `--from-source`, `--force`, `--env-name <NAME>`, `--format pretty|json`, `--here`, `--no-contract`, `-C/--dir <DIR>`, `-y/--yes`, `-n/--dry-run`, `--json`
- Exit: 0, 2, 4
- Removed spellings (exit 2): `-p, --path` → `-C/--dir`
- Docs: https://docs.evnx.dev/cli/commands/init

### `evnx add [SUBCOMMAND]`

Add environment variables to existing .env files

- Flags: `--list`, `--env-name <NAME>`, `--example <FILE>`, `--no-template`, `-C/--dir <DIR>`, `-y/--yes`, `-n/--dry-run`, `--json`, `--format pretty|json`
- Exit: 0, 2, 4
- Removed spellings (exit 2): `-p, --path` → `-C/--dir`
- Docs: https://docs.evnx.dev/cli/commands/add

#### `evnx add service [SERVICE]` (alias `infra`)

Add variables for a service, infrastructure target or framework

- Flags: `--env-name <NAME>`, `--example <FILE>`, `--no-template`, `-C/--dir <DIR>`, `-y/--yes`, `-n/--dry-run`, `--json`, `--format pretty|json`
- Exit: 0, 2, 4
- Removed spellings (exit 2): `-p, --path` → `-C/--dir`

#### `evnx add framework [FRAMEWORK]`

Add variables for a framework

- Flags: `-l/--language <LANGUAGE>`, `--env-name <NAME>`, `--example <FILE>`, `--no-template`, `-C/--dir <DIR>`, `-y/--yes`, `-n/--dry-run`, `--json`, `--format pretty|json`
- Exit: 0, 2, 4
- Removed spellings (exit 2): `-p, --path` → `-C/--dir`

#### `evnx add blueprint [BLUEPRINT]`

Add variables from a stack blueprint (without overwriting existing)

- Flags: `--env-name <NAME>`, `--example <FILE>`, `--no-template`, `-C/--dir <DIR>`, `-y/--yes`, `-n/--dry-run`, `--json`, `--format pretty|json`
- Exit: 0, 2, 4
- Removed spellings (exit 2): `-p, --path` → `-C/--dir`

#### `evnx add custom [NAME[=VALUE]...]`

Add your own variables: as arguments, or one prompt at a time

- Flags: `--desc <DESC>`, `--category <CATEGORY>`, `--required`, `--optional`, `--from-file <PATH|->`, `--base64`, `--keep-trailing-newline`, `--env-name <NAME>`, `--example <FILE>`, `--no-template`, `-C/--dir <DIR>`, `-y/--yes`, `-n/--dry-run`, `--json`, `--format pretty|json`
- Exit: 0, 2, 4
- Removed spellings (exit 2): `-p, --path` → `-C/--dir`

#### `evnx add import <FILE|->`

Add many variables from one file: .env, .properties, INI, JSON, YAML, CSV or web.config

- Flags: `--from env|properties|ini|json|yaml|csv|web-config`, `--section <NAME>`, `--only <GLOB>`, `--exclude <GLOB>`, `--env-name <NAME>`, `--example <FILE>`, `--no-template`, `-C/--dir <DIR>`, `-y/--yes`, `-n/--dry-run`, `--json`, `--format pretty|json`
- Exit: 0, 2, 4

### `evnx remove <NAME...>` (alias `rm`)

Remove variables from the env file, and the template and contract too

- Flags: `-C/--dir <DIR>`, `-y/--yes`, `--format pretty|json`, `--env-name <NAME>`, `--template`, `--contract`, `--all`, `--ignore-missing`, `--no-backup`, `--allow-dangling`, `--all-names`, `--check`, `-n/--dry-run`, `--json`
- Exit: 0, 1, 2, 4
- Removed spellings (exit 2): `-p, --path` → `-C/--dir`
- Docs: https://docs.evnx.dev/cli/commands/remove

### `evnx set [NAME[=VALUE]]`

Set one variable in the env file, in place

- Flags: `--env <FILE>`, `--env-name <NAME>`, `-C/--dir <DIR>`, `--if-missing`, `--fill`, `--only <GLOB>`, `--base64`, `--keep-trailing-newline`, `-y/--yes`, `--format pretty|json`, `-n/--dry-run`, `--json`, `--from-file <PATH|->`
- Exit: 0, 2, 4
- Docs: https://docs.evnx.dev/cli/commands/set

### `evnx get <NAME>`

Print one variable's value, without sourcing the file

- Flags: `--env <FILE>`, `--env-name <NAME>`, `-C/--dir <DIR>`, `--exists`, `--reveal`, `--format pretty|json`, `--json`
- Exit: 0, 1, 2, 4
- Docs: https://docs.evnx.dev/cli/commands/get

### `evnx validate`

Check .env against .env.example, find issues

- Flags: `--env-name <NAME>`, `--input-format dotenv|json`, `--strict`, `--fix`, `--rotate-weak-secrets`, `--json`, `--exit-zero`, `--ignore <IGNORE>`, `--no-formats`, `--fail-on error|warning`, `--env <FILE>`, `--example <FILE>`, `--format pretty|json|github`, `-n/--dry-run`, `-y/--yes`
- Exit: 0, 1, 2
- Removed spellings (exit 2): `--format text` → `--format pretty`, `--format github-actions` → `--format github`
- Docs: https://docs.evnx.dev/cli/commands/validate

### `evnx scan [PATH...] [SUBCOMMAND]`

Detect secrets that look real (AWS keys, tokens, etc.)

- Flags: `--exclude <EXCLUDE>`, `--max-file-size <SIZE>`, `--extensions <EXT>`, `--pattern <REGEX>`, `--ignore-placeholders`, `--no-ignore-placeholders`, `--severity critical|high|medium|low`, `--rules <FILE>`, `--baseline <FILE>`, `--update-baseline`, `--reason <CODE>`, `--confidence high|medium|low`, `--exit-zero`, `--include-ignored`, `--staged`, `--history <RANGE>`, `--full`, `--no-config`, `--include-dir <NAME>`, `--follow-symlinks`, `--policy <FILE>`, `--strict`, `--exit-only`, `--format pretty|json|sarif|github`, `--json`
- Exit: 0, 1, 2
- Removed spellings (exit 2): `--format text` → `--format pretty`, `--format github-actions` → `--format github`
- Docs: https://docs.evnx.dev/cli/commands/scan

#### `evnx scan rules <SUBCOMMAND>`

Your own scan rules: list, create and test them

- Exit: 0, 1, 2, 4

#### `evnx scan rules list`

Every rule a scan here would use: evnx's own, `.evnx/rules/`, your personal rules and `[[scan.patterns]]`, with id, source, severity and confidence, grouped by category with each rule's provider

- Flags: `--category <NAME>`, `--format pretty|json`, `--json`
- Exit: 0, 2

#### `evnx scan rules new <ID>`

Write a rule file to fill in: `.evnx/rules/<ID>.toml`, committed so the team shares it

- Flags: `--personal`
- Exit: 0, 2

#### `evnx scan rules test [FILE]`

Check each rule against its own `positive` and `near_miss` values, and report every failure. Exit 1 if any fails

- Exit: 0, 1, 2

#### `evnx scan rules add <SOURCE>`

Add a rule pack: a catalogue name, an https URL, or a path

- Flags: `--from evnx|gitleaks`, `--personal`
- Exit: 0, 2
- Removed spellings (exit 2): `--format` → `--from`

#### `evnx scan rules update [NAME]`

Fetch added packs again, show the rules added and removed, and ask before replacing each

- Flags: `--personal`, `-y/--yes`
- Exit: 0, 2, 4

#### `evnx scan rules remove <NAME>`

Remove an added pack and its lock entry

- Flags: `--personal`
- Exit: 0, 2

#### `evnx scan hook <SUBCOMMAND>`

A git `pre-commit` hook that runs `evnx scan --staged`, or a `pre-push` hook that scans the commits being pushed

- Exit: 0, 2

#### `evnx scan hook install`

Add the evnx block to this repository's `pre-commit` hook

- Flags: `--pre-push`
- Exit: 0, 2

#### `evnx scan hook uninstall`

Remove the evnx block, and nothing else, from the `pre-commit` hook

- Flags: `--pre-push`
- Exit: 0, 2

#### `evnx scan hook status`

Whether the hook is installed here, and whether it is turned off

- Flags: `--pre-push`
- Exit: 0, 2

### `evnx diff [A] [B]`

Compare two env files: keys missing or extra, and values between environments

- Flags: `--env-name <NAME>`, `--against <NAME>`, `--values`, `--show-values`, `--json`, `--reverse`, `--ignore-keys <KEYS>`, `--fail-on missing|extra|different`, `--skip-without-env`, `--with-stats`, `-i/--interactive`, `--env <FILE>`, `--example <FILE>`, `--format pretty|json|patch`
- Exit: 0, 1, 2
- Docs: https://docs.evnx.dev/cli/commands/diff

### `evnx sync`

Keep .env and .env.example in sync

- Flags: `--env-name <NAME>`, `--direction forward|reverse`, `--to example|env`, `-n/--dry-run`, `--check`, `--json`, `--skip-without-env`, `--template-config <PATH>`, `--prune`, `--naming-policy warn|error|ignore`, `--env <FILE>`, `--example <FILE>`, `--format pretty|json`, `-y/--yes`
- Exit: 0, 1, 2, 4
- Removed spellings (exit 2): `-f, --force` → `--yes`, `--placeholder` → `--yes`
- Docs: https://docs.evnx.dev/cli/commands/sync

### `evnx align`

Give .env files the template's sections, comments and key order, keeping their values

- Flags: `--example <FILE>`, `--env <FILE>`, `--env-name <NAME>`, `-n/--dry-run`, `--check`, `--format pretty|json`, `--json`, `--no-backup`
- Exit: 0, 1, 2
- Docs: https://docs.evnx.dev/cli/commands/align

### `evnx doctor [PATH]`

Check .env files, Git config, project structure, and security

- Flags: `--fix`, `--all`, `--strict`, `--skip-without-env`, `-C/--dir <DIR>`, `--format pretty|json`, `--json`
- Exit: 0, 1, 2
- Removed spellings (exit 2): `--path` → `-C/--dir`, `--format text` → `--format pretty`
- Docs: https://docs.evnx.dev/cli/commands/doctor

### `evnx config <SUBCOMMAND>`

Show every effective setting and where it came from

- Exit: 0, 2
- Docs: https://docs.evnx.dev/cli/commands/config

#### `evnx config show`

Print each setting with the value in force and its source

- Flags: `--format pretty|json`, `--json`
- Exit: 0, 2

## Convert and run

### `evnx convert`

Transform `.env` files into multiple output formats

- Flags: `--env-name <NAME>`, `--from dotenv|json`, `--to json|yaml|shell|dotenv|aws-secrets|gcp-secrets|azure-keyvault|github|docker-compose|kubernetes|terraform|doppler|heroku|vercel|railway`, `-o/--output <FILE>`, `--force`, `--gitignore`, `--no-gitignore`, `--include <PATTERN>`, `--exclude <PATTERN>`, `--only secrets|public`, `--allow-empty`, `--allow-collisions`, `--base64`, `--prefix <PREFIX>`, `--transform <MODE>`, `--project <PROJECT>`, `--vault-name <NAME>`, `--heroku-app <APP>`, `--name <NAME>`, `--namespace <NAMESPACE>`, `--kind secret|configmap|split`, `--terraform-declarations`, `--env <FILE>`, `-y/--yes`, `-n/--dry-run`
- Exit: 0, 2
- Removed spellings (exit 2): `--to github-actions` → `--to github`, `--to gh-actions` → `--to github`
- Docs: https://docs.evnx.dev/cli/commands/convert

### `evnx migrate`

Move a .env into a secret manager: print the commands, or upload to GitHub

- Flags: `--from env-file|environment`, `--to github|aws-secrets-manager|doppler|infisical|gcp-secret-manager|azure-keyvault|vercel|heroku|railway`, `--print-only`, `-o/--output <FILE>`, `--force`, `--gitignore`, `--no-gitignore`, `--skip-existing`, `--overwrite`, `--include <INCLUDE>`, `--exclude <EXCLUDE>`, `--strip-prefix <STRIP_PREFIX>`, `--add-prefix <ADD_PREFIX>`, `--allow-collisions`, `--repo <REPO>`, `--secret-name <SECRET_NAME>`, `--aws-profile <AWS_PROFILE>`, `--project <PROJECT>`, `--doppler-config <DOPPLER_CONFIG>`, `--infisical-env <INFISICAL_ENV>`, `--vault-name <VAULT_NAME>`, `--heroku-app <HEROKU_APP>`, `--vercel-project <VERCEL_PROJECT>`, `--railway-project <RAILWAY_PROJECT>`, `--railway-environment <RAILWAY_ENVIRONMENT>`, `--railway-service <RAILWAY_SERVICE>`, `--env <FILE>`, `--env-name <NAME>`, `-n/--dry-run`, `-y/--yes`
- Exit: 0, 1, 2, 4
- Network: local-with-network
- Removed spellings (exit 2): `--source-file` → `--env`, `--to github-actions` → `--to github`, `--from env` → `--from env-file`
- Docs: https://docs.evnx.dev/cli/commands/migrate

### `evnx template [INPUT] [OUTPUT]`

Generate config files from templates

- Flags: `--input <FILE>`, `--output <FILE>`, `--force`, `--follow-symlinks`, `--mode <MODE>`, `--mkdir`, `--env-name <NAME>`, `--gitignore`, `--no-gitignore`, `--allow-unresolved`, `--strict`, `--env <FILE>`, `-n/--dry-run`, `-y/--yes`
- Exit: 0, 2
- Docs: https://docs.evnx.dev/cli/commands/template

### `evnx backup [ENV]`

Create encrypted backup of .env

- Flags: `--env-name <NAME>`, `--output <OUTPUT>`, `--key-file <PATH>`, `--keep <N>`, `--verify`, `--gitignore`, `--no-gitignore`
- Exit: 0, 2
- Docs: https://docs.evnx.dev/cli/commands/backup

### `evnx restore <BACKUP>`

Restore from encrypted backup

- Flags: `--output <OUTPUT>`, `--show-values`, `-y/--yes`, `--gitignore`, `--no-gitignore`, `-n/--dry-run`, `--inspect`, `--key-file <PATH>`
- Exit: 0, 2, 4, 5
- Removed spellings (exit 2): `--force` → `--yes`
- Docs: https://docs.evnx.dev/cli/commands/restore

### `evnx spec <SUBCOMMAND>`

Declare what each variable is: required, format, secret

- Exit: 0, 1, 2
- Docs: https://docs.evnx.dev/cli/commands/spec

#### `evnx spec init`

Generate a first contract from this project, or from named components

- Flags: `--with <WITH>`, `--stdout`, `--merge`, `--env <FILE>`, `--env-name <NAME>`, `--example <FILE>`
- Exit: 0, 2

#### `evnx spec check`

Check the contract against `.env.example`, and `.env` when there is one. Read-only; suited to a pre-commit hook and to CI

- Flags: `--format pretty|json`, `--skip-without-env`, `--env <FILE>`, `--example <FILE>`, `--env-name <NAME>`, `--json`
- Exit: 0, 1, 2

### `evnx history`

List the copies evnx kept before changing a file: which file, which command, when

- Flags: `--format pretty|json`, `--json`
- Exit: 0, 2
- Docs: https://docs.evnx.dev/cli/commands/history

### `evnx undo [FILE]`

Put a file back as it was before evnx last changed it

- Flags: `-y/--yes`, `-n/--dry-run`, `--clear`
- Exit: 0, 2, 4
- Docs: https://docs.evnx.dev/cli/commands/undo

### `evnx parse`

List what evnx reads from a `.env`: line, key and flags, never a value

- Flags: `--env <ENV>`, `--env-name <NAME>`, `--format pretty|json`, `--json`, `--values`, `--show-values`
- Exit: 0, 1, 2
- Removed spellings (exit 2): `--format text` → `--format pretty`, `-y, --yes` → `--show-values`
- Docs: https://docs.evnx.dev/cli/commands/parse

### `evnx run [OPTIONS] [-- <COMMAND>...]`

Run a command with a `.env`'s variables in its environment

- Flags: `--env <ENV>`, `--env-name <NAME>`, `--include <GLOB>`, `--exclude <GLOB>`, `--allow-unsafe-names`, `--mask`, `--no-mask`, `--prefer vault|env`
- Exit: 0, 2; then the command's own code (128+n if signal n killed it)
- Docs: https://docs.evnx.dev/cli/commands/run

## Cloud

### `evnx auth <SUBCOMMAND>`

Manage your evnx cloud account

- Flags: `--server <URL>`
- Exit: 0, 2, 4, 10, 11, 12, 13, 14, 15
- Network: account
- Docs: https://docs.evnx.dev/cli/commands/auth

#### `evnx auth register`

Create an evnx cloud account

- Flags: `--email <EMAIL>`, `--password-stdin`, `--server <URL>`
- Exit: 0, 2, 10, 11, 12, 13, 14, 15
- Network: account

#### `evnx auth login`

Sign in to evnx cloud

- Flags: `--email <EMAIL>`, `--password-stdin`, `--server <URL>`
- Exit: 0, 2, 10, 11, 12, 13, 14, 15
- Network: account

#### `evnx auth logout`

Sign out of evnx cloud

- Flags: `--server <URL>`
- Exit: 0, 2, 10, 11, 12, 13, 14, 15
- Network: account

#### `evnx auth resend-verification`

Send the email-verification link again

- Flags: `--server <URL>`
- Exit: 0, 2, 10, 11, 12, 13, 14, 15
- Network: account

#### `evnx auth key-bundle`

Print the CI key bundle: your sealed key material, for EVNX_KEY_BUNDLE

- Flags: `--json`, `-o/--output <FILE>`, `--force`, `--format pretty|json`, `--server <URL>`
- Exit: 0, 2, 10, 11, 12, 13, 14, 15
- Network: account
- Removed spellings (exit 2): `--format text` → `--format pretty`

#### `evnx auth token <SUBCOMMAND>`

Manage API tokens for CI/CD

- Flags: `--server <URL>`
- Exit: 0, 2, 4, 10, 11, 12, 13, 14, 15
- Network: account

#### `evnx auth token create <NAME>`

Mint a token. Shown once, then only revocable

- Flags: `--scope <SCOPE>`, `--vault <VAULT>`, `--all-vaults`, `--expires-in-days <DAYS>`, `--no-expiry`, `--no-key-bundle`, `--json`, `-o/--output <FILE>`, `--force`, `--format pretty|json`, `--server <URL>`
- Exit: 0, 2, 10, 11, 12, 13, 14, 15
- Network: account
- Removed spellings (exit 2): `--format text` → `--format pretty`

#### `evnx auth token list`

List the account's live tokens

- Flags: `--server <URL>`
- Exit: 0, 2, 10, 11, 12, 13, 14, 15
- Network: account

#### `evnx auth token revoke <TARGET>`

Revoke a token by name or id

- Flags: `-y/--yes`, `--server <URL>`
- Exit: 0, 2, 4, 10, 11, 12, 13, 14, 15
- Network: account

#### `evnx auth totp <SUBCOMMAND>`

Manage two-factor authentication

- Flags: `--server <URL>`
- Exit: 0, 2, 10, 11, 12, 13, 14, 15
- Network: account

#### `evnx auth totp enable`

Turn on two-factor authentication

- Flags: `--server <URL>`
- Exit: 0, 2, 10, 11, 12, 13, 14, 15
- Network: account

#### `evnx auth totp disable`

Turn two-factor authentication off

- Flags: `--server <URL>`
- Exit: 0, 2, 10, 11, 12, 13, 14, 15
- Network: account

#### `evnx auth totp recovery-codes`

Issue a fresh set of recovery codes, invalidating the old ones

- Flags: `--server <URL>`
- Exit: 0, 2, 10, 11, 12, 13, 14, 15
- Network: account

#### `evnx auth sessions <SUBCOMMAND>`

List and revoke active sessions

- Flags: `--server <URL>`
- Exit: 0, 2, 4, 10, 11, 12, 13, 14, 15
- Network: account

#### `evnx auth sessions list`

List active sessions

- Flags: `--format pretty|json`, `--json`, `--server <URL>`
- Exit: 0, 2, 10, 11, 12, 13, 14, 15
- Network: account

#### `evnx auth sessions revoke <TARGET>`

Revoke one session by id, or by the short form the listing shows

- Flags: `-y/--yes`, `--server <URL>`
- Exit: 0, 2, 4, 10, 11, 12, 13, 14, 15
- Network: account

#### `evnx auth sessions revoke-others`

Revoke every session except this one

- Flags: `-y/--yes`, `--server <URL>`
- Exit: 0, 2, 4, 10, 11, 12, 13, 14, 15
- Network: account

#### `evnx auth devices <SUBCOMMAND>`

Networks and browsers this account has signed in from

- Flags: `--server <URL>`
- Exit: 0, 2, 4, 10, 11, 12, 13, 14, 15
- Network: account

#### `evnx auth devices list`

List the networks and browsers this account has signed in from

- Flags: `--format pretty|json`, `--json`, `--server <URL>`
- Exit: 0, 2, 10, 11, 12, 13, 14, 15
- Network: account

#### `evnx auth devices disavow <DEVICE_ID>`

Report that a device was not you

- Flags: `-y/--yes`, `--server <URL>`
- Exit: 0, 2, 4, 10, 11, 12, 13, 14, 15
- Network: account

#### `evnx auth status`

Show your account as the server sees it

- Flags: `--check`, `--format pretty|json`, `--json`, `--server <URL>`
- Exit: 0, 2, 10, 11, 12, 13, 14, 15
- Network: account

#### `evnx auth rotate-master-password`

Change your master password

- Flags: `--password-stdin`, `--compromised`, `-y/--yes`, `--server <URL>`
- Exit: 0, 2, 4, 10, 11, 12, 13, 14, 15
- Network: account

#### `evnx auth undo-password-change`

Undo a master password change, by proving the previous password

- Flags: `--email <EMAIL>`, `--password-stdin`, `--server <URL>`
- Exit: 0, 2, 10, 11, 12, 13, 14, 15
- Network: account

#### `evnx auth download-data`

Download everything the server holds about your account, as JSON

- Flags: `-o/--output <PATH>`, `--force`, `--server <URL>`
- Exit: 0, 2, 10, 11, 12, 13, 14, 15
- Network: account

#### `evnx auth delete-account`

Delete your account and everything only you can reach

- Flags: `--confirm-stdin`, `--server <URL>`
- Exit: 0, 2, 10, 11, 12, 13, 14, 15
- Network: account

### `evnx org <SUBCOMMAND>`

Manage organisations — billing and a directory

- Flags: `--server <URL>`
- Exit: 0, 2, 4, 10, 11, 12, 13, 14, 15
- Network: account
- Docs: https://docs.evnx.dev/cli/commands/org

#### `evnx org create <NAME>`

Create an organisation. You become its owner

- Flags: `--slug <SLUG>`, `--server <URL>`
- Exit: 0, 2, 10, 11, 12, 13, 14, 15
- Network: account

#### `evnx org list`

List the organisations this account belongs to

- Flags: `--format pretty|json`, `--json`, `--server <URL>`
- Exit: 0, 2, 10, 11, 12, 13, 14, 15
- Network: account

#### `evnx org members`

Who is in an organisation, and who holds a seat

- Flags: `--org <SLUG>`, `--format pretty|json`, `--json`, `--server <URL>`
- Exit: 0, 2, 10, 11, 12, 13, 14, 15
- Network: account

#### `evnx org invite <EMAIL>`

Invite someone by email

- Flags: `--role <ROLE>`, `--org <SLUG>`, `--server <URL>`
- Exit: 0, 2, 10, 11, 12, 13, 14, 15
- Network: account

#### `evnx org invites`

Invitations sent but not yet redeemed

- Flags: `--org <SLUG>`, `--format pretty|json`, `--json`, `--server <URL>`
- Exit: 0, 2, 10, 11, 12, 13, 14, 15
- Network: account

#### `evnx org uninvite <INVITE_ID>`

Withdraw an invitation

- Flags: `--org <SLUG>`, `--server <URL>`
- Exit: 0, 2, 10, 11, 12, 13, 14, 15
- Network: account

#### `evnx org accept [TOKEN]`

Redeem an invitation token

- Flags: `--token-stdin`, `--server <URL>`
- Exit: 0, 2, 10, 11, 12, 13, 14, 15
- Network: account

#### `evnx org billing`

What this organisation is on, and until when

- Flags: `--org <SLUG>`, `--format pretty|json`, `--json`, `--server <URL>`
- Exit: 0, 2, 10, 11, 12, 13, 14, 15
- Network: account

#### `evnx org seats`

Show or set how many seats are purchased

- Flags: `--set <N>`, `--unlimited`, `-y/--yes`, `--org <SLUG>`, `--server <URL>`
- Exit: 0, 2, 4, 10, 11, 12, 13, 14, 15
- Network: account

#### `evnx org assign <WHO>`

Give someone a seat

- Flags: `--org <SLUG>`, `--server <URL>`
- Exit: 0, 2, 10, 11, 12, 13, 14, 15
- Network: account

#### `evnx org release <WHO>`

Take a seat back

- Flags: `--org <SLUG>`, `--server <URL>`
- Exit: 0, 2, 10, 11, 12, 13, 14, 15
- Network: account

#### `evnx org role <WHO>`

Change someone's role

- Flags: `--set <ROLE>`, `--org <SLUG>`, `--server <URL>`
- Exit: 0, 2, 10, 11, 12, 13, 14, 15
- Network: account

#### `evnx org remove <WHO>`

Remove someone from an organisation

- Flags: `-y/--yes`, `--org <SLUG>`, `--server <URL>`
- Exit: 0, 2, 4, 10, 11, 12, 13, 14, 15
- Network: account

#### `evnx org delete`

Delete an organisation

- Flags: `--force`, `-y/--yes`, `--org <SLUG>`, `--server <URL>`
- Exit: 0, 2, 4, 10, 11, 12, 13, 14, 15
- Network: account

#### `evnx org leave`

Leave an organisation

- Flags: `-y/--yes`, `--org <SLUG>`, `--server <URL>`
- Exit: 0, 2, 4, 10, 11, 12, 13, 14, 15
- Network: account

### `evnx vault <SUBCOMMAND>`

Manage encrypted vaults

- Flags: `--server <URL>`
- Exit: 0, 1, 2, 4, 10, 11, 12, 13, 14, 15
- Network: account
- Docs: https://docs.evnx.dev/cli/commands/vault

#### `evnx vault create <NAME>`

Create a vault

- Flags: `--environment <ENVIRONMENT>`, `--password-stdin`, `--server <URL>`
- Exit: 0, 2, 10, 11, 12, 13, 14, 15
- Network: account
- Removed spellings (exit 2): `-e, --env` → `--environment`

#### `evnx vault list`

List the vaults you can reach

- Flags: `--format pretty|json`, `--json`, `--server <URL>`
- Exit: 0, 2, 10, 11, 12, 13, 14, 15
- Network: account

#### `evnx vault delete <TARGET>`

Delete a vault and every version in it

- Flags: `-y/--yes`, `--server <URL>`
- Exit: 0, 2, 4, 10, 11, 12, 13, 14, 15
- Network: account

#### `evnx vault share <TARGET>`

Share a vault with another evnx account

- Flags: `--with <WITH>`, `--role <ROLE>`, `--password-stdin`, `--server <URL>`
- Exit: 0, 2, 10, 11, 12, 13, 14, 15
- Network: account

#### `evnx vault members <TARGET>`

List who can reach a vault

- Flags: `--format pretty|json`, `--json`, `--server <URL>`
- Exit: 0, 2, 10, 11, 12, 13, 14, 15
- Network: account

#### `evnx vault role <TARGET>`

Change a member's role

- Flags: `--user <USER>`, `--role <ROLE>`, `--server <URL>`
- Exit: 0, 2, 10, 11, 12, 13, 14, 15
- Network: account

#### `evnx vault revoke [TARGET]`

Revoke a member's access, rotating the vault key

- Flags: `--all-vaults`, `--user <USER>`, `-y/--yes`, `--no-rekey`, `--password-stdin`, `-n/--dry-run`, `--format pretty|json`, `--json`, `--server <URL>`
- Exit: 0, 1, 2, 4, 10, 11, 12, 13, 14, 15
- Network: account

#### `evnx vault rekey <TARGET>`

Rotate a vault's key without removing anyone

- Flags: `-y/--yes`, `--password-stdin`, `--server <URL>`
- Exit: 0, 2, 4, 10, 11, 12, 13, 14, 15
- Network: account

#### `evnx vault leave <TARGET>`

Leave a vault that was shared with you

- Flags: `-y/--yes`, `--server <URL>`
- Exit: 0, 2, 4, 10, 11, 12, 13, 14, 15
- Network: account

### `evnx cloud <SUBCOMMAND>`

Sync encrypted .env files with evnx cloud.

- Flags: `--server <URL>`
- Exit: 0, 1, 2, 4, 10, 11, 12, 13, 14, 15; then the command's own code (128+n if signal n killed it)
- Network: account
- Docs: https://docs.evnx.dev/cli/commands/cloud

#### `evnx cloud push`

Encrypt a .env and upload it as a new version

- Flags: `--vault <VAULT>`, `--env <FILE>`, `--env-name <NAME>`, `--password-stdin`, `-y/--yes`, `--server <URL>`
- Exit: 0, 2, 4, 10, 11, 12, 13, 14, 15
- Network: account
- Removed spellings (exit 2): `-f, --file` → `--env`

#### `evnx cloud pull`

Download a version and decrypt it

- Flags: `--vault <VAULT>`, `--allow-override`, `--env <FILE>`, `--env-name <NAME>`, `-y/--yes`, `--password-stdin`, `--gitignore`, `--no-gitignore`, `--server <URL>`
- Exit: 0, 2, 4, 10, 11, 12, 13, 14, 15
- Network: account
- Removed spellings (exit 2): `-f, --file` → `--env`, `--force` → `--yes`

#### `evnx cloud run [OPTIONS] [-- <COMMAND>...]`

Run a command with a vault's variables in its environment

- Flags: `--vault <VAULT>`, `--allow-override`, `--min-version <N>`, `--include <GLOB>`, `--exclude <GLOB>`, `--password-stdin`, `--allow-unsafe-names`, `--mask`, `--no-mask`, `--prefer vault|env`, `--server <URL>`
- Exit: 0, 2, 10, 11, 12, 13, 14, 15; then the command's own code (128+n if signal n killed it)
- Network: account

#### `evnx cloud history`

List a vault's versions, newest first

- Flags: `--vault <VAULT>`, `--limit <LIMIT>`, `--format pretty|json`, `--json`, `--server <URL>`
- Exit: 0, 2, 10, 11, 12, 13, 14, 15
- Network: account

#### `evnx cloud watch [OPTIONS] [-- <COMMAND>...]`

Watch a vault and report when someone pushes a new version

- Flags: `--vault <VAULT>`, `--interval <SECONDS>`, `--once`, `--include-mine`, `--on-change`, `--server <URL>`
- Exit: 0, 2, 10, 11, 12, 13, 14, 15
- Network: account

#### `evnx cloud diff`

What changed between two versions — key names only, never values

- Flags: `--vault <VAULT>`, `--from <N>`, `--to <N>`, `--local`, `--env <FILE>`, `--env-name <NAME>`, `--password-stdin`, `--format pretty|json`, `--json`, `--server <URL>`
- Exit: 0, 1, 2, 10, 11, 12, 13, 14, 15
- Network: account
- Removed spellings (exit 2): `-f, --file` → `--env`

#### `evnx cloud audit`

Who did what to a vault, newest first

- Flags: `--vault <VAULT>`, `--last <WINDOW>`, `--event <TYPE>`, `--format pretty|json`, `--json`, `--server <URL>`
- Exit: 0, 2, 10, 11, 12, 13, 14, 15
- Network: account

#### `evnx cloud delete-version [VERSION]`

Delete one version of a vault, and its encrypted blob

- Flags: `--latest`, `--vault <VAULT>`, `-y/--yes`, `--server <URL>`
- Exit: 0, 2, 4, 10, 11, 12, 13, 14, 15
- Network: account

#### `evnx cloud link <VAULT>`

Bind this directory to a vault, so push and pull need no --vault

- Flags: `--env <FILE>`, `--server <URL>`
- Exit: 0, 2, 10, 11, 12, 13, 14, 15
- Network: account
- Removed spellings (exit 2): `-f, --file` → `--env`

#### `evnx cloud unlink`

Remove this directory's vault binding

- Flags: `--server <URL>`
- Exit: 0, 2
- Network: account

#### `evnx cloud export`

Write a vault's secrets to a directory, decrypted — the way out

- Flags: `--vault <VAULT>`, `-o/--output <DIR>`, `--all-versions`, `--to json|yaml|shell|dotenv|aws-secrets|gcp-secrets|azure-keyvault|github|docker-compose|kubernetes|terraform|doppler|heroku|vercel|railway`, `--project <PROJECT>`, `--vault-name <NAME>`, `--heroku-app <APP>`, `--name <NAME>`, `--namespace <NAMESPACE>`, `--allow-collisions`, `--force`, `--password-stdin`, `--server <URL>`
- Exit: 0, 2, 10, 11, 12, 13, 14, 15
- Network: account
- Removed spellings (exit 2): `--to github-actions` → `--to github`, `--to gh-actions` → `--to github`

#### `evnx cloud status`

Show whether this machine is set up for cloud sync

- Flags: `--ping`, `--check`, `--format pretty|json`, `--json`, `--server <URL>`
- Exit: 0, 2, 10, 11, 12, 13, 14, 15
- Network: account

### `evnx platform <SUBCOMMAND>`

Compare or sync .env with a hosting platform's variables (Vercel).

- Exit: 0, 1, 2, 4, 10, 11, 13, 14, 15
- Network: local-with-network
- Docs: https://docs.evnx.dev/cli/commands/platform

#### `evnx platform diff`

Show what differs between a local .env and a Vercel environment

- Flags: `--to vercel`, `--project <ID>`, `--team <ID>`, `--token-file <PATH>`, `--target <ENV>`, `--git-branch <BRANCH>`, `--env <FILE>`, `--format pretty|json`, `--json`, `--strict`
- Exit: 0, 1, 2, 10, 11, 13, 15
- Network: local-with-network
- Removed spellings (exit 2): `--env-name` → `--target`, `-f, --file` → `--env`

#### `evnx platform pull`

Write Vercel's readable values into the local file

- Flags: `--to vercel`, `--project <ID>`, `--team <ID>`, `--token-file <PATH>`, `--target <ENV>`, `--git-branch <BRANCH>`, `--env <FILE>`, `--gitignore`, `--no-gitignore`, `-y/--yes`, `-n/--dry-run`
- Exit: 0, 2, 4, 10, 11, 13, 15
- Network: local-with-network
- Removed spellings (exit 2): `--env-name` → `--target`, `-f, --file` → `--env`

#### `evnx platform push`

Create and update Vercel variables from the local file

- Flags: `--to vercel`, `--project <ID>`, `--team <ID>`, `--token-file <PATH>`, `--target <ENV>`, `--git-branch <BRANCH>`, `--env <FILE>`, `--only-new`, `--prune`, `--prune-all`, `--type config|secret`, `--format pretty|json`, `--json`, `--gitignore`, `--no-gitignore`, `-y/--yes`, `-n/--dry-run`
- Exit: 0, 1, 2, 4, 10, 11, 13, 14, 15
- Network: local-with-network
- Removed spellings (exit 2): `--env-name` → `--target`, `-f, --file` → `--env`

## This tool

### `evnx commands` (alias `surface`)

Every command this build has, and which features it was compiled with

- Flags: `--compact`, `--format pretty|json`, `--json`
- Exit: 0, 2
- Docs: https://docs.evnx.dev/cli/commands/commands

### `evnx completions <SHELL>`

Generate shell completions

- Exit: 0, 2
- Docs: https://docs.evnx.dev/cli/commands/completions

### `evnx update`

Show how to upgrade, and optionally whether a newer release exists

- Flags: `--check`, `--list`, `--format pretty|json`, `--json`
- Exit: 0, 1, 2
- Network: local-with-network
- Docs: https://docs.evnx.dev/cli/commands/update
