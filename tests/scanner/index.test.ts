import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { scan } from "../../src/scanner/index.ts";

const fixturesDir = path.join(import.meta.dirname, "fixtures");

test("scan flags a mechanical finding on a repo with a deprecated error code", () => {
  const report = scan(path.join(fixturesDir, "ts-mechanical"));

  assert.equal(report.compliant, false);
  assert.equal(report.findings.length, 1);
  assert.equal(report.findings[0]?.ruleId, "mcp-2026-mech-error-code-32002");
  assert.equal(report.findings[0]?.category, "mechanical");
  assert.equal(report.findings[0]?.file, path.join("src", "server.ts"));
  assert.ok(report.findings[0]?.line > 0);
});

test("scan flags architectural findings on a repo with the removed session handshake", () => {
  const report = scan(path.join(fixturesDir, "ts-architectural"));

  assert.equal(report.compliant, false);
  assert.ok(report.findings.length >= 2);
  for (const finding of report.findings) {
    assert.equal(finding.ruleId, "mcp-2026-arch-stateless-handshake");
    assert.equal(finding.category, "architectural");
  }
});

test("scan reports no findings on a spec-compliant repo (no false positives)", () => {
  const report = scan(path.join(fixturesDir, "ts-compliant"));

  assert.equal(report.compliant, true);
  assert.deepEqual(report.findings, []);
});

test("scan applies the same rule set to a Python repo", () => {
  const report = scan(path.join(fixturesDir, "python-mixed"));

  const ruleIds = report.findings.map((f) => f.ruleId).sort();
  assert.deepEqual(ruleIds, [
    "mcp-2026-arch-dynamic-client-registration",
    "mcp-2026-mech-error-code-32002",
  ]);
  assert.equal(
    report.findings.find((f) => f.ruleId === "mcp-2026-mech-error-code-32002")?.category,
    "mechanical",
  );
  assert.equal(
    report.findings.find((f) => f.ruleId === "mcp-2026-arch-dynamic-client-registration")?.category,
    "architectural",
  );
  for (const finding of report.findings) {
    assert.equal(finding.file, "server.py");
  }
});

test("every finding includes rule id, file, line, category and a human-readable message", () => {
  const report = scan(path.join(fixturesDir, "python-mixed"));

  for (const finding of report.findings) {
    assert.equal(typeof finding.ruleId, "string");
    assert.equal(typeof finding.file, "string");
    assert.equal(typeof finding.line, "number");
    assert.ok(finding.category === "mechanical" || finding.category === "architectural");
    assert.ok(finding.message.length > 0);
  }
});
