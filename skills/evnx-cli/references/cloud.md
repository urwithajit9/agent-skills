# evnx cloud, vaults and accounts

**Written against evnx 0.16.0 - confirm with `evnx auth --help`, `evnx vault --help`,
`evnx cloud --help`.** These commands need an evnx account and a connection
(`network: account` in `evnx commands --json`) and a build with the `cloud` feature.
Docs: https://docs.evnx.dev/cli/commands/cloud

Do not sign in, push, pull, share, revoke or delete on the user's behalf without being asked:
each one changes a shared server. Prefer `--dry-run` where a command has it (`vault revoke`).

## Is this machine signed in?

`evnx auth status --check` and `evnx cloud status --check` exit 0 when signed in and 10 when not,
without a request (`--json`: `signed_in`, `server`, `user`). Use that instead of parsing text.

## Secrets never go on a command line

- Master password: `--password-stdin` (first), then `EVNX_MASTER_PASSWORD` or
  `EVNX_MASTER_PASSWORD_FILE` (fallbacks for a job with no terminal).
- API token: `EVNX_TOKEN`. A token authenticates, it does not decrypt.
- CI also needs the key bundle: `EVNX_KEY_BUNDLE` (or `EVNX_KEY_BUNDLE_FILE`), printed by
  `evnx auth token create` and by `evnx auth key-bundle`. It holds sealed key material, no
  plaintext secret; the master password still opens it.

## CI token

```bash
evnx auth token create github-actions --vault myapp/production --scope read
```

`--vault` (one vault) or `--all-vaults` is required; prefer one vault. Tokens expire in 90 days
unless `--expires-in-days N` or `--no-expiry`. The token and bundle are shown once: store them as
CI secrets (`EVNX_TOKEN`, `EVNX_KEY_BUNDLE`) beside `EVNX_MASTER_PASSWORD`. In the job,
`evnx cloud run --vault myapp/production -- ./deploy.sh` or `evnx cloud pull --vault myapp/production`.
`cloud run --min-version N` (or `EVNX_MIN_VERSION`) refuses a vault older than version N.

## Everyday sync

| Job | Command |
|---|---|
| Upload `.env` as a new version | `evnx cloud push --vault myapp/dev` (asks before a push that removes more than half the keys; `--yes` in CI) |
| Download | `evnx cloud pull --vault myapp/dev` (writes mode 600; asks before replacing; `--yes`) |
| Run with a vault's variables | `evnx cloud run --vault myapp/dev -- npm start` (repeat `--vault` to merge; `--allow-override` for duplicates) |
| History, diff, audit | `evnx cloud history`, `evnx cloud diff`, `evnx cloud audit` (all with `--json`, names and metadata only) |
| React to a teammate's push | `evnx cloud watch --vault myapp/dev --on-change -- ./reload.sh` |
| Remove the latest version (admin) | `evnx cloud delete-version --latest --vault myapp/dev` |
| Leave evnx with everything | `evnx cloud export --vault myapp/dev -o out/` (`--to FORMAT`) |

- `cloud watch --on-change -- CMD` runs CMD directly (no shell), once per reported change, with
  `EVNX_WATCH_VAULT` and `EVNX_WATCH_VERSION` and no other `EVNX_*` variable. A failing CMD
  prints a warning and watching goes on; `--once` checks once.
- `cloud delete-version --latest` asks for the vault's full name and names the version that
  becomes the latest; `--yes` skips that (CI). A vault with one version is refused.
  `delete-version N` on the latest is refused and points to `--latest`.

## Removing a person

```bash
evnx vault revoke --all-vaults --user former@example.com --dry-run
evnx vault revoke --all-vaults --user former@example.com
```

- `--all-vaults` lists every vault where you can see them, and the ones it must skip and why
  (your role, they are owner or admin, a remaining member has no post-quantum key), asks once,
  reads the master password once, then revokes and re-keys each vault. It stops at the first
  failure and reports what was done. Exit 1 when a vault was skipped (they still have access
  there), 0 when they are in no vault you can see. Your own address is refused: `vault leave`.
- Revoking cannot recall what they already read. The output ends with a **rotate at the source**
  checklist: credential names grouped by provider with the page where each is replaced, names it
  cannot place, and other names. `--json` has it as `rotate` (name, provider, url, vaults),
  `other_names`, `rotate_notes`. Show the user the list and help them rotate; names only, never
  values.
- `--no-rekey` removes without rotating the vault key (then the names are those recorded at
  each push, and the output says they were not checked). Avoid it unless the user asks.

## Exit codes

| Code | Meaning | What to do |
|---|---|---|
| 4 | Declined, or a confirmation with no terminal and no `--yes` | Preview, then `--yes` if the user agrees |
| 10 | Not signed in, or the token was rejected | `evnx auth login`, or a new token |
| 11 | Forbidden, email not verified, or the server refuses this evnx as too old (HTTP 426) | Check role or verification; for "too old", `evnx update` prints the upgrade command |
| 12 | Plan limit reached | Tell the user |
| 13 | Unreachable, not an evnx server, or TLS roots unusable | Retry later; behind a TLS proxy set `SSL_CERT_FILE` |
| 14 | Conflict or locked | Pull, review, retry |
| 15 | Server error or rate limited | Retry with backoff |

Retry only 13 and 15. `cloud run` returns the child's own code once it has started.

## Vercel (`evnx platform`)

`evnx platform diff|pull|push --to vercel --target production` compares or syncs a local env file
with a Vercel project's variables; `--target` is the Vercel environment. The token comes from
`VERCEL_TOKEN` or `--token-file`, never a flag value. Values are never printed. `push --prune`
stops when it would remove more than half (`--prune-all` to allow).
