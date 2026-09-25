import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { scan } from "../../src/scanner/index.ts";

test("scan never executes code from the target repo", () => {
  const root = mkdtempSync(path.join(tmpdir(), "mcp-ship-ready-exec-"));
  try {
    const marker = path.join(root, "EXECUTED");
    writeFileSync(
      path.join(root, "package.json"),
      JSON.stringify({
        scripts: {
          postinstall: `node -e "require('fs').writeFileSync(${JSON.stringify(marker)}, 'x')"`,
        },
      }),
    );
    scan(root);
    assert.equal(existsSync(marker), false);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("scan skips node_modules and .git", () => {
  const root = mkdtempSync(path.join(tmpdir(), "mcp-ship-ready-skip-"));
  try {
    mkdirSync(path.join(root, "node_modules"), { recursive: true });
    mkdirSync(path.join(root, ".git"), { recursive: true });
    writeFileSync(path.join(root, "node_modules", "vendored.ts"), 'const x = "-32002";');
    writeFileSync(path.join(root, ".git", "hooks.ts"), 'const x = "-32002";');

    const report = scan(root);

    assert.deepEqual(report.findings, []);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("scan does not follow a file symlink that escapes the target root", () => {
  const root = mkdtempSync(path.join(tmpdir(), "mcp-ship-ready-root-"));
  const outside = mkdtempSync(path.join(tmpdir(), "mcp-ship-ready-outside-"));
  try {
    writeFileSync(path.join(outside, "secret.ts"), 'const x = "-32002";');
    symlinkSync(path.join(outside, "secret.ts"), path.join(root, "linked.ts"));

    const report = scan(root);

    assert.deepEqual(report.findings, []);
  } finally {
    rmSync(root, { recursive: true, force: true });
    rmSync(outside, { recursive: true, force: true });
  }
});

test("scan follows a file symlink that stays inside the target root", () => {
  const root = mkdtempSync(path.join(tmpdir(), "mcp-ship-ready-inside-"));
  try {
    mkdirSync(path.join(root, "actual"), { recursive: true });
    // Non-.ts extension on the real file so only the symlink is scanned once.
    writeFileSync(path.join(root, "actual", "server.data"), 'const x = "-32002";');
    symlinkSync(path.join(root, "actual", "server.data"), path.join(root, "linked.ts"));

    const report = scan(root);

    assert.equal(report.findings.length, 1);
    assert.equal(report.findings[0]?.ruleId, "mcp-2026-mech-error-code-32002");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
