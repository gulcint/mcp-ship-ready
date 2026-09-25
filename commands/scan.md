---
description: "MCP Ship-Ready: scan a local MCP connector repo for July 2026 spec compliance"
argument-hint: "<repo-path>"
allowed-tools: ["Bash(node --experimental-strip-types \"${CLAUDE_PLUGIN_ROOT}/src/cli.ts\" scan:*)"]
disable-model-invocation: true
---

# MCP Ship-Ready — Scan

Claude Code runs the scanner below automatically while loading this command,
using its dynamic context injection feature (see the "Inject dynamic
context" section of
https://code.claude.com/docs/en/slash-commands#inject-dynamic-context) — it
is not something you decide to run, and you should not run it again
yourself via Bash. This makes the exact command that runs deterministic
regardless of how `$ARGUMENTS` is phrased: Claude Code substitutes
`$ARGUMENTS` and `${CLAUDE_PLUGIN_ROOT}` into the literal text below and
executes it itself before this content reaches you, matching it against the
`allowed-tools` rule above exactly. The scanner only reads files under the
target path (default `.` if `$ARGUMENTS` is empty) for static analysis — it
never executes code from the target repo. `$ARGUMENTS` is single-quoted
above (not double-quoted) so a target path can't smuggle shell metacharacters
(`$()`, backticks, `"`) into the command; only a literal `'` in the path
would break the quoting, which is an unlikely, loudly-failing edge case, not
a silent one. This command only runs when you invoke it directly with
`/mcp-ship-ready:scan` — Claude won't call it on its own mid-conversation
(`disable-model-invocation: true` above).

## Scan result
!`node --experimental-strip-types "${CLAUDE_PLUGIN_ROOT}/src/cli.ts" scan '$ARGUMENTS'`

## Your task
Report the scan result above to the user as-is. Findings are categorized as
`mechanical` (safe to auto-fix, coming in task-2026-09-25-0004) or
`architectural` (report only, requires a human decision) — see
`docs/spec-rules.md` for the current rule set and its spec sources. A report
starting with `PARTIAL SCAN` means a resource limit cut the scan short —
say so explicitly; don't present "no findings" in that case as compliance.
