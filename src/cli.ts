import { parseArgs } from "node:util";
import { existsSync } from "node:fs";
import { scan } from "./scanner/index.ts";
import { formatReport } from "./report/format.ts";
import { applyFixes, planFixes } from "./fixer/index.ts";
import { formatApplyResult, formatFixPreview } from "./fixer/format.ts";

const USAGE = "Usage: mcp-ship-ready <scan|fix|fix-apply> <repo-path>";

/**
 * `fix` and `fix-apply` are separate subcommands, not one `fix` command
 * with an `--apply` flag: commands/fix.md and commands/fix-apply.md each
 * inject one exact, fixed command line, and `fix`'s code path never reads
 * or acts on anything resembling an "apply" flag. That closes off the
 * class of risk where a crafted $ARGUMENTS value smuggles an extra shell
 * word into the preview-only command — even if it did, there'd be nothing
 * here for it to trigger. Bonus: parseArgs (strict by default) throws on
 * any unrecognized option, so an injected "--apply"-looking token crashes
 * `fix` before reaching any fs write — fails closed, not silently ignored.
 */
function main(argv: string[]): number {
  const { positionals } = parseArgs({ args: argv, allowPositionals: true });
  const [command, target] = positionals;

  if (command !== "scan" && command !== "fix" && command !== "fix-apply") {
    console.error(`Unknown command: ${command ?? "(none)"}. ${USAGE}`);
    return 2;
  }

  const targetPath = target && target.length > 0 ? target : ".";
  if (!existsSync(targetPath)) {
    console.error(`Path not found: ${targetPath}`);
    return 2;
  }

  if (command === "scan") {
    console.log(formatReport(scan(targetPath)));
    return 0;
  }

  const plan = planFixes(scan(targetPath), targetPath);
  if (command === "fix") {
    console.log(formatFixPreview(plan));
    return 0;
  }

  console.log(formatApplyResult(applyFixes(plan)));
  return 0;
}

process.exitCode = main(process.argv.slice(2));
