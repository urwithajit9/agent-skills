---
name: dotenv-best-practices
description: >
  Use when working with .env files, environment variables, or secrets management.
  Triggers on tasks like: "set up .env", "manage environment variables", "create .env.example",
  "check if .env is in gitignore", "handle secrets in CI/CD", "configure environment for
  Django / FastAPI / Next.js / Vite / Rust / Docker", "what variables should go in .env",
  "should I commit this env file", ".env not loading", "variable is undefined", "boolean
  env var bug", "NEXT_PUBLIC prefix", "VITE_ prefix", "variable expansion in .env",
  "secrets in GitHub Actions", "environment variable best practices", or any mention of .env,
  dotenv, or secret leaks. Works with any stack and any tool - does not require evnx.
license: MIT
metadata:
  author: urwithajit9
  version: "2.0.0"
  homepage: https://dotenv.space
  repository: https://github.com/urwithajit9/agent-skills
---

# .env Best Practices

Tool-neutral guidance for `.env` files and environment-based configuration. Reference:
[dotenv.space](https://dotenv.space). If the `evnx` CLI is installed, it automates several of
these checks (`evnx validate`, `evnx scan --staged`, `evnx diff`, `evnx doctor`); use the
`evnx-cli` skill for that, and run `evnx --version` and `evnx <command> --help` before relying
on any flag.

## Core rules

1. **Never commit `.env`.** Add it to `.gitignore` before the first commit, not after.
2. **Always commit `.env.example`.** Keep every variable name and comment, with placeholder
   values only.
3. **Never print or paste secret values** into chats, logs, tickets or commit messages. Work
   with variable names; when you must show a value, mask it.
4. **Rotate immediately if exposed.** Deleting the file is not enough: git history keeps it.
   Revoke and reissue the key at the provider first, then purge history (`git filter-repo` or
   BFG) if needed. Bots scan public repositories continuously.
5. **Every env var is a string.** Parse booleans, numbers and lists explicitly in code.
6. **Fail fast.** Validate required variables at startup, not when first used.
7. **`.env` is for local development.** In CI and production, inject variables from the
   platform's secret store or a secrets manager.

## The file hierarchy

| File | Commit? | Purpose |
|---|---|---|
| `.env` | Never | Local real values |
| `.env.example` | Always | Template with placeholders: the team contract |
| `.env.local` | Never | Machine-specific overrides (Next.js / Vite convention) |
| `.env.development` | If no real secrets | Shared non-secret dev defaults |
| `.env.production` | Never | Managed by infra/CI; does not live in the repo |
| `.env.test` | If mock keys only | Test values with fake credentials |

Which files a framework loads, and in what order, is framework-specific. Check its docs.

## .gitignore

```gitignore
# env files - never commit
.env
.env.*
!.env.example
```

`.env.*` plus the `!.env.example` exception covers `.env.local`, `.env.production` and the rest
in three lines. If you do want to share `.env.development` or `.env.test`, add `!` lines for
them. Verify: `git check-ignore -v .env`.

## .env.example pattern

```env
# Application
APP_NAME=MyApp
SECRET_KEY=CHANGE_ME_generate_with_openssl_rand_hex_32
DEBUG=false
PORT=8000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# Third-party APIs - get keys from the provider dashboard
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
```

Placeholders must be obviously fake. A placeholder shaped like a real key can trigger secret
scanners, and a realistic-looking default can be mistaken for a working credential.

## Syntax and expansion in brief

The core format is `KEY=value` lines and `#` comments. Beyond that, parsers differ: quoting
rules, inline comments, `export` prefixes, multi-line values, and above all **variable
expansion** (`B=${A}/x`). Whether and how `${VAR}` expands, and whether it reads a value defined
above or below, depends on the tool. Docker Compose and (since v0.13.0) evnx read the value
assigned **above** the reference, top to bottom. Do not rely on a forward reference; define a
variable before using it, and quote values containing `$` that should stay literal (single
quotes in most parsers). Details and a portable subset: [references/format-spec.md](references/format-spec.md).

## Framework notes

- **Next.js**: `NEXT_PUBLIC_` variables are inlined into the browser bundle at **build** time
  (public). Others stay server-side. They must exist when `next build` runs.
- **Vite**: only `VITE_`-prefixed variables reach client code (`import.meta.env`). Restart the
  dev server after editing `.env`.
- **Django / Python**: use a loader (`django-environ`, `python-dotenv`, `pydantic-settings`);
  never put credentials in `settings.py`. `"False"` is a truthy string.
- **Rust**: `dotenvy` to load; trim before parsing; use `secrecy::SecretString` for secrets.
- **Docker / Compose**: use `env_file:` rather than inline `environment:` values for secrets;
  `env_file` paths are relative to the Compose file. `${VAR}` inside `compose.yaml` is
  interpolated from the project's `.env`, which is separate from what `env_file` passes to a
  container. Never `ENV SECRET=...` in a Dockerfile: it is stored in the image layers.

## The boolean trap

```python
# wrong: the string "false" is truthy
if os.getenv("DEBUG"):
    ...

# right
DEBUG = os.getenv("DEBUG", "false").lower() in ("true", "1", "yes")
```

```typescript
const debug = process.env.DEBUG === "true";   // "false" is a truthy string otherwise
```

## Startup validation

```python
required = ["SECRET_KEY", "DATABASE_URL"]
missing = [k for k in required if not os.getenv(k)]
if missing:
    raise RuntimeError(f"Missing required env vars: {missing}")
```

```typescript
for (const key of ["DATABASE_URL", "SECRET_KEY"] as const) {
  if (!process.env[key]) throw new Error(`Missing required env var: ${key}`);
}
```

## CI/CD: no .env files

Inject variables from the platform's secret store:

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    env:
      DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

Turn on your host's secret scanning / push protection where available, and add a
pre-commit scan of staged files. Never `echo` a secret in a job; masking is best effort.

## When to graduate from .env

Use a secrets manager for production: cloud-native (AWS Secrets Manager, GCP Secret Manager,
Azure Key Vault), HashiCorp Vault, or a SaaS/open-source manager (Doppler, Infisical, and
similar). Pick by where the workload runs and who needs access; check current pricing and
features on the vendor's site. Use separate values per environment, and rotate on a schedule.

## Further reference

- [references/format-spec.md](references/format-spec.md) - syntax, quoting, expansion, key names
- [references/security-checklist.md](references/security-checklist.md) - pre-project and pre-deploy checklist, incident steps
- [references/debugging.md](references/debugging.md) - 10 common bugs with fixes
- [dotenv.space](https://dotenv.space) - multi-stack reference
