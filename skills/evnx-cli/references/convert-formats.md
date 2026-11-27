# evnx convert - targets and rules

**Written against evnx 0.16.0 - confirm with `evnx convert --help`.** The target list grows
between releases; the `--to` line of `evnx convert --help` is authoritative, and
`evnx commands --json` lists every flag. Docs: https://docs.evnx.dev/cli/commands/convert

`convert` writes a file or prints one; `migrate` talks to a provider (or prints the provider's
commands). To move secrets into a manager, prefer `evnx migrate --to <target> --dry-run`, then
`--print-only` or `-o FILE` to review the commands first.

## Handle the output as a secret

The output holds every value from the `.env`. Preview on stdout only when the user needs to see
the shape, and never paste real values into chat. Write to a file with `-o/--output`: evnx
creates it with mode 0600, refuses to replace an existing file without `--force`, never replaces
the input, and asks to add the file to `.gitignore` (`--gitignore` / `--no-gitignore` /
`--yes` answer without a prompt; with no terminal it warns). `-n/--dry-run` with `-o` checks
everything and writes nothing. `-q` is silent on success.

## Input

`--env FILE` (default `.env`, or `[defaults] env_name`), `--env-name NAME`, `--env -` for stdin.
`--from json` reads a flat `{"KEY": "value"}` object (every value a string), so
`convert --to json` and `convert --from json --to dotenv` round-trip names, values and order.

## Targets (0.16.0: 15)

| `--to` | What you get | Required flags |
|---|---|---|
| `json` | JSON object | |
| `yaml` (alias `yml`) | YAML mapping, every value quoted | |
| `shell` | `export` lines | |
| `dotenv` (alias `env`) | A `.env` that evnx's parser reads back exactly | |
| `docker-compose` (alias `compose`) | `environment:` list | |
| `kubernetes` (alias `k8s`) | `Secret` with `stringData:`; `--base64` for `data:`; `--kind configmap` or `--kind split` (Secret for secrets, ConfigMap `<name>-config` for the rest) | `--name`; optional `--namespace` |
| `terraform` (alias `tf`) | `.tfvars` assignments, names as written; `--terraform-declarations` for `variable` blocks (secrets `sensitive = true`, no default) | |
| `github` | Text to paste into the GitHub web form | |
| `aws-secrets` | JSON for `aws secretsmanager create-secret` | |
| `gcp-secrets` | Shell script that creates or updates each secret | `--project` (6 to 30 lowercase letters, digits, `-`) |
| `azure-keyvault` | Script using `az keyvault secret set` | `--vault-name` |
| `heroku` | One `heroku config:set` call | `--heroku-app` (3 to 30 lowercase letters, digits, `-`) |
| `vercel` | JSON of `{key, value, type, target}`; secret-looking names `sensitive` | |
| `doppler` | Flat JSON for `doppler secrets upload` | |
| `railway` (experimental) | Flat JSON; Railway documents no schema | |

`--to github-actions` and `--to gh-actions` were removed in 0.15.0 (exit 2; use `--to github`).
A missing required flag exits 2 and names it; an invalid project or app name exits 2 before
anything is printed; a target flag for another target (`--heroku-app` with `--to json`) is an
error. The experimental target prints a warning on stderr. Omit `--to` only at a terminal (it
opens a picker); agents always pass `--to`.

## Selecting and shaping variables

- `--include 'AWS_*,DB_*'` / `--exclude '*_LOCAL'`: globs on names (`*`, `?`; case-sensitive;
  exclude wins).
- `--only secrets` / `--only public`: split by the classifier `scan` uses (the name or the value
  says secret). Typical use: public values to a build system, secrets to a secret manager.
- `--prefix APP_` (letters, digits, `_`), `--transform uppercase|lowercase|camelCase|snake_case`
  (prefix first).

## Rules that bite

- **Collisions are refused (exit 2).** Two names that become one (`Api` and `API` under
  `uppercase`, or a target that folds case or rewrites `_`) are named and nothing is written.
  `--allow-collisions` keeps the last value; use it only on purpose.
- **An empty result is exit 2** (an empty `.env`, or filters that match nothing). `--allow-empty`
  overrides.
- **Names a target cannot hold are refused by name**, and nothing is written:

  | Targets | Accept `.`, `-`, `[`, `]`, a leading digit, non-ASCII |
  |---|---|
  | `json`, `yaml`, `dotenv`, `docker-compose`, `aws-secrets` | all of them |
  | `kubernetes` | `.` and `-` |
  | `terraform`, `gcp-secrets`, `azure-keyvault` | `-` |
  | `shell`, `github`, `vercel`, `heroku`, `doppler`, `railway` | none: letters, digits and `_` only |

  Rename the variable, or leave it out with `--exclude`.
- **GCP names are lowercased, with `_` written as `-`** (`DB_URL` becomes `db-url`), the same in
  `migrate --to gcp-secret-manager` and `cloud export --to gcp-secrets`.
- **Vercel `sensitive`**: secret-looking variables get `"type": "sensitive"` in every target,
  development included; others stay `plain`.

## Examples (fake values)

```bash
evnx convert --to json --include 'DB_*' --exclude '*_LOCAL'
evnx convert --to kubernetes --name myapp-env --namespace prod --kind split -o k8s.yaml
evnx convert --to gcp-secrets --project my-gcp-project -o upload.sh   # read it, then run it
evnx convert --env-name production --only secrets --to github
evnx convert --from json --to dotenv --env vars.json -o .env.imported
```
