import { test } from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { cpSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const execFileAsync = promisify(execFile);
const cliPath = path.join(import.meta.dirname, "..", "src", "cli.ts");
const fixerFixturesDir = path.join(import.meta.dirname, "fixer", "fixtures");

test("scan command runs end to end against this repo and exits 0", async () => {
  const { stdout } = await execFileAsync("node", [
    "--experimental-strip-types",
    cliPath,
    "scan",
    ".",
  ]);

  assert.match(stdout, /MCP Ship-Ready scan: \./);
});

test("unknown command exits with code 2", async () => {
  await assert.rejects(
    execFileAsync("node", ["--experimental-strip-types", cliPath, "bogus"]),
    (err: unknown) => {
      assert.equal((err as { code: number }).code, 2);
      return true;
    },
  );
});

test("missing path exits with code 2", async () => {
  await assert.rejects(
    execFileAsync("node", [
      "--experimental-strip-types",
      cliPath,
      "scan",
      "./does-not-exist-anywhere",
    ]),
    (err: unknown) => {
      assert.equal((err as { code: number }).code, 2);
      return true;
    },
  );
});

test("fix previews a mechanical finding without writing to disk", async () => {
  const dir = path.join(fixerFixturesDir, "mechanical-only");
  const before = readFileSync(path.join(dir, "src", "server.ts"), "utf8");

  const { stdout } = await execFileAsync("node", ["--experimental-strip-types", cliPath, "fix", dir]);

  assert.match(stdout, /MCP Ship-Ready fix preview/);
  assert.match(stdout, /-32002/);
  assert.match(stdout, /-32602/);
  assert.match(stdout, /Nothing has been written/);
  assert.equal(readFileSync(path.join(dir, "src", "server.ts"), "utf8"), before); // untouched
});

test("fix fails closed on an --apply-style extra argument instead of applying anything", async () => {
  const dir = path.join(fixerFixturesDir, "mechanical-only");
  const before = readFileSync(path.join(dir, "src", "server.ts"), "utf8");

  // Simulates the extra shell word a crafted $ARGUMENTS quote-breakout
  // could smuggle in (see commands/fix.md). `fix` has no flag parsing for
  // "apply" at all — node:util's parseArgs rejects any unrecognized
  // option outright (strict by default), so this throws before any fs
  // write is reached. Failing loudly here is the safe outcome, not a bug.
  await assert.rejects(
    execFileAsync("node", ["--experimental-strip-types", cliPath, "fix", dir, "--apply"]),
  );

  assert.equal(readFileSync(path.join(dir, "src", "server.ts"), "utf8"), before); // untouched
});

test("fix-apply writes the mechanical fix, and a re-scan no longer reports it", async () => {
  const dir = mkdtempSync(path.join(tmpdir(), "mcp-ship-ready-cli-fixapply-"));
  try {
    cpSync(path.join(fixerFixturesDir, "mechanical-only"), dir, { recursive: true });

    const { stdout } = await execFileAsync("node", [
      "--experimental-strip-types",
      cliPath,
      "fix-apply",
      dir,
    ]);

    assert.match(stdout, /MCP Ship-Ready fix apply/);
    assert.match(stdout, /Wrote 1 file\(s\)/);

    const fixedContent = readFileSync(path.join(dir, "src", "server.ts"), "utf8");
    assert.match(fixedContent, /-32602/);
    assert.equal(fixedContent.includes("-32002"), false);

    const rescan = await execFileAsync("node", ["--experimental-strip-types", cliPath, "scan", dir]);
    assert.match(rescan.stdout, /No findings/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("fix-apply never writes an architectural-only fixture", async () => {
  const dir = mkdtempSync(path.join(tmpdir(), "mcp-ship-ready-cli-fixapply-arch-"));
  try {
    cpSync(path.join(fixerFixturesDir, "architectural-only"), dir, { recursive: true });
    const before = readFileSync(path.join(dir, "src", "server.ts"), "utf8");

    const { stdout } = await execFileAsync("node", [
      "--experimental-strip-types",
      cliPath,
      "fix-apply",
      dir,
    ]);

    assert.match(stdout, /No mechanical fixes available/);
    assert.equal(readFileSync(path.join(dir, "src", "server.ts"), "utf8"), before);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
