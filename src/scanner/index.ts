import { collectScannableFiles, type WalkLimits } from "./walk.ts";
import { rules, type FindingCategory } from "./rules.ts";

export type { FindingCategory };
export type { WalkLimits };

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
  /** True when a resource limit cut the scan short — see docs/spec-rules.md. */
  partial: boolean;
  partialReason?: string;
  /** Paths that couldn't be read (e.g. EACCES) and were skipped instead of failing the scan. */
  skippedPaths: string[];
}

/**
 * Static-analysis-only scan: reads text files under `targetPath` and matches
 * them against the MCP 2026-07-28 spec rule set (see src/scanner/rules.ts).
 * Never executes anything from the target repo. Files are processed one at
 * a time (never all held in memory at once) and bounded by `limits`.
 */
export function scan(targetPath: string, limits?: WalkLimits): ScanReport {
  const findings: Finding[] = [];
  const iterator = collectScannableFiles(targetPath, limits);

  let step = iterator.next();
  while (!step.done) {
    const file = step.value;
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
    step = iterator.next();
  }

  const summary = step.value;
  return {
    target: targetPath,
    // A partial scan never counts as compliant, even with zero findings so far.
    compliant: findings.length === 0 && !summary.truncated,
    findings,
    partial: summary.truncated,
    partialReason: summary.truncationReason,
    skippedPaths: summary.skippedPaths,
  };
}
