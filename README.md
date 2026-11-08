# agent-skills

Agent skills for working with `.env` files, environment variable management, secret scanning, and the `evnx` CLI - published by [Ajit Kumar](https://github.com/urwithajit9), creator of [evnx](https://evnx.dev) and [dotenv.space](https://dotenv.space).

## Available Skills

| Skill | What it covers | Install |
|---|---|---|
| [`dotenv-best-practices`](./skills/dotenv-best-practices/) | Tool-neutral `.env` guidance: file hierarchy, `.gitignore` and `.env.example`, syntax and variable-expansion differences between loaders, framework rules (Next.js, Vite, Django, Rust, Docker), CI/CD, secret-leak response, 10 common bugs. Works without evnx. | `npx skills add urwithajit9/agent-skills/tree/main/skills/dotenv-best-practices` |
| [`evnx-cli`](./skills/evnx-cli/) | Using the `evnx` CLI: validate, scan, diff, sync, add/remove, convert, migrate, backup/restore, run, cloud and vaults; CI/CD (GitHub Action, SARIF, pre-commit/prek). | `npx skills add urwithajit9/agent-skills/tree/main/skills/evnx-cli` |

## Install

```bash
# both skills
npx skills add urwithajit9/agent-skills

# one skill
npx skills add urwithajit9/agent-skills/tree/main/skills/dotenv-best-practices
npx skills add urwithajit9/agent-skills/tree/main/skills/evnx-cli
```

## Skills track evnx releases

evnx changes between releases (flags, exit codes, output formats, scan rules), so the skills
keep stable principles in `SKILL.md` and put volatile detail in `references/`, marked with the
evnx version it was generated from. The `evnx-cli` skill tells the agent to:

1. run `evnx --version` before acting;
2. treat `evnx <command> --help` and `evnx commands --json` as the source of truth for flags;
3. check the installed version against a short "Version notes" table ("since vX.Y.Z") and, if it
   is older than a behaviour it needs, say so and suggest `evnx update --check` or the user's
   install channel.

Currently written against **evnx 0.13.0**. Newer releases append rows to the version table and
regenerate `skills/evnx-cli/references/commands.md` from `evnx commands --json`.

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
