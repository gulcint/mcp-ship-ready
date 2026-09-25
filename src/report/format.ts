import type { ScanReport } from "../scanner/index.ts";

export function formatReport(report: ScanReport): string {
  const lines: string[] = [`MCP Ship-Ready scan: ${report.target}`];

  if (report.findings.length === 0) {
    lines.push(
      "No findings (rule engine not implemented yet — see task-2026-09-25-0003).",
    );
    return lines.join("\n");
  }

  for (const finding of report.findings) {
    lines.push(
      `[${finding.category}] ${finding.ruleId} ${finding.file}:${finding.line} — ${finding.message}`,
    );
  }
  return lines.join("\n");
}
