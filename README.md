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

v1 rule set (this repo). The plugin, CLI, CI pipeline, and a starting MCP
2026-07-28 spec rule set (see `docs/spec-rules.md`) run end to end. It is
not an exhaustive rendering of every spec change — auto-fix for mechanical
findings and Community Directory submission manifest generation land in
follow-up tasks (`tasks/task-2026-09-25-0004.md`, `0005`).

## What it checks

- The removed `initialize`/`notifications/initialized` session handshake.
- OAuth Dynamic Client Registration usage (deprecated in favor of CIMD).
- A deprecated JSON-RPC error code renumbered in the 2026-07-28 spec.

See `docs/spec-rules.md` for the full rule list, each with its exact spec
source. Every finding is categorized as either **mechanical** (safe to
auto-fix, e.g. the error code rename) or **architectural** (reported only,
requires a human decision — e.g. moving to a stateless architecture).

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
