---
description: "MCP Ship-Ready: apply the mechanical auto-fixes for a local MCP connector repo (writes files — run /mcp-ship-ready:fix first to preview)"
argument-hint: "<repo-path>"
allowed-tools: ["Bash(node --experimental-strip-types \"${CLAUDE_PLUGIN_ROOT}/src/cli.ts\" fix-apply:*)"]
disable-model-invocation: true
---

# MCP Ship-Ready — Fix apply

Claude Code runs the command below automatically while loading this
command, via dynamic context injection. This is the `fix-apply`
subcommand — a different program invocation from `/mcp-ship-ready:fix`,
not the same command with a flag, so nothing in `$ARGUMENTS` can turn a
preview into a write: this command only exists because you (the user)
explicitly typed `/mcp-ship-ready:fix-apply` yourself
(`disable-model-invocation: true` above — Claude can't invoke this on its
own mid-conversation either).

This writes to files in the target repo. It never runs `git`; it assumes
the target is already a git working tree so you can review with `git
diff` and revert with `git checkout -- <file>` if a fix is wrong. This
command computes its own fresh scan and plan right before writing — it is
not tied to whatever `/mcp-ship-ready:fix` preview you may have looked at
earlier, and it does not re-check against that. Its drift protection only
covers the brief moment between its own internal scan and its own write
(e.g. a concurrent process editing the file mid-run); if you want an
accurate preview of what this run will do, run `/mcp-ship-ready:fix`
immediately beforehand. A symlinked file is never written to, even if it
resolves inside the target repo. Findings categorized `architectural` are
never touched by this tool under any command.

## Fix result
!`node --experimental-strip-types "${CLAUDE_PLUGIN_ROOT}/src/cli.ts" fix-apply '$ARGUMENTS'`

## Your task
Report the result above to the user as-is, including which files were
written, skipped due to drift, or refused for safety.
