# .env Format Specification

Reference: [dotenv.space](https://dotenv.space)

## Grammar Rules

The `.env` format is intentionally simple. A file is a sequence of lines; each line is one of:

1. **A blank line** — ignored
2. **A comment** — starts with `#`, ignored entirely
3. **An assignment** — `KEY=VALUE` or `KEY="VALUE"` or `KEY='VALUE'`

```
# Formal grammar (simplified)
line       = blank | comment | assignment
blank      = *whitespace newline
comment    = "#" *any newline
assignment = KEY "=" value newline
KEY        = [A-Za-z_][A-Za-z0-9_]*
value      = bare-value | double-quoted | single-quoted
```

## Key Naming Rules

- Characters: `A-Z`, `a-z`, `0-9`, `_` (underscore)
- Must start with a letter or underscore — never a digit
- Convention: `UPPER_SNAKE_CASE` for all variables
- No spaces around `=`

```env
# ✅ Valid keys
DATABASE_URL=...
_INTERNAL_FLAG=...
REDIS_URL_1=...

# ❌ Invalid keys
1_THING=...          # starts with digit
DATABASE URL=...     # space in key
my-key=...           # hyphen not allowed
```

## Value Quoting Rules

### Bare values (no quotes)
Everything after `=` until end of line. Leading/trailing whitespace is **included** in some parsers and **stripped** in others — do not rely on either behavior. Always quote if whitespace matters.

```env
DATABASE_URL=postgresql://user:pass@localhost/mydb
DEBUG=True
PORT=8000
```

### Double-quoted values
Escape sequences are interpreted: `\n`, `\t`, `\\`, `\"`, `\$`.
Variable interpolation (`$VAR`) may or may not be expanded depending on the parser.

```env
GREETING="Hello, World!"
MULTILINE="line one\nline two"
PATH_WITH_SPACE="C:\\Program Files\\MyApp"
```

### Single-quoted values
Treated as literal strings. No escape sequences, no variable interpolation.

```env
REGEX_PATTERN='^\d{4}-\d{2}-\d{2}$'
LITERAL_DOLLAR='$100.00'
```

## What the Standard .env Format Does NOT Support

These constructs are **not** part of the core spec. Some parsers support them as extensions; most don't.

```env
# ❌ Arrays / JSON — NOT standard
CORS_ALLOWED=["https://example.com"]
CONFIG={"key": "value"}

# ❌ True multiline values — NOT standard
CERT="""
-----BEGIN CERTIFICATE-----
...
-----END CERTIFICATE-----
"""

# ❌ Variable interpolation — parser-dependent
BASE_URL=http://localhost
API_URL=${BASE_URL}/api    # works in some parsers only

# ❌ Export prefix — shell syntax, not .env syntax
export SECRET_KEY=myvalue
```

### Workarounds for Unsupported Constructs

```env
# Arrays → comma-separated strings
CORS_ALLOWED=https://example.com,https://admin.example.com

# JSON → base64-encode
CONFIG_JSON=eyJrZXkiOiJ2YWx1ZSJ9

# Multiline → single-line with \n escape (parser must support it)
CERT="-----BEGIN CERTIFICATE-----\nMIIBxxx...\n-----END CERTIFICATE-----"

# Or use a separate secrets manager for complex structured data
```

## Parser Compatibility Matrix

| Feature | python-dotenv | dotenvy (Rust) | dotenv (Node) | evnx |
|---|---|---|---|---|
| Bare values | ✅ | ✅ | ✅ | ✅ |
| Double-quoted | ✅ | ✅ | ✅ | ✅ |
| Single-quoted | ✅ | ✅ | ✅ | ✅ |
| `\n` in quotes | ✅ | ✅ | ✅ | ✅ |
| `$VAR` interpolation | ✅ (optional) | ❌ | ✅ | ❌ |
| Arrays `[...]` | ✅ (django-environ) | ❌ | ❌ | ❌ |
| `export KEY=` prefix | ✅ | ✅ | ✅ | ❌ |
| Inline comments `KEY=val # comment` | ✅ | ✅ | ✅ | ✅ |

## Encoding and Special Characters

- **Encoding**: UTF-8 is the universal expectation.
- **Line endings**: LF (`\n`) preferred; CRLF (`\r\n`) accepted by most parsers but can cause hidden bugs (the `\r` gets appended to the value).
- **Spaces in values**: Must be quoted — `NAME="John Doe"` not `NAME=John Doe`
- **`#` in values**: Must be quoted — `PASSWORD="p@ss#word"` not `PASSWORD=p@ss#word`
- **`=` in values**: Safe in quoted form; in bare values everything after the first `=` is the value including further `=` signs.

```env
# These are all equivalent:
BASE64_KEY=abc123==
BASE64_KEY="abc123=="
```

## File Structure Conventions

```env
# ─────────────────────────────────
# Application
# ─────────────────────────────────
APP_NAME=MyApp
APP_ENV=development
SECRET_KEY=CHANGE_ME
DEBUG=False
PORT=8000

# ─────────────────────────────────
# Database
# ─────────────────────────────────
DATABASE_URL=postgresql://user:pass@localhost:5432/mydb
DATABASE_POOL_SIZE=10
REDIS_URL=redis://localhost:6379/0

# ─────────────────────────────────
# External APIs
# ─────────────────────────────────
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
OPENAI_API_KEY=sk-proj-YOUR_KEY_HERE
```

Conventions:
- Group related variables with section comments
- Put non-secret config first, secrets last
- Use consistent casing throughout (all `UPPER_SNAKE_CASE`)
- Document the source of each secret in `.env.example` comments

## File Permissions

On Unix systems, `.env` files should be owner-read-only:

```bash
chmod 600 .env        # Owner can read/write, no one else
# Or at minimum:
chmod 640 .env        # Owner rw, group read, others none
```

`evnx doctor` checks this automatically.