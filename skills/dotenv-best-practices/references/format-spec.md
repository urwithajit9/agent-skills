# .env format notes

Reference: [dotenv.space](https://dotenv.space)

There is no single `.env` standard. The common core is small and portable; everything else
depends on the loader (python-dotenv, dotenvy, Node's `dotenv`, Docker Compose, a framework's
own loader, evnx, ...). When behaviour matters, check the docs of the loader you actually use,
or test it with a one-line example. This page separates the portable subset from the parts
where tools differ.

## Portable subset

A file is lines; each line is blank, a `#` comment, or an assignment.

```env
# comment
KEY=value
QUOTED="value with spaces"
LITERAL='no $expansion or \escapes here'
```

- One assignment per line, no spaces around `=`.
- Quote values that contain spaces, `#`, or leading/trailing whitespace.
- Use UTF-8 and LF line endings. CRLF can leave a stray `\r` at the end of values in some
  parsers.
- Everything is a string; the file has no types, arrays or objects.

## Key (variable name) characters

- **Portable**: letters, digits and `_`, not starting with a digit (`[A-Za-z_][A-Za-z0-9_]*`),
  by convention `UPPER_SNAKE_CASE`. These names work in every shell, container runtime and
  CI system.
- **Tool-dependent**: `.`, `-`, `[`, `]`, a leading digit or non-ASCII letters. Docker Compose
  reads names such as `spring.datasource.url` or `my-key`, and evnx reads them since v0.13.0, but
  a POSIX shell cannot `export` them, and many deployment targets reject them. If a variable
  must travel through a shell, a CI system or a secret manager, keep to the portable set.
- Spaces, quotes, `$`, `@`, `+`, `/` and braces in names are not valid anywhere useful.

```env
DATABASE_URL=...        # portable
_INTERNAL_FLAG=...      # portable
spring.datasource.url=  # works in Compose; not exportable from a shell
1_THING=...             # leading digit: avoid
DATABASE URL=...        # space: invalid
```

## Quoting

| Form | Typical behaviour | Differs by tool |
|---|---|---|
| Bare `KEY=value` | Value runs to end of line, or to ` #` as an inline comment | Whether surrounding whitespace is trimmed; whether inline comments are recognised |
| Double quotes | Escapes such as `\n` and `\"` are interpreted; expansion usually applies | Which escapes exist; whether `$VAR` expands |
| Single quotes | Literal text: no escapes, no expansion | Rarely differs; the safest way to keep a `$` |

```env
GREETING="Hello, World!"
PATH_WITH_SPACE="C:\\Program Files\\MyApp"
REGEX_PATTERN='^\d{4}-\d{2}-\d{2}$'
PRICE='$100.00'
PASSWORD="p@ss#word"      # quote anything containing # or spaces
BASE64_KEY=abc123==       # everything after the first = is the value
```

## Variable expansion (the part tools disagree on)

Expansion means a value that refers to another variable:

```env
BASE_URL=http://localhost:8000
API_URL=${BASE_URL}/api
```

Questions the loader answers differently:

1. **Does it expand at all?** Some loaders do by default (python-dotenv, Docker Compose), some
   need an add-on or option (Node's `dotenv` core needs `dotenv-expand`), some depend on a
   flag. Check the loader.
2. **Which value does `${VAR}` see?** Docker Compose, and evnx since v0.13.0, expand **top to
   bottom**: a reference reads the value assigned above it, and a reference to a variable
   assigned further down is an error or stays unexpanded. Other loaders may read the last value
   in the file, the process environment first, or something else. The same file can therefore
   mean different things in two tools.
3. **Defaults and syntax**: `${VAR:-default}`, `$VAR` without braces, escaping with `\$` or
   single quotes.
4. **Real environment vs file**: whether an already-set OS variable wins over the file (usually
   yes; see `override` options).

Portable practice: define a variable before any line that uses it, use braces, avoid relying
on defaults or forward references, and single-quote values that should keep a literal `$`
(passwords and tokens containing `$` are a classic source of silent corruption).

## Constructs that are NOT portable

```env
# Arrays / JSON as values: just strings to the loader
CORS_ALLOWED=["https://example.com"]

# Multi-line values: loader-specific
CERT="-----BEGIN CERTIFICATE-----
...
-----END CERTIFICATE-----"

# export prefix: shell syntax; some loaders accept it, some do not
export SECRET_KEY=myvalue
```

Workarounds: comma-separated strings for lists; base64 for JSON or certificates (decode in
code); `\n` escapes inside double quotes where the loader interprets them; or a secrets manager
for structured data. Test the loader if you rely on any of these.

## Conventions

```env
# --- Application ---
APP_NAME=MyApp
APP_ENV=development
SECRET_KEY=CHANGE_ME
DEBUG=false

# --- Database ---
DATABASE_URL=postgresql://user:pass@localhost:5432/mydb

# --- External APIs (source: provider dashboard) ---
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
```

- Group related variables with comments; keep one casing style.
- Say where each secret comes from in `.env.example`.
- Keep `.env.example` complete: every name the app reads, placeholder values only.

## File permissions

`.env` should be readable by its owner only:

```bash
chmod 600 .env
```

`evnx doctor` checks file modes and whether git would commit an env file, and `evnx doctor --fix`
repairs them; check `evnx doctor --help` for the installed version's behaviour.

## Checking what a tool actually reads

When a value is wrong, look at what the loader parsed instead of reading the file by eye. With
evnx: `evnx parse` lists each line, key and flags (empty, placeholder, secret) and never prints
values; `evnx validate` reports expansion-order problems. Without evnx, print the variable names
the process sees (not the values), for example with `env | cut -d= -f1`.
