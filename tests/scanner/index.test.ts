import { test } from "node:test";
import assert from "node:assert/strict";
import { scan } from "../../src/scanner/index.ts";

test("scan returns a report shaped for the CLI/report pipeline", () => {
  const report = scan("./fixtures/does-not-need-to-exist-yet");

  assert.equal(report.target, "./fixtures/does-not-need-to-exist-yet");
  assert.equal(Array.isArray(report.findings), true);
  assert.equal(report.findings.length, 0);
  assert.equal(report.compliant, true);
});
