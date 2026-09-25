import { test } from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";

const execFileAsync = promisify(execFile);
const cliPath = path.join(import.meta.dirname, "..", "src", "cli.ts");

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
