# evnx Commands — Full Flag Reference

Source: [github.com/urwithajit9/evnx](https://github.com/urwithajit9/evnx)

## Global Flags

```
--version         Print version and exit
--help, -h        Print help for any command
--verbose, -v     Verbose output
--file <path>     Target .env file (default: .env)
```

---

## evnx init

Interactive project setup. Generates `.env.example` with sensible defaults.

```
evnx init [OPTIONS]

Options:
  --stack <STACK>       Project stack (python|nodejs|rust|go|php)
  --non-interactive     Use defaults without prompting
```

Supported stacks: `python`, `nodejs`, `rust`, `go`, `php`

Supported services (prompted interactively):
`postgresql`, `redis`, `mongodb`, `mysql`, `rabbitmq`, `elasticsearch`,
`aws-s3`, `stripe`, `sendgrid`, `openai`

---

## evnx add

Add a variable to `.env` interactively or from a preset.

```
evnx add [OPTIONS]

Options:
  --custom              Add a custom key=value pair
  --blueprint <NAME>    Add from a named blueprint template
  --service <SERVICE>   Add a full service preset (e.g. stripe, openai)
  --file <PATH>         Target file (default: .env)
```

---

## evnx validate

```
evnx validate [OPTIONS]

Options:
  --file <PATH>         Target .env file (default: .env)
  --strict              Exit non-zero on warnings, not just errors
  --format <FORMAT>     Output format: pretty|json|github-actions (default: pretty)
  --auto-fix            Attempt to auto-fix simple issues (experimental)

Exit codes:
  0   Valid (or only warnings without --strict)
  1   Errors found (or warnings with --strict)
```

What it checks:
- Missing required variable declarations
- Placeholder values: `YOUR_KEY_HERE`, `CHANGE_ME`, `TODO`, `FIXME`, `xxx`, `<YOUR_*>`
- Boolean string trap: `DEBUG="False"` set alongside Python/JS code that reads it as truthy
- Weak `SECRET_KEY`: shorter than 32 chars, common patterns like `django-insecure-*`
- `localhost` / `127.0.0.1` in URLs that look production-bound
- Suspicious port numbers
- Empty required variables (key present but value empty)

---

## evnx scan

```
evnx scan [OPTIONS]

Options:
  --path <DIR>          Directory to scan (default: current directory)
  --file <PATH>         Scan a specific file only
  --format <FORMAT>     Output format: pretty|json|sarif (default: pretty)
  --exit-zero           Always exit 0, even if secrets found (useful in CI reporting)
  --ignore-placeholders Skip obvious placeholder values in detection

Exit codes:
  0   No secrets found
  1   Secrets detected (unless --exit-zero)
```

Secret patterns detected:
| Type | Pattern |
|---|---|
| AWS Access Key | `AKIA[0-9A-Z]{16}` |
| Stripe Secret Key (live) | `sk_live_[0-9a-zA-Z]{24}` |
| Stripe Secret Key (test) | `sk_test_[0-9a-zA-Z]{24}` |
| GitHub PAT | `ghp_[0-9a-zA-Z]{36}` |
| GitHub Fine-grained Token | `github_pat_[0-9a-zA-Z_]{82}` |
| OpenAI API Key | `sk-proj-[0-9a-zA-Z-_]{48}` |
| Anthropic API Key | `sk-ant-[0-9a-zA-Z-_]{32,}` |
| RSA Private Key | `-----BEGIN RSA PRIVATE KEY-----` |
| EC Private Key | `-----BEGIN EC PRIVATE KEY-----` |
| OpenSSH Private Key | `-----BEGIN OPENSSH PRIVATE KEY-----` |
| High-entropy string | Shannon entropy > 4.5 in suspicious key context |
| Generic API key | Heuristic: key name contains `KEY`, `TOKEN`, `SECRET` with high-entropy value |

---

## evnx diff

```
evnx diff [OPTIONS]

Options:
  --file <PATH>         Source .env file (default: .env)
  --example <PATH>      Example file (default: .env.example)
  --show-values         Show actual values (redacted by default)
  --reverse             Swap source and target files
  --format <FORMAT>     Output format: pretty|json (default: pretty)

Exit codes:
  0   Files match (no missing or extra variables)
  1   Differences found
```

Output sections:
- **Missing in .env** — variables in `.env.example` but not in `.env`
- **Extra in .env** — variables in `.env` but not in `.env.example`
- **Value differences** — variables present in both but with different values (shown with `--show-values`)

---

## evnx convert

```
evnx convert [OPTIONS]

Required:
  --to <FORMAT>         Target format (see below)

Options:
  --file <PATH>         Source .env file (default: .env)
  --output <PATH>       Write to file instead of stdout
  --include <PATTERN>   Only include matching keys (glob pattern, comma-separated)
  --exclude <PATTERN>   Exclude matching keys (glob pattern, comma-separated)
  --prefix <PREFIX>     Add prefix to all output keys
  --transform <MODE>    Transform keys: uppercase|lowercase|none (default: none)
  --base64              Base64-encode all values

Supported formats:
  json               Generic JSON object
  yaml               Generic YAML
  shell              Shell export script (source-able)
  docker-compose     Docker Compose environment section
  kubernetes         Kubernetes Secret manifest (YAML)
  terraform          Terraform .tfvars format
  github-actions     GitHub Actions env block
  aws-secrets        AWS Secrets Manager JSON
  gcp-secrets        GCP Secret Manager gcloud commands
  azure-keyvault     Azure Key Vault az CLI commands
  heroku             Heroku config:set command
  vercel             Vercel env add commands
  railway            Railway JSON format
  doppler            Doppler JSON format
```

---

## evnx sync

```
evnx sync [OPTIONS]

Options:
  --direction <DIR>     forward (default) or reverse
  --file <PATH>         Source .env file (default: .env)
  --example <PATH>      Target .env.example file (default: .env.example)
  --placeholder         Replace values with placeholder text (default: true for forward)
  --force               Overwrite without prompting

Directions:
  forward    .env → .env.example (scrubs real values, documents variables)
  reverse    .env.example → .env (generates .env from template, useful in CI)
```

---

## evnx migrate *(requires `--features migrate`)*

```
evnx migrate [OPTIONS]

Options:
  --from <SOURCE>               Source type: env-file (default)
  --to <TARGET>                 Target: github-actions|aws-secrets-manager|doppler|infisical
  --file <PATH>                 Source .env file (default: .env)
  --dry-run                     Preview changes without writing
  --conflict <MODE>             How to handle existing secrets: skip|overwrite (default: skip)

GitHub Actions options:
  --repo <OWNER/REPO>           Target repository (required)
  --github-token <TOKEN>        GitHub PAT with secrets:write permission

AWS Secrets Manager options:
  --secret-name <NAME>          Secret name in AWS SM (required)
  --region <REGION>             AWS region (default: from AWS_DEFAULT_REGION env var)

Doppler options:
  --project <NAME>              Doppler project name (required)
  --config <NAME>               Doppler config/environment (default: dev)

Infisical options:
  --project <NAME>              Infisical project (required)
  --environment <ENV>           Infisical environment (default: dev)
```

---

## evnx doctor

```
evnx doctor [OPTIONS]

Options:
  --path <DIR>          Project directory to diagnose (default: current directory)

Checks performed:
  - .env exists
  - .env has secure permissions (600 or 640 on Unix)
  - .env is listed in .gitignore
  - .env.example exists
  - .env.example is tracked by Git
  - Project type detection (Python, Node.js, Rust, Docker)
  - If Python: python-dotenv or django-environ detected in requirements
  - If Node.js: dotenv in package.json
  - If Docker: .dockerignore includes .env
```

---

## evnx template

```
evnx template [OPTIONS]

Options:
  --input <PATH>        Template file path (required)
  --output <PATH>       Output file path (required)
  --env <PATH>          .env file to use for substitution (default: .env)

Template syntax:
  {{VAR_NAME}}          Simple substitution
  {{VAR_NAME|int}}      Cast to integer
  {{VAR_NAME|bool}}     Cast to boolean (true/false)
  {{VAR_NAME|upper}}    Uppercase the value
  {{VAR_NAME|lower}}    Lowercase the value
  {{VAR_NAME|base64}}   Base64-encode the value
```

---

## evnx backup *(requires `--features backup`)*

```
evnx backup <FILE> [OPTIONS]

Arguments:
  <FILE>                .env file to back up

Options:
  --output <PATH>       Output backup file path (default: <FILE>.backup)
  --password <PASS>     Encryption password (prompted interactively if not provided)

Encryption: AES-256-GCM with Argon2id key derivation
```

---

## evnx restore *(requires `--features backup`)*

```
evnx restore <BACKUP_FILE> [OPTIONS]

Arguments:
  <BACKUP_FILE>         Encrypted backup file

Options:
  --output <PATH>       Output .env file path (default: .env)
  --password <PASS>     Decryption password (prompted interactively if not provided)
```

---

## Configuration File: .evnx.toml

```toml
[defaults]
env_file = ".env"
example_file = ".env.example"
verbose = false

[validate]
strict = true
auto_fix = false
format = "pretty"

[scan]
ignore_placeholders = true
exclude_patterns = ["*.example", "*.sample", "*.template"]
format = "pretty"

[convert]
default_format = "json"
base64 = false

[aliases]
gh = "github-actions"
k8s = "kubernetes"
tf = "terraform"
```

With aliases configured, you can run `evnx convert --to k8s` instead of `evnx convert --to kubernetes`.