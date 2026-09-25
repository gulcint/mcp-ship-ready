import { test } from "node:test";
import assert from "node:assert/strict";
import { formatReport } from "../../src/report/format.ts";
import type { ScanReport } from "../../src/scanner/index.ts";

test("formatReport prints a no-findings message for an empty report", () => {
  const report: ScanReport = { target: "/tmp/x", compliant: true, findings: [] };
  const text = formatReport(report);

  assert.match(text, /MCP Ship-Ready scan: \/tmp\/x/);
  assert.match(text, /No findings/);
});

test("formatReport lists each finding with category, rule id and location", () => {
  const report: ScanReport = {
    target: "/tmp/x",
    compliant: false,
    findings: [
      {
        ruleId: "mcp-spec-example",
        file: "src/server.ts",
        line: 12,
        category: "mechanical",
        message: "example finding",
      },
    ],
  };
  const text = formatReport(report);

  assert.match(text, /\[mechanical\] mcp-spec-example src\/server\.ts:12 — example finding/);
});
