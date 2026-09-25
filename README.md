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

v1 (this repo): scanning, previewing fixes, and applying fixes all run
end to end, backed by a starting MCP 2026-07-28 spec rule set (see
`docs/spec-rules.md`). It is not an exhaustive rendering of every spec
change — see `docs/spec-rules.md` for exactly which rules exist today
and their sources.

## What it checks

- The removed `initialize`/`notifications/initialized` session handshake.
- OAuth Dynamic Client Registration usage (deprecated in favor of CIMD).
- A deprecated JSON-RPC error code renumbered in the 2026-07-28 spec.

See `docs/spec-rules.md` for the full rule list, each with its exact spec
source. Every finding is categorized as either **mechanical** (safe to
auto-fix, e.g. the error code rename) or **architectural** (reported only,
requires a human decision — e.g. moving to a stateless architecture).
Architectural findings are never auto-fixed by this tool, under any
command.

## Install (as a Claude Code plugin)

This repo is a Claude Code plugin (`.claude-plugin/plugin.json`). Once
published to a marketplace, install it the usual way
(`claude plugin install mcp-ship-ready@<marketplace>`). For local
development, point Claude Code at this directory directly with
`claude --plugin-dir .`.

## Commands

- `/mcp-ship-ready:scan <repo-path>` — scans a local MCP connector repo and
  prints a compliance report. Read-only: only reads files from the target
  repo, never executes code from it, never writes anything.
- `/mcp-ship-ready:fix <repo-path>` — previews the mechanical auto-fixes
  available (a diff of what would change). Also read-only — it never
  writes to the target repo, regardless of what the preview shows.
- `/mcp-ship-ready:fix-apply <repo-path>` — actually writes the mechanical
  fixes to disk. This is the only command that modifies the target repo,
  and it's a deliberately separate command from `fix` (not a flag), so
  applying a fix always requires you to explicitly invoke
  `/mcp-ship-ready:fix-apply` yourself.

All three commands set `disable-model-invocation: true`: Claude can't
decide to call any of them on its own mid-conversation. You always invoke
them explicitly by typing the slash command. `fix-apply` never runs `git`
against your repo, writes atomically, and refuses to touch a symlink or a
file whose content changed since it started — see the doc comments in
`src/fixer/index.ts` for the full safety design.

## Requirements

- Node.js >= 22.6.0 (the CLI runs TypeScript source directly via Node's
  native type-stripping — no build step).

## Development

```bash
npm install
npm run check     # typecheck + lint + test
npm run cli -- scan <repo-path>        # same as /mcp-ship-ready:scan
npm run cli -- fix <repo-path>         # same as /mcp-ship-ready:fix (preview only)
npm run cli -- fix-apply <repo-path>   # same as /mcp-ship-ready:fix-apply (writes files)
```

See `CLAUDE.md` for the full command reference (setup, test, CI, plugin
validation).

## License

MIT — see `LICENSE`.
