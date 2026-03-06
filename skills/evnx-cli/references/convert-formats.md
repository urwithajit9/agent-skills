# evnx convert — All 14 Format Examples

Given this `.env` input:
```env
APP_NAME=MyApp
SECRET_KEY=s3cr3tkey
DATABASE_URL=postgresql://user:pass@localhost/mydb
STRIPE_SECRET_KEY=sk_test_abc123
DEBUG=False
PORT=8000
```

---

## json
```bash
evnx convert --to json
```
```json
{
  "APP_NAME": "MyApp",
  "SECRET_KEY": "s3cr3tkey",
  "DATABASE_URL": "postgresql://user:pass@localhost/mydb",
  "STRIPE_SECRET_KEY": "sk_test_abc123",
  "DEBUG": "False",
  "PORT": "8000"
}
```

---

## yaml
```bash
evnx convert --to yaml
```
```yaml
APP_NAME: MyApp
SECRET_KEY: s3cr3tkey
DATABASE_URL: postgresql://user:pass@localhost/mydb
STRIPE_SECRET_KEY: sk_test_abc123
DEBUG: "False"
PORT: "8000"
```

---

## shell
```bash
evnx convert --to shell
```
```bash
export APP_NAME="MyApp"
export SECRET_KEY="s3cr3tkey"
export DATABASE_URL="postgresql://user:pass@localhost/mydb"
export STRIPE_SECRET_KEY="sk_test_abc123"
export DEBUG="False"
export PORT="8000"
```

---

## docker-compose
```bash
evnx convert --to docker-compose
```
```yaml
services:
  app:
    environment:
      - APP_NAME=MyApp
      - SECRET_KEY=s3cr3tkey
      - DATABASE_URL=postgresql://user:pass@localhost/mydb
      - STRIPE_SECRET_KEY=sk_test_abc123
      - DEBUG=False
      - PORT=8000
```

---

## kubernetes
```bash
evnx convert --to kubernetes
```
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
type: Opaque
data:
  APP_NAME: TXlBcHA=
  SECRET_KEY: czNjcjNoa2V5
  DATABASE_URL: cG9zdGdyZXNxbDovL...
  STRIPE_SECRET_KEY: c2tfdGVzdF9hYmMxMjM=
  DEBUG: RmFsc2U=
  PORT: ODAwMA==
```
*(Values are base64-encoded as required by Kubernetes)*

---

## terraform
```bash
evnx convert --to terraform
```
```hcl
APP_NAME        = "MyApp"
SECRET_KEY      = "s3cr3tkey"
DATABASE_URL    = "postgresql://user:pass@localhost/mydb"
STRIPE_SECRET_KEY = "sk_test_abc123"
DEBUG           = "False"
PORT            = "8000"
```

---

## github-actions
```bash
evnx convert --to github-actions
```
```yaml
env:
  APP_NAME: MyApp
  SECRET_KEY: ${{ secrets.SECRET_KEY }}
  DATABASE_URL: ${{ secrets.DATABASE_URL }}
  STRIPE_SECRET_KEY: ${{ secrets.STRIPE_SECRET_KEY }}
  DEBUG: "False"
  PORT: "8000"
```
*(Values that look like secrets reference the GitHub secrets store)*

---

## aws-secrets
```bash
evnx convert --to aws-secrets
```
```json
{
  "APP_NAME": "MyApp",
  "SECRET_KEY": "s3cr3tkey",
  "DATABASE_URL": "postgresql://user:pass@localhost/mydb",
  "STRIPE_SECRET_KEY": "sk_test_abc123",
  "DEBUG": "False",
  "PORT": "8000"
}
```
```bash
# Pipe directly to AWS CLI
evnx convert --to aws-secrets | \
  aws secretsmanager create-secret \
    --name prod/myapp/config \
    --secret-string file:///dev/stdin
```

---

## gcp-secrets
```bash
evnx convert --to gcp-secrets
```
```bash
# Generates gcloud commands to create each secret
gcloud secrets create APP_NAME --data-file=- <<< "MyApp"
gcloud secrets create SECRET_KEY --data-file=- <<< "s3cr3tkey"
gcloud secrets create DATABASE_URL --data-file=- <<< "postgresql://user:pass@localhost/mydb"
# ...
```

---

## azure-keyvault
```bash
evnx convert --to azure-keyvault
```
```bash
# Generates az CLI commands
az keyvault secret set --vault-name MyVault --name APP-NAME --value "MyApp"
az keyvault secret set --vault-name MyVault --name SECRET-KEY --value "s3cr3tkey"
az keyvault secret set --vault-name MyVault --name DATABASE-URL --value "postgresql://..."
# ...
```

---

## heroku
```bash
evnx convert --to heroku
```
```bash
heroku config:set \
  APP_NAME="MyApp" \
  SECRET_KEY="s3cr3tkey" \
  DATABASE_URL="postgresql://user:pass@localhost/mydb" \
  STRIPE_SECRET_KEY="sk_test_abc123" \
  DEBUG="False" \
  PORT="8000"
```

---

## vercel
```bash
evnx convert --to vercel
```
```bash
vercel env add APP_NAME production <<< "MyApp"
vercel env add SECRET_KEY production <<< "s3cr3tkey"
vercel env add DATABASE_URL production <<< "postgresql://user:pass@localhost/mydb"
# ...
```

---

## railway
```bash
evnx convert --to railway
```
```json
{
  "APP_NAME": "MyApp",
  "SECRET_KEY": "s3cr3tkey",
  "DATABASE_URL": "postgresql://user:pass@localhost/mydb",
  "STRIPE_SECRET_KEY": "sk_test_abc123",
  "DEBUG": "False",
  "PORT": "8000"
}
```

---

## doppler
```bash
evnx convert --to doppler
```
```json
{
  "APP_NAME": "MyApp",
  "SECRET_KEY": "s3cr3tkey",
  "DATABASE_URL": "postgresql://user:pass@localhost/mydb",
  "STRIPE_SECRET_KEY": "sk_test_abc123",
  "DEBUG": "False",
  "PORT": "8000"
}
```
```bash
# Import into Doppler
evnx convert --to doppler | doppler secrets upload --project myproject --config dev
```

---

## Advanced Filtering Examples

```bash
# Export only AWS-related variables
evnx convert --to json --include "AWS_*"

# Export everything except local dev settings
evnx convert --to kubernetes --exclude "*_LOCAL,*_DEV"

# Add a prefix to all variable names
evnx convert --to json --prefix "MYAPP_"

# Uppercase all keys
evnx convert --to yaml --transform uppercase

# Base64-encode all values (useful for Kubernetes)
evnx convert --to json --base64

# Write to file instead of stdout
evnx convert --to terraform --output terraform.tfvars

# Combine filters
evnx convert --to aws-secrets \
  --include "DB_*,STRIPE_*,OPENAI_*" \
  --exclude "*_TEST" \
  --output prod-secrets.json
```