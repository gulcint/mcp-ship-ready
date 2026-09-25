import { parseArgs } from "node:util";
import { existsSync } from "node:fs";
import { scan } from "./scanner/index.ts";
import { formatReport } from "./report/format.ts";

function main(argv: string[]): number {
  const { positionals } = parseArgs({ args: argv, allowPositionals: true });
  const [command, target] = positionals;

  if (command !== "scan") {
    console.error(
      `Unknown command: ${command ?? "(none)"}. Usage: mcp-ship-ready scan <repo-path>`,
    );
    return 2;
  }

  const targetPath = target && target.length > 0 ? target : ".";
  if (!existsSync(targetPath)) {
    console.error(`Path not found: ${targetPath}`);
    return 2;
  }

  const report = scan(targetPath);
  console.log(formatReport(report));
  return 0;
}

process.exitCode = main(process.argv.slice(2));
