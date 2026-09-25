---
description: "MCP Ship-Ready: scan a local MCP connector repo for July 2026 spec compliance"
argument-hint: "<repo-path>"
allowed-tools: ["Bash(node --experimental-strip-types ${CLAUDE_PLUGIN_ROOT}/src/cli.ts scan:*)"]
---

# MCP Ship-Ready — Scan

Run the compliance scanner against the target repo path given in `$ARGUMENTS`
(default to `.` if empty). The scanner never executes code from the target
repo — it only reads files for static analysis.

Run:

```
node --experimental-strip-types "${CLAUDE_PLUGIN_ROOT}/src/cli.ts" scan "$ARGUMENTS"
```

Report the command's output to the user as-is. If it exits non-zero, explain
that as a scan error, not necessarily a compliance failure (v1 skeleton:
mechanical/architectural rule categories land in a follow-up task).
