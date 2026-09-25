export type FindingCategory = "mechanical" | "architectural";

export interface Finding {
  ruleId: string;
  file: string;
  line: number;
  category: FindingCategory;
  message: string;
}

export interface ScanReport {
  target: string;
  compliant: boolean;
  findings: Finding[];
}

/**
 * v1 skeleton: the July 2026 MCP spec rule set is derived and wired up in
 * task-2026-09-25-0003. This stub proves the CLI -> scanner -> report
 * pipeline runs end to end without guessing at rule content.
 */
export function scan(targetPath: string): ScanReport {
  return { target: targetPath, compliant: true, findings: [] };
}
