import type { ScanReport } from "../scanner/index.ts";

/**
 * Paths in a ScanReport come from the target repo, which is untrusted.
 * Escapes Unicode control (Cc), format (Cf), line separator (Zl) and
 * paragraph separator (Zp) characters — C0/C1 controls and \n/ESC, but also
 * U+2028/U+2029 (line/paragraph separators), bidi overrides (U+202E,
 * U+2066-U+2069), and invisible characters (U+200B, U+FEFF) — preventing a
 * crafted filename from injecting fake report lines, spoofing displayed
 * text, or hiding content in output a command markdown file hands to
 * Claude "as-is". Ordinary paths, including non-ASCII letters (ş, ü, CJK),
 * pass through unchanged. Known tradeoff: \p{Cf} also escapes ZWJ
 * (U+200D), so an emoji-sequence path gets escaped too — accepted, see
 * tests/report/format.test.ts.
 */
const CONTROL_CHARS = /[\p{Cc}\p{Cf}\p{Zl}\p{Zp}]/gu;

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
