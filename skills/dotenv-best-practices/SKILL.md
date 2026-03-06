---
name: dotenv-best-practices
description: >
  Use when working with .env files, environment variables, or secrets management.
  Triggers on tasks like: "set up .env", "manage environment variables", "create .env.example",
  "check if .env is in gitignore", "handle secrets in CI/CD", "configure environment for
  Django / FastAPI / Next.js / Vite / Rust / Docker", "what variables should go in .env",
  "should I commit this env file", ".env not loading", "variable is undefined", "boolean
  env var bug", "NEXT_PUBLIC prefix", "VITE_ prefix", "secrets in GitHub Actions",
  "environment variable best practices", or any mention of .env, dotenv, or secret leaks.
  Works with any stack and any tool — does not require evnx to be installed.
license: MIT
metadata:
  author: urwithajit9
  version: "1.0.0"
  homepage: https://dotenv.space
  repository: https://github.com/urwithajit9/agent-skills
---

# .env Best Practices

Reference: [dotenv.space](https://dotenv.space) — the complete `.env` guide for every stack.

## Core Rules (Never Break These)

1. **Never commit `.env`** — add it to `.gitignore` before the first commit, not after.
2. **Always commit `.env.example`** — strip real values, keep all variable names and comments.
3. **Rotate immediately if exposed** — deleting the file is not enough. Git history retains it. Use `git filter-repo` or BFG Repo Cleaner AND rotate every key.
4. **Bots scan GitHub continuously.** Exposed keys are found within minutes of a push.
5. **Every env var is a string.** Parse types explicitly in application code.

## The File Hierarchy

| File | Commit? | Purpose |
|---|---|---|
| `.env` | ❌ Never | Local real values — your actual secrets |
| `.env.example` | ✅ Always | Template with placeholder values — the team contract |
| `.env.local` | ❌ Never | Machine-specific overrides (Next.js / Vite convention) |
| `.env.development` | ✅ If no real secrets | Non-secret dev defaults shared by the team |
| `.env.production` | ❌ Never | Managed by infra/CI — never lives in the repo |
| `.env.test` | ✅ If mock keys only | CI test values using fake/mock credentials |

## The .gitignore Template

```gitignore
# .env files — never commit
.env
.env.local
.env.production
.env.staging
.env.*.local

# DO commit this — do not add to .gitignore:
# .env.example
```

## The .env.example Template Pattern

```env
# Application
APP_NAME=MyApp
SECRET_KEY=CHANGE_ME_generate_with_openssl_rand_hex_32
DEBUG=False
PORT=8000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
REDIS_URL=redis://localhost:6379/0

# Third-party APIs — get keys from the provider dashboard
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
OPENAI_API_KEY=sk-proj-YOUR_KEY_HERE
AWS_ACCESS_KEY_ID=YOUR_AWS_KEY_HERE
AWS_SECRET_ACCESS_KEY=YOUR_AWS_SECRET_HERE

# Feature flags
ENABLE_FEATURE_X=False
```

## Framework-Specific Rules

### Next.js
- `NEXT_PUBLIC_` prefix → inlined into browser bundle at **build time** (public, visible in DevTools)
- No prefix → server-only (never reaches the browser)
- Must exist at `next build` time, not just runtime. Pass to CI build step explicitly.

### Vite
- `VITE_` prefix → exposed to browser (`import.meta.env.VITE_X`)
- No prefix → build-scripts only, not bundled

### Django
- Use `django-environ` or `python-dotenv`; never put real credentials in `settings.py`
- `"False"` is a truthy string — always parse booleans explicitly

### Rust
- Use `dotenvy` for loading, `config` + `secrecy::SecretString` for type-safe production config
- Always `.trim()` before `.parse()` — trailing whitespace silently breaks type parsing

### Docker / Docker Compose
- Use `env_file:` in compose, not `environment:` with inline values
- Never `ENV SECRET_KEY=...` in Dockerfile — it's visible in every layer and `docker inspect`
- Docker Compose resolves `env_file` paths relative to the Compose file location, not the CWD

## The Boolean Trap (Extremely Common Bug)

```python
# ❌ WRONG — the string "False" is truthy in Python
if os.getenv("DEBUG"):
    ...

# ✅ CORRECT
DEBUG = os.getenv("DEBUG", "False").lower() in ("true", "1", "yes")
```

```rust
// ❌ WRONG
let debug = std::env::var("DEBUG").unwrap_or("false".to_string());

// ✅ CORRECT — trim and compare
let debug = std::env::var("DEBUG")
    .unwrap_or_default()
    .trim()
    .to_lowercase() == "true";
```

## Common Bugs Quick Reference

For detailed debugging patterns covering 10 frequent `.env` bugs (undefined variables, NEXT_PUBLIC in production, Docker path errors, boolean trap, Sentry leaks, Vite prefix, GitHub Actions masking, ALLOWED_HOSTS, Rust parse panics, silent teammate breakage), see [references/debugging.md](references/debugging.md).

## CI/CD — No .env Files Exist Here

In CI/CD pipelines, variables are injected from the platform's secret store. `.env` files should never be present.

```yaml
# GitHub Actions — correct pattern
jobs:
  deploy:
    runs-on: ubuntu-latest
    env:
      DATABASE_URL: ${{ secrets.DATABASE_URL }}
      SECRET_KEY: ${{ secrets.DJANGO_SECRET_KEY }}
```

**Enable GitHub Push Protection now:** Settings → Code security → Push protection. Blocks 100+ secret patterns automatically. Free, takes 30 seconds. Do it before you forget.

## Startup Validation — Fail Fast

Always validate required variables at startup, not at runtime when the missing variable is first used.

```python
# Python — validate at import time
def validate_env():
    required = ["SECRET_KEY", "DATABASE_URL", "STRIPE_SECRET_KEY"]
    missing = [k for k in required if not os.getenv(k)]
    if missing:
        raise RuntimeError(f"Missing required env vars: {missing}")

validate_env()
```

```typescript
// TypeScript / Node.js
const required = ["DATABASE_URL", "SECRET_KEY"] as const;
for (const key of required) {
  if (!process.env[key]) throw new Error(`Missing required env var: ${key}`);
}
```

## Secret Managers — When to Graduate from .env

`.env` is for local development. For production, use a secrets manager.

| Tool | Best For | Cost |
|---|---|---|
| AWS Secrets Manager | AWS workloads | ~$0.40/secret/mo |
| HashiCorp Vault | Multi-cloud, enterprise | Free self-hosted |
| Doppler | Multi-env teams, great DX | Free tier / $6+/mo |
| Infisical | Open-source Doppler alt | Free self-hosted |
| GCP Secret Manager | GCP workloads | $0.06/10k accesses |
| Azure Key Vault | Azure workloads | $0.03/10k ops |

## Using evnx for Automated Validation

If `evnx` is available, use it for automated validation and secret scanning:

```bash
# Install evnx (choose your preferred method)
cargo install evnx                    # Rust/Cargo
npm install -g @evnx/cli              # Node.js/npm
pip install evnx                      # Python/pip

# Run validation and secret scanning
evnx validate --strict
evnx scan
evnx diff                             # Compare .env with .env.example
```

See the `evnx-cli` skill for the complete command reference and CI/CD integration patterns.

## Further Reference

- [references/format-spec.md](references/format-spec.md) — `.env` format grammar and edge cases
- [references/security-checklist.md](references/security-checklist.md) — full pre-deploy checklist
- [references/debugging.md](references/debugging.md) — 10 common bugs with fixes
- [dotenv.space](https://dotenv.space) — complete multi-stack reference