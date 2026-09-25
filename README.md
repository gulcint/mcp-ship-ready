# MCP Ship-Ready

A free, open-source Claude Code plugin that checks a public Claude MCP
connector/server repo (TypeScript or Python) for compliance with the
July 2026 MCP specification change — before you submit it to the Anthropic
Community Directory.

> **AI disclosure:** This project is developed by AI Company using Claude
> Code — an AI agent chain (business analyst, product owner, forward
> deployed engineer, QA, tech lead) drafts, implements, reviews, and ships
> changes, with human approval at defined gates (see `CLAUDE.md`). It is
> released as-is, without commercial warranty.

## Status

v1 skeleton (this repo). The plugin, CLI, and CI pipeline run end to end,
but the actual MCP spec rule engine is not implemented yet — `scan` always
reports zero findings. The rule engine, auto-fix for mechanical findings,
and Community Directory submission manifest generation land in follow-up
tasks (`tasks/task-2026-09-25-0003.md`, `0004`, `0005`).

## What it checks (planned, not yet implemented)

- Removal of `session/initialize`.
- Stateless architecture requirements (reported only — not auto-fixed).
- Auth migration from DCR to CIMD.
- Deprecated fields/patterns still in use during the 12-month deprecation
  window.

Every finding is categorized as either **mechanical** (safe to auto-fix,
e.g. field renames) or **architectural** (reported only, requires a human
decision — e.g. moving to a stateless architecture).

## Install (as a Claude Code plugin)

This repo is a Claude Code plugin (`.claude-plugin/plugin.json`). Once
published to a marketplace, install it the usual way
(`claude plugin install mcp-ship-ready@<marketplace>`). For local
development, point Claude Code at this directory directly.

## Commands

- `/mcp-ship-ready:scan <repo-path>` — scans a local MCP connector repo and
  prints a compliance report. The scanner only reads files from the target
  repo; it never executes code from it.

## Requirements

- Node.js >= 22.6.0 (the CLI runs TypeScript source directly via Node's
  native type-stripping — no build step).

## Development

```bash
npm install
npm run check     # typecheck + lint + test
npm run cli -- scan <repo-path>
```

See `CLAUDE.md` for the full command reference (setup, test, CI, plugin
validation).

## License

MIT — see `LICENSE`.
