# .env Security Checklist

Full pre-project and pre-deploy checklist. Source: [dotenv.space](https://dotenv.space).

## Pre-Project Setup (Do This Once)

- [ ] Add `.env` to `.gitignore` **before the first commit**
- [ ] Create `.env.example` with all variable names and placeholder values
- [ ] Commit `.env.example` to the repository
- [ ] Set file permissions: `chmod 600 .env`
- [ ] Enable your host's push protection / secret scanning where available (on GitHub: Settings → Code security)
- [ ] Install a pre-commit hook for secret scanning

### Pre-commit secret scanning (recommended)

Scan what is being committed, not the whole working tree: your real, git-ignored `.env`
should never block a commit.

```yaml
# .pre-commit-config.yaml - evnx (needs evnx installed; see the evnx-cli skill)
repos:
  - repo: https://github.com/urwithajit9/evnx
    rev: v0.13.0          # use a release tag; `evnx scan hook install` is the no-framework option
    hooks:
      - id: evnx-scan-installed
```

Tool-neutral alternative:

```yaml
repos:
  - repo: https://github.com/Yelp/detect-secrets
    rev: v1.5.0           # pin to the current release
    hooks:
      - id: detect-secrets
        args: ['--baseline', '.secrets.baseline']
```

## Security Checklist

### Repository Security
- [ ] `.env` is in `.gitignore` — verify with `git check-ignore -v .env`
- [ ] `.env.example` is committed and up to date
- [ ] No secrets in Dockerfile `ENV` instructions
- [ ] No secrets in `docker-compose.yml` inline `environment:` values
- [ ] No secret values in `README.md` or docs
- [ ] No hardcoded credentials in application source code
- [ ] Git history is clean — no previous commits containing real secrets

### Frontend Security
- [ ] No secret API keys in `NEXT_PUBLIC_` / `VITE_` / `REACT_APP_` variables
- [ ] Stripe publishable key (safe) vs secret key (server only) properly separated
- [ ] Sentry DSN in frontend is acceptable (not a secret), but configure rate limits

### Production Secrets
- [ ] All production secrets are in a secrets manager (AWS SM, Doppler, Vault, etc.)
- [ ] Different values for dev / staging / prod — never share secrets across environments
- [ ] Secret rotation plan documented for every key
- [ ] No `.env.production` file in the repository
- [ ] CI/CD secrets stored in the platform's encrypted secret store

### Application Security
- [ ] Startup validation — app fails fast on missing required variables
- [ ] `SecretStr` (Pydantic) or `SecretString` (Rust `secrecy`) used for sensitive values
- [ ] Sentry / logging configured with `send_default_pii=False`
- [ ] Logging does not print the full settings object or env dict

### Team Security
- [ ] Onboarding docs explain where to get real values for local setup
- [ ] Shared secrets are in a team secrets manager, not in Slack/email
- [ ] CI validates that `.env.example` and `.env` have matching keys
- [ ] Offboarding process includes revoking access to all shared secrets

## Secret Types and Their Risk Level

| Secret Type | Risk | Notes |
|---|---|---|
| AWS Access Key (`AKIA...`) | Critical | Can incur massive costs instantly |
| AWS Secret Access Key | Critical | Paired with above |
| Stripe Secret Key (`sk_live_...`) | Critical | Full payment access |
| Database URL with credentials | Critical | Direct data access |
| OpenAI API Key | High | Billing + data access |
| Anthropic API Key | High | Billing + data access |
| GitHub Personal Access Token | High | Repo/org access |
| JWT Secret | High | Authentication bypass |
| Stripe Publishable Key (`pk_...`) | Low | Public by design |
| Sentry DSN | Low | Error reporting only |
| `NEXT_PUBLIC_` variables | Low | Public by design |

## If a Secret Was Exposed — Emergency Checklist

1. **Revoke the key immediately** — don't wait, do it now
2. **Assume it was used** — check billing dashboards, access logs, CloudTrail
3. **Remove from repository** — but know that deletion is not enough
4. **Purge from Git history:**
   ```bash
   # Using git-filter-repo (recommended)
   pip install git-filter-repo
   git filter-repo --path .env --invert-paths

   # Then force-push all branches
   git push origin --force --all
   git push origin --force --tags
   ```
5. **Notify affected parties** if data was accessed
6. **Issue new credentials** with proper secrets management in place
7. **Add the exposed pattern** to your pre-commit hook blocklist

## Automated scanning with evnx

If evnx is installed (check `evnx --version`; flags below are from `evnx <command> --help` and
may differ by version):

```bash
evnx scan --staged                   # what is about to be committed
evnx scan --severity high            # whole tree, blocking threshold for CI
evnx scan --format sarif > evnx.sarif   # for GitHub's Security tab
evnx scan hook install               # run the staged scan before every commit
evnx scan rules list                 # which patterns this version detects
evnx doctor                          # gitignore, file modes, env files git would commit
```

`severity` says how bad a finding is if real; `confidence` says how sure the scanner is.
`--exit-zero` makes a scan pass even with findings: use it only for advisory steps. A scan that
exits 2 did not run and is not a clean result. For CI wiring, see the `evnx-cli` skill.

Scanners differ in what they detect. `evnx scan rules list` shows the current list; do not
assume a provider is covered, and do not treat a clean scan as proof that nothing leaked.
