# evnx CI/CD Integration Guide

## GitHub Actions — Full Workflow

```yaml
name: Environment Validation

on: [push, pull_request]

jobs:
  validate-env:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install evnx
        run: |
          curl -sSL https://raw.githubusercontent.com/urwithajit9/evnx/main/install.sh | bash

      - name: Validate .env.example
        run: evnx validate --file .env.example --strict --format github-actions

      - name: Check .env matches .env.example
        run: evnx diff --format json
        # Note: run after generating .env from secrets (see below)

      - name: Scan repository for secrets
        run: evnx scan --format sarif > scan-results.sarif

      - name: Upload SARIF to GitHub Security tab
        uses: github/codeql-action/upload-sarif@v2
        if: always()
        with:
          sarif_file: scan-results.sarif
```

### Generate .env from GitHub Secrets for Testing

```yaml
- name: Generate .env from secrets
  run: |
    cat > .env << EOF
    DATABASE_URL=${{ secrets.DATABASE_URL }}
    SECRET_KEY=${{ secrets.DJANGO_SECRET_KEY }}
    STRIPE_SECRET_KEY=${{ secrets.STRIPE_SECRET_KEY }}
    OPENAI_API_KEY=${{ secrets.OPENAI_API_KEY }}
    EOF

- name: Validate generated .env
  run: evnx validate --strict

- name: Diff .env against .env.example
  run: evnx diff
```

### Publish Secrets to GitHub Actions from .env

```bash
# One-time setup: migrate local .env to GitHub Actions secrets
evnx migrate \
  --from env-file \
  --to github-actions \
  --repo urwithajit9/myproject \
  --github-token $GITHUB_TOKEN
```

---

## GitLab CI

```yaml
stages:
  - validate
  - test
  - deploy

validate-env:
  stage: validate
  image: alpine:latest
  before_script:
    - apk add --no-cache curl bash
    - curl -sSL https://raw.githubusercontent.com/urwithajit9/evnx/main/install.sh | bash
  script:
    - evnx validate --strict --format json
    - evnx scan --format sarif > scan.sarif
  artifacts:
    reports:
      sast: scan.sarif
  only:
    - merge_requests
    - main

generate-env:
  stage: test
  script:
    - |
      cat > .env << EOF
      DATABASE_URL=${CI_DATABASE_URL}
      SECRET_KEY=${CI_SECRET_KEY}
      EOF
    - evnx validate
    - evnx diff
```

---

## Pre-commit Hooks

### Using pre-commit framework

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
        stages: [commit]

      - id: evnx-scan
        name: Scan for secrets
        entry: evnx scan --exit-zero
        language: system
        pass_filenames: false
        stages: [commit, push]

      - id: evnx-sync-check
        name: Check .env.example is up to date
        entry: evnx diff
        language: system
        pass_filenames: false
        stages: [push]
```

Install: `pre-commit install`

### Manual Git Hook

```bash
# .git/hooks/pre-commit
#!/bin/bash
set -e

if command -v evnx &> /dev/null; then
  echo "🔍 Scanning for secrets..."
  evnx scan --exit-zero

  echo "✅ Validating .env.example..."
  evnx validate --file .env.example --strict
else
  echo "⚠️  evnx not installed — skipping .env validation"
  echo "   Install: cargo install evnx"
fi
```

```bash
chmod +x .git/hooks/pre-commit
```

---

## Makefile Integration

```makefile
# Makefile

.PHONY: setup validate scan check-env deploy-secrets

## Setup local development environment
setup:
	@cp -n .env.example .env || true
	@echo "✅ .env created from .env.example — fill in real values"
	@evnx validate

## Validate .env files
validate:
	evnx validate --strict
	evnx diff

## Scan for accidentally committed secrets
scan:
	evnx scan

## Run all environment checks
check-env: validate scan
	evnx doctor

## Deploy secrets to GitHub Actions (set GITHUB_TOKEN first)
deploy-secrets:
	evnx migrate \
		--from env-file \
		--to github-actions \
		--repo $(GITHUB_REPO) \
		--github-token $(GITHUB_TOKEN) \
		--dry-run
	@echo "Run with CONFIRM=1 to apply"
```

---

## Docker / Docker Compose Integration

```yaml
# docker-compose.yml
services:
  api:
    build: .
    env_file:
      - .env
    volumes:
      - .:/app

  validate:
    image: alpine:latest
    command: |
      sh -c "
        curl -sSL https://raw.githubusercontent.com/urwithajit9/evnx/main/install.sh | bash
        evnx validate --strict
        evnx scan
      "
    volumes:
      - ./.env:/app/.env:ro
    working_dir: /app
```

---

## AWS Deployment Pattern

```bash
# 1. Convert .env to AWS Secrets Manager format and create secret
evnx convert --to aws-secrets | \
  aws secretsmanager create-secret \
    --name prod/myapp/config \
    --secret-string file:///dev/stdin

# 2. Or migrate directly with evnx
evnx migrate \
  --to aws-secrets-manager \
  --secret-name prod/myapp/config \
  --dry-run  # preview first

# 3. Generate Kubernetes secret manifest
evnx convert --to kubernetes \
  --include "DB_*,REDIS_*,SECRET_*" \
  --output k8s/secrets.yaml

# 4. Apply
kubectl apply -f k8s/secrets.yaml
```

---

## Doppler Migration Pattern

```bash
# Step 1: Preview what will be migrated
evnx migrate \
  --to doppler \
  --project myproject \
  --config dev \
  --dry-run

# Step 2: Execute migration
evnx migrate \
  --to doppler \
  --project myproject \
  --config dev

# Step 3: Verify by running app with Doppler injecting secrets
doppler run -- your-app-start-command
```

---

## Jenkins Pipeline

```groovy
pipeline {
    agent any
    stages {
        stage('Validate Environment') {
            steps {
                sh '''
                    curl -sSL https://raw.githubusercontent.com/urwithajit9/evnx/main/install.sh | bash
                    evnx validate --strict --format json
                    evnx scan --format sarif > scan-results.sarif
                '''
            }
            post {
                always {
                    archiveArtifacts artifacts: 'scan-results.sarif', allowEmptyArchive: true
                }
            }
        }
    }
}
```

---

## evnx in CI: Format Cheat Sheet

| Scenario | Command |
|---|---|
| Fail CI on any validation error | `evnx validate --strict` |
| Fail CI only on errors, not warnings | `evnx validate` |
| Scan and upload to GitHub Security | `evnx scan --format sarif > results.sarif` |
| Scan without failing the build | `evnx scan --exit-zero` |
| Check .env vs .env.example | `evnx diff` |
| Machine-readable output for parsing | `evnx validate --format json` |
| GitHub Actions annotation format | `evnx validate --format github-actions` |