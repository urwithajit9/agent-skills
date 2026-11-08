# .env Debugging Guide — 10 Common Bugs

Source: [dotenv.space](https://dotenv.space). Examples are Python, JavaScript and Rust; the
causes apply to any stack. Never print a variable's value while debugging; check that it is
set, its length, or its name.

---

## Bug 1: Variable is undefined / None everywhere

**Symptoms:** `os.getenv("MY_VAR")` returns `None`. `process.env.MY_VAR` is `undefined`. App crashes at startup.

**Cause A — Wrong load order (Python)**
`load_dotenv()` was called after importing a module that already read the variable.

```python
# ❌ Wrong — os.getenv() in settings.py runs before load_dotenv()
from myapp import settings  # reads env vars at import time
from dotenv import load_dotenv
load_dotenv()

# ✅ Correct — load_dotenv() is the very first thing
from dotenv import load_dotenv
load_dotenv()
from myapp import settings
```

**Cause B — Wrong path**
The working directory is not where `.env` lives.

```python
# ✅ Always resolve relative to the current file, not CWD
from dotenv import load_dotenv
from pathlib import Path
load_dotenv(dotenv_path=Path(__file__).resolve().parent / ".env")
```

**Cause C — OS env var taking precedence**
A real OS environment variable with the same name exists. By default, `load_dotenv` does not override existing env vars.

```python
load_dotenv(override=True)  # force .env values over OS env
```

**Cause D - Expansion order**
`B=${A}/x` is empty or literal when `A` is defined *below* it, or when the loader does not
expand at all. Loaders differ (Docker Compose and evnx v0.13.0+ read the value above the
reference; others do not expand without an add-on). Define `A` first, and test with the
loader you ship with. With evnx, `evnx validate` stops with an error naming the line to move.

---

## Bug 2: NEXT_PUBLIC_ variable is undefined in production

**Symptoms:** Works in dev (`next dev`), undefined after deployment.

**Root Cause:** `NEXT_PUBLIC_` vars are inlined at **build time** (`next build`). If they're not present during the build, they're baked in as `undefined` — setting them on the server at runtime has no effect.

```yaml
# ✅ GitHub Actions — pass to the build step explicitly
- name: Build Next.js
  env:
    NEXT_PUBLIC_API_URL: ${{ secrets.PRODUCTION_API_URL }}
    NEXT_PUBLIC_STRIPE_PK: ${{ secrets.STRIPE_PUBLISHABLE_KEY }}
  run: npm run build
```

---

## Bug 3: Docker Compose "env_file not found" error

**Symptoms:** `docker compose up` fails with `env_file .env not found`.

**Root Cause:** Docker Compose resolves `env_file` paths relative to the **Compose file**, not where you ran the command.

```yaml
# docker-compose.yml — paths are relative to this file's location
services:
  api:
    env_file:
      - ./backend/.env     # ✅ relative to docker-compose.yml
```

Also: the file must exist before `docker compose up`. Create an empty one if needed:

```bash
touch backend/.env
cp backend/.env.example backend/.env
```

---

## Bug 4: Boolean env var behaves unexpectedly ("False" is truthy)

**Python:**
```python
# ❌ Wrong — "False" string is truthy
if os.getenv("DEBUG"):
    enable_debug_mode()

# ✅ Correct
DEBUG = os.getenv("DEBUG", "False").lower() in ("true", "1", "yes")
```

**JavaScript/TypeScript:**
```typescript
// ❌ Wrong
if (process.env.FEATURE_FLAG) { }  // "false" is truthy

// ✅ Correct
const FEATURE_FLAG = process.env.FEATURE_FLAG === "true";
```

**Django:**
```env
# ❌ This is the string "False" — Django-environ parses it correctly
# but plain os.getenv does NOT
DEBUG=False
```
Use `django-environ`'s `env.bool("DEBUG")` or parse explicitly.

---

## Bug 5: Secrets appear in Sentry or error logs

**Symptoms:** Sentry events include API keys, database passwords, or the full settings dict.

**Fix:**
```python
# Pydantic — use SecretStr
from pydantic import SecretStr
class Settings(BaseSettings):
    stripe_key: SecretStr  # shows as ***** in logs and tracebacks

# Sentry — disable PII capture
import sentry_sdk
sentry_sdk.init(dsn=..., send_default_pii=False)

# Django — never log settings.SECRET_KEY
# Never do: logger.info(f"Settings: {vars(settings)}")
```

```rust
// Rust — use secrecy::SecretString
use secrecy::SecretString;
struct Config {
    stripe_key: SecretString,  // zeroized on drop, hidden in Debug output
}
```

---

## Bug 6: Vite — import.meta.env.VITE_X is undefined

**Cause A:** Variable name doesn't start with `VITE_`. Vite strips all others from the client bundle.

**Cause B:** You modified `.env` while the Vite dev server was running. Vite requires a **full server restart** — not just HMR — to pick up new env vars.

```bash
# After any .env change:
# Stop the dev server → restart it
# Ctrl+C, then: npm run dev
```

**Type safety:**
```typescript
// src/vite-env.d.ts
interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_STRIPE_PK: string
}
interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

---

## Bug 7: GitHub Actions — secret shows as *** but app still fails

**Symptoms:** The secret is masked in logs but the deployment or test still fails due to wrong credentials.

**Debugging steps:**
```yaml
# Check length to verify it's not empty without exposing the value
- name: Debug secret
  run: echo "Length ${#MY_SECRET}"
  env:
    MY_SECRET: ${{ secrets.MY_SECRET }}
```

**Common causes:**
- Secret name mismatch: `secrets.MY_SECRET` vs actual GitHub secret name (case-sensitive)
- Secret stored under a specific Environment but the job doesn't have `environment:` set
- Trailing whitespace in the stored value (GitHub trims some, not all)
- Secret has wrong value — update it in Settings → Secrets and variables → Actions

---

## Bug 8: Works locally, fails in production (ALLOWED_HOSTS / DB host)

**Django:**
```env
# ❌ Local — localhost doesn't work in production
ALLOWED_HOSTS=localhost,127.0.0.1

# ✅ Production
ALLOWED_HOSTS=myapp.com,www.myapp.com

# ❌ Docker — localhost means the container itself
DATABASE_URL=postgresql://user:pass@localhost:5432/mydb

# ✅ Docker Compose — use the service name
DATABASE_URL=postgresql://user:pass@db:5432/mydb
```

**FastAPI/Uvicorn:**
```bash
# ❌ Doesn't bind to external interface
HOST=localhost

# ✅ Accepts connections from outside the container
HOST=0.0.0.0
```

---

## Bug 9: Rust — parse panic on env var with whitespace or wrong type

**Symptoms:** `called Result::unwrap() on an Err value: ParseIntError`

**Root Cause:** A trailing space, newline, or wrong value type in the env var.

```rust
// ❌ Panics if PORT has trailing whitespace
let port: u16 = std::env::var("PORT").unwrap().parse().unwrap();

// ✅ Trim and provide a useful error message
let port: u16 = std::env::var("PORT")
    .unwrap_or_else(|_| "8000".to_string())
    .trim()
    .parse()
    .expect("PORT must be a valid u16 integer");
```

---

## Bug 10: Teammate added a new variable — app breaks silently

**Symptoms:** Works on your machine, fails for others after a `git pull`. The new variable is in `.env.example` but missing from teammates' `.env`.

**Fix — Add CI validation:**

```python
# scripts/check_env.py
import sys

def keys(filename):
    result = set()
    try:
        with open(filename) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    result.add(line.split("=", 1)[0].strip())
    except FileNotFoundError:
        print(f"❌ {filename} not found")
        sys.exit(1)
    return result

missing = keys(".env.example") - keys(".env")
if missing:
    print(f"❌ Variables in .env.example but missing from .env: {missing}")
    sys.exit(1)

print("✅ .env is complete")
```

Or with evnx (check `evnx diff --help` for your version):
```bash
# names missing from .env or extra vs .env.example; values are not compared to a template
evnx diff
# as a gate: fail only when .env lacks a key the template has
evnx diff --fail-on missing
```

**Fix — Standardize onboarding:**
```bash
# In your README or Makefile
cp .env.example .env
# Then fill in real values from the team password manager
```