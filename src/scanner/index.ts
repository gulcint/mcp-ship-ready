import { collectScannableFiles } from "./walk.ts";
import { rules, type FindingCategory } from "./rules.ts";

export type { FindingCategory };

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
 * Static-analysis-only scan: reads text files under `targetPath` and matches
 * them against the MCP 2026-07-28 spec rule set (see src/scanner/rules.ts).
 * Never executes anything from the target repo.
 */
export function scan(targetPath: string): ScanReport {
  const files = collectScannableFiles(targetPath);
  const findings: Finding[] = [];

  for (const file of files) {
    for (const rule of rules) {
      for (const match of rule.detect(file.content)) {
        findings.push({
          ruleId: rule.id,
          file: file.relativePath,
          line: match.line,
          category: rule.category,
          message: match.message,
        });
      }
    }
  }

  return { target: targetPath, compliant: findings.length === 0, findings };
}
