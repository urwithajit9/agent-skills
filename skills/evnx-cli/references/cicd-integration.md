# evnx in CI/CD

**Written against evnx 0.16.0 - confirm flags with `evnx <cmd> --help`.** Sources: the evnx
README and `.pre-commit-hooks.yaml` at https://github.com/urwithajit9/evnx (tag `v0.16.0`),
https://docs.evnx.dev. The evnx-action inputs below come from the action's `action.yml` and were
not re-checked against this release; read its README before relying on one.

## Principles

- **A CI runner has no `.env`.** Values come from the platform's secret store. CI checks the
  committed files: scan the repository and its new commits, compare `.env.example` with the
  contract, and keep any `.env` out of the tree.
- **Pin the CLI version** so a release cannot change a gate overnight. Upgrade on purpose and
  read the CHANGELOG first: new scan rules add findings (0.16.0 also decodes encoded values).
- **Exit codes decide the build.** 0 pass, 1 findings, 2 evnx could not run, 4 a confirmation
  with no `--yes`. Do not add `--exit-zero` to a gate; it is for advisory steps (a scan that
  could not run still exits 2).
- **No prompts in CI.** Pass explicit flags, `--yes` where a command would ask, and `--json`
  when a later step reads the result (check `run.version` in it).
- **Do not use `--skip-without-env` in CI.** It is for hooks on a fresh clone; in CI a check that
  never ran must not pass.
- Never echo secret values into logs. Avoid `--show-values`, `--values` and `get --reveal`.

## The usual gates

```bash
evnx scan --severity high                         # block on high and critical findings
evnx scan --no-config --severity high             # same, ignoring the repo's .evnx.toml
evnx scan --history origin/main..HEAD             # every file version the branch's commits add
evnx spec check                                   # .env.example vs the [vars] contract; needs no .env
evnx validate --strict --format github            # needs a .env (or --env FILE)
evnx diff --fail-on missing                       # .env lacks a key the template has (needs a .env)
evnx sync --check --direction forward             # .env.example lacks a name .env has (needs a .env)
evnx doctor --strict --json                       # setup checks; needs an env file in the tree
```

- `validate`, `diff`, `sync` and `doctor` compare against a local `.env`; on a runner with only
  the committed files, run `scan` and `spec check` there and the others in a hook.
- `scan --history` needs the history: check out with `fetch-depth: 0`. On a pull request use the
  base branch as the range start.
- A team-wide floor the repository cannot lower: keep a policy file outside the repository (or in
  a path the PR cannot change) and pass `--policy FILE` or `EVNX_POLICY`. See
  [scan.md](scan.md).
- For an existing repository with accepted findings: `evnx scan --update-baseline --reason
  fix-later` once, review and commit `.evnx/baseline.json` (fingerprints, no values); later runs
  fail only on new findings.

## GitHub Actions: install the pinned CLI

```yaml
- uses: actions/checkout@v4
  with:
    fetch-depth: 0                         # for scan --history
- name: Install evnx
  env:
    EVNX_VERSION: "0.16.0"
    EVNX_INSTALL_DIR: ${{ github.workspace }}/.evnx-bin
    GH_TOKEN: ${{ github.token }}          # lets the installer check build provenance with gh
  run: |
    curl -fsSL https://evnx.dev/install.sh | bash
    echo "$EVNX_INSTALL_DIR" >> "$GITHUB_PATH"
- name: Scan
  run: evnx scan --severity high --format github
```

The install script verifies the archive's SHA-256 (and, with a signed-in `gh`, its provenance)
before installing. Release archives are built with every feature.

## GitHub Actions: evnx-action

```yaml
- uses: urwithajit9/evnx-action@v1
  with:
    command: scan
    format: github          # inline PR annotations
    version: v0.16.0        # pin the CLI
```

| Input | Meaning | Default |
|---|---|---|
| `command` | `scan`, `validate`, `diff`, `doctor`, `convert`, `sync` | `scan` |
| `path` | Directory or file | `.` |
| `format` | Passed as `--format`. `scan`: pretty, json, sarif, github. `validate`: pretty, json, github | empty |
| `strict` | `--strict` (validate) | `false` |
| `exit_zero` | Report but always exit 0 | `false` |
| `env_file`, `example_file` | `--env` / `--example` | `.env`, `.env.example` |
| `convert_to`, `convert_output` | `--to` / `--output` for `convert` | `json`, empty |
| `version` | **evnx CLI version** to install | `latest` |

