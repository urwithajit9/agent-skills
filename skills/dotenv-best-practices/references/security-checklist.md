# .env Security Checklist

Full pre-project and pre-deploy checklist. Source: [dotenv.space](https://dotenv.space).

## Pre-Project Setup (Do This Once)

- [ ] Add `.env` to `.gitignore` **before the first commit**
- [ ] Create `.env.example` with all variable names and placeholder values
- [ ] Commit `.env.example` to the repository
- [ ] Set file permissions: `chmod 600 .env`
- [ ] Enable GitHub Push Protection (Settings → Code security → Push protection)
- [ ] Install a pre-commit hook for secret scanning

### Pre-commit Hook Setup (Recommended)

```yaml
# .pre-commit-config.yaml
repos:
  - repo: local
    hooks:
      - id: evnx-validate
        name: Validate .env files
        entry: evnx validate --strict
        language: system
        pass_filenames: false

      - id: evnx-scan
        name: Scan for secrets
        entry: evnx scan --exit-zero
        language: system
        pass_filenames: false
```

Alternative using `detect-secrets`:
```yaml
repos:
  - repo: https://github.com/Yelp/detect-secrets
    rev: v1.4.0
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
| AWS Access Key (`AKIA...`) | 🔴 Critical | Can incur massive costs instantly |
| AWS Secret Access Key | 🔴 Critical | Paired with above |
| Stripe Secret Key (`sk_live_...`) | 🔴 Critical | Full payment access |
| Database URL with credentials | 🔴 Critical | Direct data access |
| OpenAI API Key | 🟠 High | Billing + data access |
| Anthropic API Key | 🟠 High | Billing + data access |
| GitHub Personal Access Token | 🟠 High | Repo/org access |
| JWT Secret | 🟠 High | Authentication bypass |
| Stripe Publishable Key (`pk_...`) | 🟡 Low | Public by design |
| Sentry DSN | 🟡 Low | Error reporting only |
| `NEXT_PUBLIC_` variables | 🟡 Low | Public by design |

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

## Automated Scanning with evnx

```bash
# Scan current directory for secrets
evnx scan

# Scan specific directory
evnx scan --path src/

# Output SARIF for GitHub Security tab
evnx scan --format sarif > scan-results.sarif

# In CI — don't fail the build but still report
evnx scan --exit-zero --format json

# Validate .env is clean of placeholders and weak secrets
evnx validate --strict
```

## Secret Pattern Detection

`evnx scan` detects these patterns by default:

| Pattern | Example |
|---|---|
| AWS Access Key | `AKIA[0-9A-Z]{16}` |
| Stripe Secret Key | `sk_live_[0-9a-zA-Z]{24}` |
| Stripe Test Key | `sk_test_[0-9a-zA-Z]{24}` |
| GitHub Token | `ghp_[0-9a-zA-Z]{36}` |
| OpenAI API Key | `sk-proj-[0-9a-zA-Z-_]{48}` |
| Anthropic API Key | `sk-ant-[0-9a-zA-Z-_]{32,}` |
| RSA Private Key | `-----BEGIN RSA PRIVATE KEY-----` |
| High-entropy strings | Entropy > 4.5 in suspicious contexts |

For the full pattern library and custom rules, see the [evnx documentation](https://evnx.dev).