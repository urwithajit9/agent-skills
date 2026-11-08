# evnx in CI/CD

**Written against evnx 0.13.0 and `urwithajit9/evnx-action` v1 - confirm flags with
`evnx <cmd> --help` and action inputs in the action's README / `action.yml`.**
Sources: https://github.com/urwithajit9/evnx-action, `.pre-commit-hooks.yaml` in
https://github.com/urwithajit9/evnx, https://docs.evnx.dev.

## Principles

- **A CI runner has no `.env`.** Values come from the platform's secret store. CI checks the
  committed files: scan the repo, compare `.env.example` with the contract, and keep any `.env`
  out of the tree.
- **Pin the CLI version** in CI so a new release cannot change a gate overnight; upgrade
  deliberately and read the CHANGELOG (`scan` gates especially: new rules add findings).
- **Exit codes decide the build.** 0 pass, 1 findings, 2 evnx could not run. Do not add
  `--exit-zero` to a gate; it makes the step pass even when findings exist (a scan that could
  not run still exits 2). Use it only for an advisory, non-blocking step.
- **No prompts in CI.** Pass explicit flags, `--yes` where a command would ask, and
  `--format json` when a later step reads the result.
- **Do not use `--skip-without-env` in CI.** It exists for pre-commit hooks on a fresh clone;
  in CI a check that never ran must not pass.
- Never echo secret values into logs. Avoid `--show-values` / `--values` in CI.

## The usual gates

```bash
evnx scan --severity high                 # block on high and critical findings
evnx validate --strict --format github-actions   # needs a .env or --env pointing at one
evnx diff --fail-on missing               # .env lacks a key the template has (needs a .env)
evnx sync --check --direction forward     # .env.example lacks a name .env has (needs a .env)
evnx spec check                           # .env.example vs the [vars] contract; needs no .env
evnx doctor --strict --format json        # needs an env file in the tree
```

`validate`, `diff`, `sync` and `doctor` compare against a local `.env`; on a runner that has only
the committed files, run `scan` and `spec check` there and run the others locally or in a hook.

`--severity high` is the usual blocking threshold. Before 0.13.0, `--severity` filtered on
confidence (there was no `--confidence`); on an older CLI read `evnx scan --help` before
choosing a gate.

For an existing repo with accepted findings: `evnx scan --update-baseline` once, review and
commit `.evnx/baseline.json` (fingerprints, no values); later runs fail only on new findings.

## GitHub Actions: evnx-action

```yaml
- uses: actions/checkout@v4
- uses: urwithajit9/evnx-action@v1
  with:
    command: scan
    format: github          # inline PR annotations
    version: v0.13.0        # pin the CLI (see below)
```

Inputs (from `action.yml`; check it for the current set):

| Input | Meaning | Default |
|---|---|---|
| `command` | `scan`, `validate`, `diff`, `doctor`, `convert`, `sync` | `scan` |
| `path` | Directory or file (positional path for `scan`, `--path` for `doctor`) | `.` |
| `format` | Passed as `--format`. `scan`: pretty, json, sarif, github. `validate`: pretty, json, github-actions. Empty means the command's own default | empty |
| `strict` | `--strict` (validate) | `false` |
| `exit_zero` | Report but always exit 0 | `false` |
| `env_file`, `example_file` | `--env` / `--example` for validate, diff, sync | `.env`, `.env.example` |
| `convert_to`, `convert_output` | `--to` / `--output` for `convert` | `json`, empty |
| `version` | **evnx CLI version** to install, e.g. `v0.13.0` or `0.13.0` | `latest` |

