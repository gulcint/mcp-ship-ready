---
description: "MCP Ship-Ready: preview the mechanical auto-fixes available for a local MCP connector repo (never writes)"
argument-hint: "<repo-path>"
allowed-tools: ["Bash(node --experimental-strip-types \"${CLAUDE_PLUGIN_ROOT}/src/cli.ts\" fix:*)"]
disable-model-invocation: true
---

# MCP Ship-Ready — Fix preview

Claude Code runs the command below automatically while loading this
command, via dynamic context injection — it is not something you decide
to run, and you should not run it again yourself via Bash. This is the
`fix` subcommand: it only ever previews, and never writes to the target
repo (that requires the separate `/mcp-ship-ready:fix-apply` command — see
its own file for why that split, not a flag, is what gates writing).
Findings categorized `architectural` (e.g. moving to a stateless
architecture) are never auto-fixed by this tool at all, under any command
— they require a human decision.

## Fix preview
!`node --experimental-strip-types "${CLAUDE_PLUGIN_ROOT}/src/cli.ts" fix '$ARGUMENTS'`

## Your task
Report the preview above to the user as-is. If it lists changes, tell the
user to run `/mcp-ship-ready:fix-apply` on the same path to apply them —
don't apply them yourself, and don't suggest running the underlying CLI
command directly with a flag; there isn't one.
