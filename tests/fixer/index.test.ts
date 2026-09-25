import { test } from "node:test";
import assert from "node:assert/strict";
import { chmodSync, cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, symlinkSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import path from "node:path";
import { scan } from "../../src/scanner/index.ts";
import { planFixes, applyFixes } from "../../src/fixer/index.ts";

const fixturesDir = path.join(import.meta.dirname, "fixtures");

test("planFixes computes the mechanical fix for a mechanical-only fixture without writing to disk", () => {
  const dir = path.join(fixturesDir, "mechanical-only");
  const before = readFileSync(path.join(dir, "src", "server.ts"), "utf8");

  const report = scan(dir);
  const plan = planFixes(report, dir);

  assert.equal(plan.applied, false);
  assert.equal(plan.fixes.length, 1);
  assert.equal(plan.fixes[0]?.file, path.join("src", "server.ts"));
  assert.deepEqual(plan.fixes[0]?.ruleIds, ["mcp-2026-mech-error-code-32002"]);
  assert.equal(plan.fixes[0]?.changes.length, 1);
  assert.match(plan.fixes[0]?.changes[0]?.before ?? "", /-32002/);
  assert.match(plan.fixes[0]?.changes[0]?.after ?? "", /-32602/);
  assert.equal(plan.fixes[0]?.beforeHash, createHash("sha256").update(before, "utf8").digest("hex"));

  const stillOnDisk = readFileSync(path.join(dir, "src", "server.ts"), "utf8");
  assert.equal(stillOnDisk, before); // planFixes never writes
});

test("planFixes never proposes a fix for an architectural-only fixture", () => {
  const dir = path.join(fixturesDir, "architectural-only");

  const report = scan(dir);
  const plan = planFixes(report, dir);

  assert.deepEqual(plan.fixes, []);
  // The fixture's "Mcp-Session-Id" literal appears twice (header lookup + error message).
  assert.equal(plan.architecturalSkipped.length, 2);
  for (const skipped of plan.architecturalSkipped) {
    assert.equal(skipped.ruleId, "mcp-2026-arch-stateless-handshake");
    assert.equal(skipped.file, path.join("src", "server.ts"));
  }
});

test("planFixes fixes only the mechanical finding in a file with both categories", () => {
  const dir = path.join(fixturesDir, "mixed");

  const report = scan(dir);
  const plan = planFixes(report, dir);

  assert.equal(plan.fixes.length, 1);
  assert.deepEqual(plan.fixes[0]?.ruleIds, ["mcp-2026-mech-error-code-32002"]);
  // Only the -32002 line changes; the architectural finding's own line is untouched.
  for (const change of plan.fixes[0]?.changes ?? []) {
    assert.equal(change.before.includes("Mcp-Session-Id"), false);
  }
  assert.equal(plan.architecturalSkipped.length, 1);
  assert.equal(plan.architecturalSkipped[0]?.ruleId, "mcp-2026-arch-stateless-handshake");
});

test("applyFixes writes the mechanical fix, and a re-scan no longer reports it", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "mcp-ship-ready-fixer-apply-"));
  try {
    cpSync(path.join(fixturesDir, "mechanical-only"), dir, { recursive: true });

    const before = scan(dir);
    assert.equal(before.findings.length, 1);

    const plan = planFixes(before, dir);
    const applied = applyFixes(plan);
    assert.equal(applied.applied, true);

    const fixedContent = readFileSync(path.join(dir, "src", "server.ts"), "utf8");
    assert.match(fixedContent, /-32602/);
    assert.equal(fixedContent.includes("-32002"), false);

    const after = scan(dir);
    assert.deepEqual(after.findings, []); // the fixed finding is gone
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("applyFixes never writes the file behind an architectural-only finding", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "mcp-ship-ready-fixer-arch-"));
  try {
    cpSync(path.join(fixturesDir, "architectural-only"), dir, { recursive: true });
    const before = readFileSync(path.join(dir, "src", "server.ts"), "utf8");

    const report = scan(dir);
    const plan = planFixes(report, dir);
    applyFixes(plan); // plan.fixes is empty, so this must be a no-op

    const after = readFileSync(path.join(dir, "src", "server.ts"), "utf8");
    assert.equal(after, before);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("applyFixes on a mixed file changes only the mechanical line, leaving the architectural one byte-identical", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "mcp-ship-ready-fixer-mixed-"));
  try {
    cpSync(path.join(fixturesDir, "mixed"), dir, { recursive: true });
    const before = readFileSync(path.join(dir, "src", "server.ts"), "utf8");
    const beforeLines = before.split("\n");
    const sessionLineIndex = beforeLines.findIndex((l) => l.includes("Mcp-Session-Id"));

    const report = scan(dir);
    applyFixes(planFixes(report, dir));

    const after = readFileSync(path.join(dir, "src", "server.ts"), "utf8");
    const afterLines = after.split("\n");

    assert.equal(afterLines[sessionLineIndex], beforeLines[sessionLineIndex]); // untouched
    assert.equal(after.includes("-32002"), false);
    assert.match(after, /-32602/);

    const rescan = scan(dir);
    assert.equal(rescan.findings.length, 1);
    assert.equal(rescan.findings[0]?.category, "architectural"); // only the architectural one remains
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("applyFixes refuses to write a file that changed since planFixes() ran (drift)", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "mcp-ship-ready-fixer-drift-"));
  try {
    cpSync(path.join(fixturesDir, "mechanical-only"), dir, { recursive: true });
    const target = path.join(dir, "src", "server.ts");

    const plan = planFixes(scan(dir), dir);
    assert.equal(plan.fixes.length, 1);

    // The file changes after the plan was computed but before it's applied.
    writeFileSync(target, `${readFileSync(target, "utf8")}\n// edited after preview\n`);
    const editedContent = readFileSync(target, "utf8");

    const result = applyFixes(plan);

    assert.deepEqual(result.written, []);
    assert.deepEqual(result.driftSkipped, [path.join("src", "server.ts")]);
    assert.equal(readFileSync(target, "utf8"), editedContent); // untouched
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("applyFixes never writes through a symlink, even one that resolves inside the target root", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "mcp-ship-ready-fixer-symlink-"));
  try {
    cpSync(path.join(fixturesDir, "mechanical-only"), dir, { recursive: true });
    const realFile = path.join(dir, "src", "server.ts");
    const linkFile = path.join(dir, "src", "linked.ts");
    // Real target has a non-scanned extension so only the symlink is detected once.
    const realTarget = path.join(dir, "src", "server.data");
    writeFileSync(realTarget, readFileSync(realFile, "utf8"));
    rmSync(realFile);
    symlinkSync(realTarget, linkFile);
    const beforeReal = readFileSync(realTarget, "utf8");

    const plan = planFixes(scan(dir), dir);
    assert.equal(plan.fixes.length, 1);
    assert.equal(plan.fixes[0]?.file, path.join("src", "linked.ts"));

    const result = applyFixes(plan);

    assert.deepEqual(result.written, []);
    assert.equal(result.refusedUnsafe.length, 1);
    assert.equal(result.refusedUnsafe[0]?.file, path.join("src", "linked.ts"));
    assert.match(result.refusedUnsafe[0]?.reason ?? "", /symlink/);
    assert.equal(readFileSync(realTarget, "utf8"), beforeReal); // untouched
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("applyFixes preserves the original file's permission bits", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "mcp-ship-ready-fixer-mode-"));
  try {
    cpSync(path.join(fixturesDir, "mechanical-only"), dir, { recursive: true });
    const target = path.join(dir, "src", "server.ts");
    chmodSync(target, 0o755);

    applyFixes(planFixes(scan(dir), dir));

    assert.equal(statSync(target).mode & 0o777, 0o755);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("planFixes and applyFixes refuse a file that is not valid UTF-8, instead of corrupting it", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "mcp-ship-ready-fixer-utf8-"));
  try {
    mkdirSync(path.join(dir, "src"), { recursive: true });
    const target = path.join(dir, "src", "server.ts");
    // A trailing lone byte (0xe9) that is not valid UTF-8 on its own.
    const originalBuf = Buffer.concat([Buffer.from("const x = { code: -32002 }; // caf"), Buffer.from([0xe9])]);
    writeFileSync(target, originalBuf);

    const plan = planFixes(scan(dir), dir);

    assert.deepEqual(plan.fixes, []); // never proposed as fixable
    assert.equal(plan.refusedUnsafe.length, 1);
    assert.equal(plan.refusedUnsafe[0]?.file, path.join("src", "server.ts"));
    assert.match(plan.refusedUnsafe[0]?.reason ?? "", /UTF-8/);
    assert.deepEqual(readFileSync(target), originalBuf); // untouched, byte for byte

    // Defense in depth: even a hand-built plan pointing at this file must be refused at apply time.
    const handBuiltPlan = {
      target: dir,
      applied: false,
      architecturalSkipped: [],
      refusedUnsafe: [],
      fixes: [
        {
          file: path.join("src", "server.ts"),
          ruleIds: ["mcp-2026-mech-error-code-32002"],
          changes: [],
          beforeHash: "irrelevant-because-utf8-check-runs-first",
        },
      ],
    };
    const applied = applyFixes(handBuiltPlan);

    assert.deepEqual(applied.written, []);
    assert.equal(applied.refusedUnsafe.some((r) => /UTF-8/.test(r.reason)), true);
    assert.deepEqual(readFileSync(target), originalBuf); // still untouched
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