Outputs: `findings` (count), `result` (the command's stdout), `exit_code`.

Two version numbers: `uses: urwithajit9/evnx-action@v1` is the **action**; `with: version:` is
the **CLI**. Pinning one does not pin the other. The install verifies the release's `.sha256`
before running the binary. Linux runners (x86_64, aarch64) only.

Limits of the action: it has no `--severity`, `--confidence` or `--baseline` input, and for
`diff` it forces JSON and fails on missing or extra keys only (a template's empty values are
not drift). For those controls, call the CLI directly. The action leaves `evnx` on `PATH`, so
later `run:` steps can use it:

```yaml
- uses: urwithajit9/evnx-action@v1       # installs evnx (pinned); the scan itself is advisory here
  with:
    command: scan
    exit_zero: "true"
    version: v0.13.0
- name: Gate on high severity
  run: evnx scan --severity high
```

## SARIF to the Security tab

`--format sarif` prints SARIF 2.1.0 on stdout. Findings carry the stable rule id as `ruleId`
and `severity`/`confidence` in `properties`. Write it to a file and upload with
`upload-sarif` v4:

```yaml
jobs:
  scan:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      security-events: write      # needed for the upload
    steps:
      - uses: actions/checkout@v4
      - uses: urwithajit9/evnx-action@v1
        with: { command: scan, exit_zero: "true", version: v0.13.0 }   # installs evnx on PATH
      - name: Scan (SARIF)
        run: evnx scan --format sarif --exit-zero > evnx.sarif
      - uses: github/codeql-action/upload-sarif@v4
        if: always()
        with:
          sarif_file: evnx.sarif
      - name: Gate
        run: evnx scan --severity high
```

The action does not write a SARIF file for you; its `result` output holds the text. The
redirect above is what produces `evnx.sarif`. Fork pull requests get a read-only token and
cannot upload SARIF.

## pre-commit and prek

Hooks are defined in the evnx repository's `.pre-commit-hooks.yaml` and work with both
[pre-commit](https://pre-commit.com) and [prek](https://github.com/j178/prek) through the same
`.pre-commit-config.yaml`:

```yaml
repos:
  - repo: https://github.com/urwithajit9/evnx
    rev: v0.13.0            # a release tag; `evnx-scan-installed` exists from v0.13.0
    hooks:
      - id: evnx-scan-installed
      - id: evnx-spec-check
```

| Hook id | Runs | Notes |
|---|---|---|
| `evnx-scan` | `evnx scan` on staged paths | builds evnx from source (`language: rust`), version pinned by `rev:` |
| `evnx-scan-installed` | `evnx scan` on staged paths | uses the `evnx` on `PATH` (`language: system`): no build, but the hook **fails** if evnx is not installed |
| `evnx-validate` | `evnx validate --strict` | runs when `.env*` files change |
| `evnx-diff` | `evnx diff --fail-on missing --skip-without-env` | blocks when `.env` lacks a template key |
| `evnx-sync` | `evnx sync --check --direction forward --skip-without-env` | blocks when `.env` has names the template lacks |
| `evnx-sync-fix` | `evnx sync --force --skip-without-env` | writes placeholders to the template; the commit stops once, stage and retry |
| `evnx-doctor` | `evnx doctor --skip-without-env` | fails on errors; warnings do not fail |
| `evnx-spec-check` | `evnx spec check` | runs when `.evnx.toml` or `.env*` change; needs no `.env` |
| `evnx-scan-push` | `evnx scan --format sarif` | pre-push stage |

Without pre-commit, `evnx scan hook install` writes a managed block into `.git/hooks/pre-commit`
(honours `core.hooksPath`) that runs `evnx scan --staged`. It blocks the commit when secrets are
staged, when the scan cannot run, and when evnx is not on `PATH`. It refuses to touch a hook
that pre-commit or prek generated; use `evnx-scan-installed` there. `evnx scan hook status`
shows state; `git config hooks.evnx-scan false` turns it off; `git commit --no-verify` skips it
once (tell the user before you do either).

## Other CI systems

Same gates, installed from your channel (`evnx update` prints the commands, e.g.
`npm install -g @evnx/cli@<version>`, `pip install evnx==<version>`,
`curl -fsSL https://dotenv.space/install.sh | bash`). Use `--format json` for machines and
`--format github` / `--format github-actions` only on GitHub.

evnx cloud in CI: create a vault-scoped token (`evnx auth token create <name> --scope <vault>`),
store it as the secret `EVNX_TOKEN`, and pass the master password with `--password-stdin` from
the CI secret store. A token does not decrypt on its own. Exit codes 10-15 distinguish "sign in
again" (10) from "forbidden" (11), plan limit (12), unreachable (13), conflict (14) and server
error or rate limit (15); retry only 13 and 15.
