import { escapeControlChars } from "../report/format.ts";
import type { ApplyResult, FixPlan } from "./index.ts";

function formatRefusedUnsafe(refusedUnsafe: FixPlan["refusedUnsafe"], verb: "touch" | "write"): string[] {
  if (refusedUnsafe.length === 0) return [];
  const lines = [`Refused to ${verb} ${refusedUnsafe.length} file(s) for safety:`];
  for (const r of refusedUnsafe) lines.push(`  - ${escapeControlChars(r.file)}: ${r.reason}`);
  return lines;
}

function formatArchitecturalNote(architecturalSkipped: FixPlan["architecturalSkipped"]): string[] {
  if (architecturalSkipped.length === 0) return [];
  const lines = [
    `${architecturalSkipped.length} architectural finding(s) are out of scope and will never be auto-fixed:`,
  ];
  for (const f of architecturalSkipped) {
    lines.push(`  - ${f.ruleId} ${escapeControlChars(f.file)}:${f.line} (requires a human decision)`);
  }
  return lines;
}

export function formatFixPreview(plan: FixPlan): string {
  const lines = [`MCP Ship-Ready fix preview: ${escapeControlChars(plan.target)}`];

  if (plan.fixes.length === 0) {
    lines.push("No mechanical fixes available.");
  } else {
    lines.push(`${plan.fixes.length} file(s) would be changed:`);
    for (const fix of plan.fixes) {
      lines.push(`  ${escapeControlChars(fix.file)} (${fix.ruleIds.join(", ")}):`);
      for (const change of fix.changes) {
        lines.push(`    - line ${change.line}: ${escapeControlChars(change.before)}`);
        lines.push(`    + line ${change.line}: ${escapeControlChars(change.after)}`);
      }
    }
    lines.push(
      "Nothing has been written. Run /mcp-ship-ready:fix-apply on the same path to apply these changes.",
    );
  }

  lines.push(...formatRefusedUnsafe(plan.refusedUnsafe, "touch"));
  lines.push(...formatArchitecturalNote(plan.architecturalSkipped));
  lines.push(
    "This tool assumes the target is a git working tree — review with `git diff` and revert with " +
      "`git checkout -- <file>` if needed (it never runs git itself).",
  );
  return lines.join("\n");
}

export function formatApplyResult(result: ApplyResult): string {
  const lines = [`MCP Ship-Ready fix apply: ${escapeControlChars(result.target)}`];

  if (result.written.length === 0 && result.fixes.length === 0 && result.refusedUnsafe.length === 0) {
    lines.push("No mechanical fixes available. Nothing was written.");
  } else {
    lines.push(`Wrote ${result.written.length} file(s):`);
    for (const file of result.written) lines.push(`  - ${escapeControlChars(file)}`);

    if (result.driftSkipped.length > 0) {
      lines.push(
        `Skipped ${result.driftSkipped.length} file(s) whose content changed between this run's ` +
          `internal scan and its write:`,
      );
      for (const file of result.driftSkipped) lines.push(`  - ${escapeControlChars(file)}`);
    }
    lines.push(...formatRefusedUnsafe(result.refusedUnsafe, "write"));
  }

  lines.push(...formatArchitecturalNote(result.architecturalSkipped));
  return lines.join("\n");
}
