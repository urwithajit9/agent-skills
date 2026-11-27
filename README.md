# agent-skills

Agent skills for working with `.env` files, environment variable management, secret scanning, and the `evnx` CLI - published by [Ajit Kumar](https://github.com/urwithajit9), creator of [evnx](https://evnx.dev) and [dotenv.space](https://dotenv.space).

## Available Skills

| Skill | What it covers | Install |
|---|---|---|
| [`dotenv-best-practices`](./skills/dotenv-best-practices/) | Tool-neutral `.env` guidance: file hierarchy, `.gitignore` and `.env.example`, syntax and variable-expansion differences between loaders, framework rules (Next.js, Vite, Django, Rust, Docker), CI/CD, secret-leak response, 10 common bugs. Works without evnx. | `npx skills add urwithajit9/agent-skills/tree/main/skills/dotenv-best-practices` |
| [`evnx-cli`](./skills/evnx-cli/) | Using the `evnx` CLI (pinned to a release): init, set/get, add and import, validate, scan (staged, history, hooks), diff, sync, convert, migrate, backup/restore, run, cloud and vaults; CI/CD (GitHub Action, SARIF, pre-commit/prek). | `npx skills add urwithajit9/agent-skills/tree/main/skills/evnx-cli` |

## Install

```bash
# both skills
npx skills add urwithajit9/agent-skills

# one skill
npx skills add urwithajit9/agent-skills/tree/main/skills/dotenv-best-practices
npx skills add urwithajit9/agent-skills/tree/main/skills/evnx-cli
```

## Skills track evnx releases

Currently written against **evnx 0.16.0**.

The `evnx-cli` skill is pinned to the evnx version it was written and checked against:
`metadata.evnx_version` in [`skills/evnx-cli/SKILL.md`](./skills/evnx-cli/SKILL.md), repeated in
one line of its body. `SKILL.md` keeps what changes slowly (the workflow by project state, safety
rules, which command does which job, how to read exit codes and JSON); per-release detail lives
in `skills/evnx-cli/references/`, each file stamped with the evnx version it was checked against.

The pin rule the skill gives the agent: run `evnx --version` first, then

- **same version as the pin:** follow the skill;
- **not installed:** say what it will run, then install exactly the pinned version
  (`curl -fsSL https://evnx.dev/install.sh | EVNX_VERSION=0.16.0 bash`,
  `npm install -g @evnx/cli@0.16.0`, `pipx install evnx==0.16.0` or `pip install evnx==0.16.0`,
  `cargo install evnx --version 0.16.0 --locked --all-features`); Homebrew installs the latest
  release only;
- **older than the pin:** never replace it on its own; say what the skill relies on that the
  installed version lacks (from `references/version-notes.md`) and suggest the pinned upgrade;
- **newer than the pin:** keep it; the skill's commands still work (exit codes, the JSON `run`
  header and flag spellings are stable), and for anything the skill does not cover it reads
  `evnx --help`, `evnx <command> --help` or `evnx commands --json` rather than memory.

### Updating for a new evnx release

1. Install the new release and point `EVNX_BIN` at it (or put it first on `PATH`).
2. Bump `metadata.evnx_version` and the "written and checked against" line in
   `skills/evnx-cli/SKILL.md`, and bump the skill's `metadata.version`.
3. Regenerate the command reference: `node scripts/gen-commands.mjs`.
4. Append rows for the release to the top of `skills/evnx-cli/references/version-notes.md`
   (from the evnx CHANGELOG: only what an agent needs to know).
5. Re-check the hand-written references against the new `--help` (convert targets, hook ids
   and `rev:`, CI examples) and move their version stamps.
6. Run both checks until they pass:

   ```bash
   node scripts/gen-commands.mjs --check     # commands.md current, binary == pin, stamps == pin
   node scripts/check-invocations.mjs        # every `evnx ...` in the skills resolves
   ```

### The CI check

[`.github/workflows/check.yml`](./.github/workflows/check.yml) runs on every push and pull
request: it reads the pin (`node scripts/gen-commands.mjs --print-pin`), installs exactly that
evnx with the install script (`EVNX_VERSION`, checksum verified), and runs both checks above.
The scripts need Node and nothing else; `check-invocations.mjs --list` prints every invocation
it found.

## Compatible Agents

These skills work with agents that support the [Agent Skills](https://agentskills.io) open standard:

Claude Code · GitHub Copilot · Cursor · OpenAI Codex · Gemini · Windsurf · Cline · Roo · Goose · and more.

## Related Resources

- **evnx docs**: [docs.evnx.dev](https://docs.evnx.dev) - **Changelog**: [CHANGELOG.md](https://github.com/urwithajit9/evnx/blob/main/CHANGELOG.md)
- **CLI**: [evnx.dev](https://evnx.dev) - install channels are listed by `evnx update` (cargo, Homebrew, Scoop, winget, npm, pip, pipx, install script)
- **GitHub Action**: [urwithajit9/evnx-action](https://github.com/urwithajit9/evnx-action)
- **Reference**: [dotenv.space](https://dotenv.space) - the `.env` reference for every stack
- **GitHub**: [urwithajit9/evnx](https://github.com/urwithajit9/evnx)
- **npm**: [@evnx/cli](https://www.npmjs.com/package/@evnx/cli) - **crates.io**: [evnx](https://crates.io/crates/evnx) - **PyPI**: [evnx](https://pypi.org/project/evnx/)

## License

MIT
