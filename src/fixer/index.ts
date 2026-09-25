import { chmodSync, lstatSync, readFileSync, realpathSync, renameSync, writeFileSync } from "node:fs";
import { createHash, randomBytes } from "node:crypto";
import path from "node:path";
import type { ScanReport } from "../scanner/index.ts";
import { FIXERS } from "./rules.ts";

export interface LineChange {
  line: number;
  before: string;
  after: string;
}

export interface FileFix {
  file: string;
  ruleIds: string[];
  changes: LineChange[];
  /** sha256 of the file content this plan was computed from — used to detect drift before writing. */
  beforeHash: string;
}

export interface FixPlan {
  target: string;
  applied: boolean;
  fixes: FileFix[];
  /** Architectural findings this tool will never touch — reported for transparency. */
  architecturalSkipped: { ruleId: string; file: string; line: number }[];
  /** A mechanical finding whose file this tool refuses to even plan a fix for (e.g. non-UTF-8 content). */
  refusedUnsafe: { file: string; reason: string }[];
}

export interface ApplyResult extends FixPlan {
  written: string[];
  /** File content changed since planFixes() computed beforeHash — not written. */
  driftSkipped: string[];
}

function sha256(content: string): string {
  return createHash("sha256").update(content, "utf8").digest("hex");
}

function isInsideRoot(root: string, candidate: string): boolean {
  const rel = path.relative(root, candidate);
  return rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel));
}

/**
 * We only ever read/write file content as UTF-8 text. A file whose bytes
 * aren't valid UTF-8 (e.g. Latin-1) would silently lose data — Node decodes
 * unmappable bytes as U+FFFD, and re-encoding that produces different bytes
 * than the original. Comparing the buffer to its own decode-then-re-encode
 * catches this without guessing at encodings.
 */
function isRoundTrippableUtf8(buf: Buffer): boolean {
  return Buffer.from(buf.toString("utf8"), "utf8").equals(buf);
}

function diffLines(before: string, after: string): LineChange[] {
  const beforeLines = before.split("\n");
  const afterLines = after.split("\n");
  const changes: LineChange[] = [];
  const max = Math.max(beforeLines.length, afterLines.length);
  for (let i = 0; i < max; i++) {
    if (beforeLines[i] !== afterLines[i]) {
      changes.push({ line: i + 1, before: beforeLines[i] ?? "", after: afterLines[i] ?? "" });
    }
  }
  return changes;
}

/** Applies every registered fixer to a file's content, in order. */
function fixContent(content: string): string {
  return Object.values(FIXERS).reduce((current, fix) => fix(current), content);
}

/** Same-directory temp file + rename — atomic on POSIX, never a partial write. Preserves the original file's permission bits. */
function writeAtomically(absPath: string, content: string, mode: number): void {
  const tmpPath = path.join(
    path.dirname(absPath),
    `.${path.basename(absPath)}.mcp-ship-ready-${randomBytes(6).toString("hex")}.tmp`,
  );
  writeFileSync(tmpPath, content, "utf8");
  chmodSync(tmpPath, mode);
  renameSync(tmpPath, absPath);
}

/**
 * Computes what would change, without touching the filesystem. Only
 * findings that are BOTH category "mechanical" AND have an entry in
 * FIXERS are ever included — an architectural finding is never fixed,
 * even if some future FIXERS entry were added for its rule id by mistake.
 * A file that isn't valid UTF-8 is refused here too (see
 * isRoundTrippableUtf8), not just at apply time.
 */
export function planFixes(report: ScanReport, targetRoot: string): FixPlan {
  const architecturalSkipped = report.findings
    .filter((f) => f.category === "architectural")
    .map((f) => ({ ruleId: f.ruleId, file: f.file, line: f.line }));
  const refusedUnsafe: { file: string; reason: string }[] = [];

  const fixableFiles = new Map<string, Set<string>>(); // file -> rule ids that apply to it
  for (const finding of report.findings) {
    if (finding.category !== "mechanical") continue;
    if (!(finding.ruleId in FIXERS)) continue;
    if (!fixableFiles.has(finding.file)) fixableFiles.set(finding.file, new Set());
    fixableFiles.get(finding.file)!.add(finding.ruleId);
  }

  const fixes: FileFix[] = [];
  for (const [file, ruleIds] of fixableFiles) {
    const absPath = path.join(targetRoot, file);
    const buf = readFileSync(absPath);
    if (!isRoundTrippableUtf8(buf)) {
      refusedUnsafe.push({ file, reason: "file is not valid UTF-8 — refusing to risk corrupting it" });
      continue;
    }
    const before = buf.toString("utf8");
    const after = fixContent(before);
    const changes = diffLines(before, after);
    if (changes.length === 0) continue; // e.g. content already fixed
    fixes.push({ file, ruleIds: [...ruleIds], changes, beforeHash: sha256(before) });
  }

  return { target: targetRoot, applied: false, fixes, architecturalSkipped, refusedUnsafe };
}

/**
 * Writes the changes a prior planFixes() call computed. Never invokes git —
 * running any command against an untrusted target repo (even something as
 * innocuous-looking as `git status`) can execute attacker-controlled code
 * via .git/config (core.fsmonitor, core.pager, hooks). Every check here is
 * pure node:fs/node:crypto, no subprocess.
 *
 * Per file, in order: refuse a symlink target outright (even one that
 * resolves inside the root — reading tolerates that, writing does not);
 * re-verify the resolved parent directory is still inside the target root
 * (a poisoned intermediate symlink could otherwise redirect the write);
 * refuse non-UTF-8 content (defense in depth — planFixes() already
 * filters this out, but a caller could hand us a hand-built FixPlan);
 * refuse if the file's content changed since planFixes() (hash mismatch);
 * only then write, atomically, preserving the original file's mode.
 */
export function applyFixes(plan: FixPlan): ApplyResult {
  const rootReal = realpathSync(plan.target);
  const written: string[] = [];
  const driftSkipped: string[] = [];
  const refusedUnsafe: { file: string; reason: string }[] = [...plan.refusedUnsafe];

  for (const fix of plan.fixes) {
    const absPath = path.join(plan.target, fix.file);

    let stat;
    try {
      stat = lstatSync(absPath);
    } catch {
      refusedUnsafe.push({ file: fix.file, reason: "target no longer exists" });
      continue;
    }
    if (stat.isSymbolicLink()) {
      refusedUnsafe.push({ file: fix.file, reason: "target is a symlink — writes are refused" });
      continue;
    }
    if (!stat.isFile()) {
      refusedUnsafe.push({ file: fix.file, reason: "target is not a regular file" });
      continue;
    }

    const dirReal = realpathSync(path.dirname(absPath));
    if (!isInsideRoot(rootReal, dirReal)) {
      refusedUnsafe.push({ file: fix.file, reason: "resolved parent directory escapes the target root" });
      continue;
    }

    const currentBuf = readFileSync(absPath);
    if (!isRoundTrippableUtf8(currentBuf)) {
      refusedUnsafe.push({ file: fix.file, reason: "file is not valid UTF-8 — refusing to risk corrupting it" });
      continue;
    }

    const current = currentBuf.toString("utf8");
    if (sha256(current) !== fix.beforeHash) {
      driftSkipped.push(fix.file);
      continue;
    }

    writeAtomically(path.join(dirReal, path.basename(absPath)), fixContent(current), stat.mode & 0o777);
    written.push(fix.file);
  }

  return { ...plan, applied: true, written, driftSkipped, refusedUnsafe };
}
