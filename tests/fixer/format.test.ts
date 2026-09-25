import { test } from "node:test";
import assert from "node:assert/strict";
import { formatFixPreview, formatApplyResult } from "../../src/fixer/format.ts";
import type { ApplyResult, FileFix, FixPlan } from "../../src/fixer/index.ts";

function basePlan(fixes: FileFix[]): FixPlan {
  return { target: "/tmp/x", applied: false, fixes, architecturalSkipped: [], refusedUnsafe: [] };
}

function fix(file: string, changes: FileFix["changes"]): FileFix {
  return { file, ruleIds: ["mcp-2026-mech-error-code-32002"], changes, beforeHash: "irrelevant" };
}

test("formatFixPreview bounds a 1.5MB single-line change well under 64KB and marks the cut", () => {
  const huge = "x".repeat(1_500_000);
  const plan = basePlan([fix("src/server.ts", [{ line: 1, before: huge, after: huge }])]);

  const text = formatFixPreview(plan);

  assert.ok(text.length < 64 * 1024, `expected < 64KB, got ${text.length} bytes`);
  assert.match(text, /…\(\+1499800 chars\)/); // 1_500_000 - 200 kept
});

test("formatFixPreview never truncates in the middle of an escape sequence", () => {
  // Put a control character straddling the 200-char cut point so a naive
  // "escape then truncate" implementation would slice a \xNN token in half.
  const before = "a".repeat(198) + "\x1b" + "b".repeat(50);
  const plan = basePlan([fix("src/server.ts", [{ line: 1, before, after: before }])]);

  const text = formatFixPreview(plan);

  // No dangling/partial escape token anywhere in the output.
  assert.doesNotMatch(text, /\\x(?![0-9a-f]{2,6}\b)/i);
  assert.equal(text.includes("\x1b"), false); // never raw
});

test("formatFixPreview leaves short lines (under 200 chars) unchanged", () => {
  const before = "const x = -32002;";
  const plan = basePlan([fix("src/server.ts", [{ line: 3, before, after: "const x = -32602;" }])]);

  const text = formatFixPreview(plan);

  assert.match(text, /- line 3: const x = -32002;$/m);
  assert.equal(text.includes("…(+"), false);
});

test("formatFixPreview summarizes changes past the cap without misreporting the true totals", () => {
  const changes = Array.from({ length: 25 }, (_, i) => ({
    line: i + 1,
    before: `const x = -32002; // ${i}`,
    after: `const x = -32602; // ${i}`,
  }));
  const plan = basePlan([fix("src/server.ts", changes)]);

  const text = formatFixPreview(plan);

  assert.match(text, /^1 file\(s\) would be changed:$/m); // true file count, unaffected by the cap
  assert.match(text, /… and 5 more change\(s\), not shown\.$/m);
  const shownChangeLines = text.split("\n").filter((l) => l.trim().startsWith("- line")).length;
  assert.equal(shownChangeLines, 20);
});

test("formatFixPreview caps changes across multiple files too, not just within one file", () => {
  const perFileChange = (n: number) =>
    Array.from({ length: n }, (_, i) => ({
      line: i + 1,
      before: `const x = -32002; // ${i}`,
      after: `const x = -32602; // ${i}`,
    }));
  const plan = basePlan([
    fix("a.ts", perFileChange(12)),
    fix("b.ts", perFileChange(12)),
    fix("c.ts", perFileChange(1)),
  ]);

  const text = formatFixPreview(plan);

  assert.match(text, /^3 file\(s\) would be changed:$/m); // true total, unaffected
  assert.match(text, /… and 5 more change\(s\), not shown\.$/m);
  const shownChangeLines = text.split("\n").filter((l) => l.trim().startsWith("- line")).length;
  assert.equal(shownChangeLines, 20);
  assert.equal(text.includes("c.ts"), false); // never reached before the cap
});

test("formatApplyResult does not show diff content at all (nothing to truncate there)", () => {
  const result: ApplyResult = {
    ...basePlan([]),
    applied: true,
    written: ["src/server.ts"],
    driftSkipped: [],
  };

  const text = formatApplyResult(result);

  assert.match(text, /Wrote 1 file\(s\):/);
  assert.equal(text.includes("line 1"), false);
});
