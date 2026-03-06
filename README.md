# agent-skills

Agent skills for working with `.env` files, environment variable management, secret scanning, and the `evnx` CLI — published by [Ajit Kumar](https://github.com/urwithajit9), creator of [evnx](https://evnx.dev) and [dotenv.space](https://dotenv.space).

## Available Skills

| Skill | Description | Install |
|---|---|---|
| [`dotenv-best-practices`](./skills/dotenv-best-practices/) | `.env` format spec, security patterns, multi-stack guide. Works with any tool. | `npx skills add urwithajit9/agent-skills/tree/main/skills/dotenv-best-practices` |
| [`evnx-cli`](./skills/evnx-cli/) | Full `evnx` CLI command reference, CI/CD integration, migration workflows. | `npx skills add urwithajit9/agent-skills/tree/main/skills/evnx-cli` |

## Install All Skills

```bash
npx skills add urwithajit9/agent-skills
```

## Install Individual Skills

```bash
# .env best practices (works without evnx)
npx skills add urwithajit9/agent-skills/tree/main/skills/dotenv-best-practices

# evnx CLI workflows
npx skills add urwithajit9/agent-skills/tree/main/skills/evnx-cli
```

## Compatible Agents

These skills work with all agents that support the [Agent Skills](https://agentskills.io) open standard:

Claude Code · GitHub Copilot · Cursor · OpenAI Codex · Gemini · Windsurf · Cline · Roo · Goose · and 30+ more.

## Related Resources

- **CLI**: [evnx.dev](https://evnx.dev) — install via `cargo install evnx`, `npm install @evnx/cli`, or `pip install evnx`
- **Reference**: [dotenv.space](https://dotenv.space) — the complete `.env` reference for every stack
- **GitHub**: [urwithajit9/evnx](https://github.com/urwithajit9/evnx)
- **npm**: [@evnx/cli](https://www.npmjs.com/package/@evnx/cli)
- **crates.io**: [evnx](https://crates.io/crates/evnx)
- **PyPI**: [evnx](https://pypi.org/project/evnx/)

## License

MIT