Outputs: `findings`, `result` (stdout), `exit_code`. `@v1` pins the action; `version:` pins the
CLI; one does not pin the other. With CLI 0.15.0 and later, `format: github-actions` is refused
(use `github`), and a `--path` passed to `doctor` exits 2 (the flag is now `-C/--dir`). If a
mode fails that way, or you need `--severity`, `--confidence`, `--baseline`, `--policy` or
`--history`, call the CLI in a `run:` step; the action leaves `evnx` on `PATH`.

## SARIF to the Security tab

`--format sarif` prints SARIF 2.1.0 on stdout with the stable rule id as `ruleId`; allowed and
baseline findings are listed as suppressed results with the reason as justification.

```yaml
jobs:
  scan:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      security-events: write      # needed for the upload
    steps:
      - uses: actions/checkout@v4
      # install the pinned evnx as above
      - name: Scan (SARIF)
        run: evnx scan --format sarif --exit-zero > evnx.sarif
      - uses: github/codeql-action/upload-sarif@v4
        if: always()
        with:
          sarif_file: evnx.sarif
      - name: Gate
        run: evnx scan --severity high
```

Fork pull requests get a read-only token and cannot upload SARIF.

## pre-commit and prek

Hooks come from the evnx repository's `.pre-commit-hooks.yaml` and work with
[pre-commit](https://pre-commit.com) and [prek](https://github.com/j178/prek):

```yaml
repos:
  - repo: https://github.com/urwithajit9/evnx
    rev: v0.16.0
    hooks:
      - id: evnx-scan-installed
      - id: evnx-spec-check
      - id: evnx-scan-push
```

| Hook id | Stage | Runs | Notes |
|---|---|---|---|
| `evnx-scan` | pre-commit | `evnx scan` on the staged paths | builds evnx from source (`language: rust`), version from `rev:` |
| `evnx-scan-installed` | pre-commit | `evnx scan` on the staged paths | uses the `evnx` on `PATH`; fails if evnx is not installed |
| `evnx-validate` | pre-commit | `evnx validate --strict` | when `.env` files change |
| `evnx-diff` | pre-commit | `evnx diff --fail-on missing --skip-without-env` | blocks when `.env` lacks a template key |
| `evnx-sync` | pre-commit | `evnx sync --check --direction forward --skip-without-env` | blocks when `.env` has names the template lacks |
| `evnx-sync-fix` | pre-commit | `evnx sync --yes --skip-without-env` | writes placeholders to the template; stage it and commit again |
| `evnx-doctor` | pre-commit | `evnx doctor --skip-without-env` | fails on errors, not warnings |
| `evnx-spec-check` | pre-commit | `evnx spec check` | when `.evnx.toml` or `.env*` change; needs no `.env` |
| `evnx-scan-push` | pre-push | `evnx scan --history` from `PRE_COMMIT_FROM_REF` to `PRE_COMMIT_TO_REF` (a new branch: what no remote has) | skip once with `SKIP=evnx-scan-push git push` |

`evnx scan hook status` reports a hook run through pre-commit or prek, with its `rev`, and says
when that rev is older than the installed evnx.

Without a hook framework: `evnx scan hook install` (pre-commit, `scan --staged`) and
`evnx scan hook install --pre-push` (the commits being pushed). They refuse a hook that
pre-commit or prek manages. `EVNX_SCAN_BYPASS="<reason>" git push` passes the evnx pre-push hook
once, logged in `.git/evnx/bypass.log`. Ask the user before any bypass.

## Other CI systems

Same gates. Install the pinned version from the channel the runner has:

```bash
curl -fsSL https://evnx.dev/install.sh | EVNX_VERSION=0.16.0 bash
npm install -g @evnx/cli@0.16.0
pip install evnx==0.16.0
```

Use `--json` for machines and `--format github` only on GitHub. GitLab's `reports: sast:` takes
GitLab's own schema, not SARIF or evnx JSON: keep `evnx scan --json > scan.json` as a plain
artifact.

## evnx cloud in CI

Create a token for one vault (`evnx auth token create ci --vault myapp/production`), and store
three CI secrets: `EVNX_TOKEN`, `EVNX_KEY_BUNDLE` (printed with the token, or by
`evnx auth key-bundle`) and `EVNX_MASTER_PASSWORD`. A token does not decrypt on its own. Then
`evnx cloud run --vault myapp/production -- ./deploy.sh`. Exit codes 10 to 15: see
[cloud.md](cloud.md); retry only 13 and 15.
