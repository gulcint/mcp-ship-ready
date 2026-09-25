---
description: "MCP Ship-Ready: scan a local MCP connector repo for July 2026 spec compliance"
argument-hint: "<repo-path>"
allowed-tools: ["Bash(node --experimental-strip-types \"${CLAUDE_PLUGIN_ROOT}/src/cli.ts\" scan:*)"]
---

# MCP Ship-Ready — Scan

Run the compliance scanner against the target repo path given in `$ARGUMENTS`
(default to `.` if empty). The scanner never executes code from the target
repo — it only reads files for static analysis.

Run:

```
node --experimental-strip-types "${CLAUDE_PLUGIN_ROOT}/src/cli.ts" scan "$ARGUMENTS"
```

Report the command's output to the user as-is. Findings are categorized as
`mechanical` (safe to auto-fix, coming in task-2026-09-25-0004) or
`architectural` (report only, requires a human decision) — see
`docs/spec-rules.md` for the current rule set and its spec sources. A
non-zero exit means a scan error (bad path/args), not a compliance failure —
the CLI always exits 0 on a completed scan, regardless of findings.
