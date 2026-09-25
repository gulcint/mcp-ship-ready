import { escapeControlChars } from "../report/format.ts";
import type { ApplyResult, FileFix, FixPlan } from "./index.ts";

/**
 * Bounds how much untrusted target-repo content (a changed line's before/
 * after text) reaches the caller. Truncation runs on the RAW string before
 * escaping, not after: escaping never runs on anything past the cut point,
 * so it can never produce a truncated/dangling `\xNN` escape token.
 */
const MAX_LINE_CHARS = 200;
/** Caps how many individual line changes are listed before summarizing the rest. */
const MAX_CHANGES_SHOWN = 20;

/** Pulls the cut point back by one if it would split a UTF-16 surrogate pair. */
function safeCutIndex(raw: string, maxChars: number): number {
  const code = raw.charCodeAt(maxChars - 1);
  return code >= 0xd800 && code <= 0xdbff ? maxChars - 1 : maxChars;
}

function truncateAndEscape(raw: string): string {
  if (raw.length <= MAX_LINE_CHARS) return escapeControlChars(raw);
  const cut = safeCutIndex(raw, MAX_LINE_CHARS);
  const remaining = raw.length - cut;
  return `${escapeControlChars(raw.slice(0, cut))}…(+${remaining} chars)`;
}

function formatFixList(fixes: FileFix[]): string[] {
  const lines: string[] = [];
  const totalChanges = fixes.reduce((n, f) => n + f.changes.length, 0);
  let changesShown = 0;

  outer: for (const fix of fixes) {
    let headerPrinted = false;
    for (const change of fix.changes) {
      if (changesShown >= MAX_CHANGES_SHOWN) break outer;
      if (!headerPrinted) {
        lines.push(`  ${escapeControlChars(fix.file)} (${fix.ruleIds.join(", ")}):`);
        headerPrinted = true;
      }
      lines.push(`    - line ${change.line}: ${truncateAndEscape(change.before)}`);
      lines.push(`    + line ${change.line}: ${truncateAndEscape(change.after)}`);
      changesShown++;
    }
  }

  if (changesShown < totalChanges) {
    lines.push(`… and ${totalChanges - changesShown} more change(s), not shown.`);
  }
  return lines;
}

function formatRefusedUnsafe(refusedUnsafe: FixPlan["refusedUnsafe"], verb: "touch" | "write"): string[] {
  if (refusedUnsafe.length === 0) return [];
  const lines = [`Refused to ${verb} ${refusedUnsafe.length} file(s) for safety:`];
  for (const r of refusedUnsafe) lines.push(`  - ${escapeControlChars(r.file)}: ${escapeControlChars(r.reason)}`);
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
    lines.push(...formatFixList(plan.fixes));
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
