# evnx convert - targets and rules

**Generated from evnx 0.13.0 - confirm with `evnx convert --help`.** The target list grows
between releases; the `--to` line of `evnx convert --help` is authoritative, and
`evnx commands --json` lists every flag. Docs: https://docs.evnx.dev/cli/commands/convert

## Handle the output as a secret

The output of `convert` holds every value from the `.env`. Preview on stdout only when the user
needs to see the shape (and never paste real values into chat). Write to a file with
`-o/--output`: evnx creates it with mode 0600, refuses to replace an existing file without
`--force`, never replaces the input, and offers to add the file to `.gitignore`
(`--gitignore` / `--no-gitignore` answer that without a prompt). `-q` is silent on success.

## Targets (0.13.0: 14)

| `--to` | What you get | Required flags |
|---|---|---|
| `json` | JSON object | |
| `yaml` (alias `yml`) | YAML mapping | |
| `shell` | `export` lines | |
| `docker-compose` (alias `compose`) | `environment:` list | |
| `kubernetes` (alias `k8s`) | `Secret` manifest; `stringData:` by default, base64 `data:` with `--base64` | `--name`; optional `--namespace` |
| `terraform` (alias `tf`) | `.tfvars`-style assignments (names lowercased) | |
| `github-actions` (alias `gh-actions`) | Text to paste into the GitHub web form | |
| `aws-secrets` | JSON for `aws secretsmanager create-secret` | |
| `gcp-secrets` | Shell script that creates or updates each secret | `--project` |
| `azure-keyvault` | Script using `az keyvault secret set` (secret read from a temp file, not argv) | `--vault-name` |
| `heroku` | Bash script of `heroku config:set` commands | `--heroku-app` |
| `vercel` (experimental) | JSON of `{key, value, type, target}` objects | |
| `railway` (experimental) | The flat JSON `--to json` prints (Railway documents no import for it) | |
| `doppler` (experimental) | JSON of `{computed, value}` objects (`doppler secrets upload` documents flat JSON instead) | |

A missing required flag exits 2 and names the flag; a name flag for a different target
(`--heroku-app` with `--to json`) is also an error. Experimental targets print a warning on stderr;
check their output against the vendor's tool before relying on it. Omit `--to` for an interactive picker
(needs a terminal; agents should always pass `--to`).

## Selecting and shaping variables

- `--include 'AWS_*,DB_*'` / `--exclude '*_LOCAL'`: globs on names (`*`, `?`; case-sensitive;
  exclude wins).
- `--only secrets` / `--only public`: split by the same classifier `scan` uses (name says
  secret, or value looks like one). Typical use: public values to a build system, secrets to a
  secret manager.
- `--prefix APP_`, `--transform uppercase|lowercase|camelCase|snake_case` (prefix is applied
  first).

## Rules that bite

- **Collisions are refused (exit 2).** Two names that become one in the output (`Api` and `API`
  under `uppercase`, or targets that fold case) name both and stop. `--allow-collisions` keeps
  the last value; use it only on purpose.
- **Empty result is exit 2.** An empty `.env`, or filters that match nothing. `--allow-empty`
  overrides.
- **Names a target cannot hold are refused by name** and nothing is written (since 0.13.0).
  Keys may contain `.`, `-`, `[`, `]`, a leading digit or non-ASCII letters in the `.env`, but:

  | Targets | Accept |
  |---|---|
  | `json`, `yaml`, `docker-compose`, `aws-secrets` | any of them |
  | `kubernetes` | `.` and `-` |
  | `terraform` | `-` |
  | `gcp-secrets`, `azure-keyvault` | `-` |
  | `shell`, `github-actions`, `vercel`, `heroku`, `doppler`, `railway` | letters, digits and `_` only |

  Fix by renaming the variable, or leave it out with `--exclude`. The `railway` row is not
  verified against a published rule.
- **GCP names are lowercased, with `_` written as `-`** (`DB_URL` becomes `db-url`). The same
  name is used by `convert --to gcp-secrets`, `migrate --to gcp-secret-manager` and
  `cloud export --to gcp-secrets` since 0.13.0. A project migrated with 0.12 or earlier has
  upper-case secrets; the new run creates lower-case ones beside them. Do not delete the old
  ones until the app reads the new names.
- **Vercel `sensitive`** (since 0.13.0): secret-looking variables are written with
  `"type": "sensitive"` and targets `production` and `preview` only, because Vercel rejects a
  Sensitive variable in `development`. evnx says on stderr how many it left out of development.
  Other variables stay `plain` for all three targets.
- **Case-insensitive targets** (Azure Key Vault, GitHub) also report collisions on case.
- `terraform` lowercases names. `kubernetes` writes `stringData:` (Kubernetes encodes it on
  apply); add `--base64` only if you want base64 `data:`.

## Examples (real, with fake values)

```bash
evnx convert --to json --include 'DB_*' --exclude '*_LOCAL'
evnx convert --to kubernetes --name myapp-env --namespace prod -o k8s-secret.yaml
evnx convert --to gcp-secrets --project my-gcp-project -o upload.sh   # read it, then run it
evnx convert --env-name production --only secrets --to github-actions
```

For moving secrets into a manager, prefer `evnx migrate --to <target> --print-only` (prints the
vendor commands to review first); see `evnx migrate --help` for targets and required flags.
