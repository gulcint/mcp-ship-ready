import type { ScanReport } from "../scanner/index.ts";

/**
 * Paths in a ScanReport come from the target repo, which is untrusted.
 * Escaping C0/C1 control characters (including \n and ESC) prevents a
 * crafted filename from injecting fake report lines or ANSI sequences into
 * output that a command markdown file hands to Claude "as-is". Ordinary
 * paths (no control characters) pass through unchanged.
 */
// eslint-disable-next-line no-control-regex -- matching control chars is the point of this regex
const CONTROL_CHARS = /[\u0000-\u001f\u007f-\u009f]/g;

function escapeControlChars(value: string): string {
  return value.replace(CONTROL_CHARS, (ch) => `\\x${ch.codePointAt(0)!.toString(16).padStart(2, "0")}`);
}

export function formatReport(report: ScanReport): string {
  const lines: string[] = [`MCP Ship-Ready scan: ${report.target}`];

  if (report.partial) {
    lines.push(
      `PARTIAL SCAN: ${report.partialReason ?? "resource limit reached"} — this report is ` +
        `incomplete, do not treat it as a compliance result.`,
    );
  }

  if (report.skippedPaths.length > 0) {
    lines.push(`Skipped ${report.skippedPaths.length} unreadable path(s):`);
    for (const skipped of report.skippedPaths) {
      lines.push(`  - ${escapeControlChars(skipped)}`);
    }
  }

  if (report.findings.length === 0) {
    lines.push(
      report.partial || report.skippedPaths.length > 0
        ? "No findings in the files scanned so far."
        : "No findings — no known MCP 2026-07-28 spec violations detected (see docs/spec-rules.md).",
    );
    return lines.join("\n");
  }

  for (const finding of report.findings) {
    lines.push(
      `[${finding.category}] ${finding.ruleId} ${escapeControlChars(finding.file)}:${finding.line} — ${finding.message}`,
    );
  }
  return lines.join("\n");
}
