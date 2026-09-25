import { readdirSync, readFileSync, realpathSync, statSync } from "node:fs";
import path from "node:path";

const SKIP_DIRS = new Set(["node_modules", ".git", "dist", "build", "__pycache__", ".venv", ".omc"]);
const SCAN_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".py", ".json"]);
const MAX_FILE_BYTES = 2 * 1024 * 1024;

export interface ScannedFile {
  relativePath: string;
  content: string;
}

function isInsideRoot(root: string, candidate: string): boolean {
  const rel = path.relative(root, candidate);
  return rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel));
}

/**
 * Reads text files under `rootPath` for static analysis only. Never executes
 * anything from the target repo. Directory symlinks are never followed (no
 * loop/escape risk); file symlinks are only followed when their resolved
 * target stays inside `rootPath`.
 */
export function collectScannableFiles(rootPath: string): ScannedFile[] {
  const root = realpathSync(rootPath);
  const files: ScannedFile[] = [];

  function walk(dir: string) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const entryPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        if (!SKIP_DIRS.has(entry.name)) walk(entryPath);
        continue;
      }

      if (!SCAN_EXTENSIONS.has(path.extname(entry.name))) continue;

      if (entry.isSymbolicLink()) {
        let real: string;
        try {
          real = realpathSync(entryPath);
        } catch {
          continue; // broken symlink
        }
        if (!isInsideRoot(root, real)) continue; // never follow outside the target root
        const targetStat = statSync(real);
        if (!targetStat.isFile() || targetStat.size > MAX_FILE_BYTES) continue;
        files.push({ relativePath: path.relative(root, entryPath), content: readFileSync(real, "utf8") });
        continue;
      }

      if (!entry.isFile()) continue;
      if (statSync(entryPath).size > MAX_FILE_BYTES) continue;
      files.push({ relativePath: path.relative(root, entryPath), content: readFileSync(entryPath, "utf8") });
    }
  }

  walk(root);
  return files;
}
