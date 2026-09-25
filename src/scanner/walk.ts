import { readdirSync, readFileSync, realpathSync, statSync, type Dirent } from "node:fs";
import path from "node:path";

const SKIP_DIRS = new Set(["node_modules", ".git", "dist", "build", "__pycache__", ".venv", ".omc"]);
const SCAN_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".py", ".json"]);
const MAX_FILE_BYTES = 2 * 1024 * 1024;

export interface ScannedFile {
  relativePath: string;
  content: string;
}

export interface WalkLimits {
  maxFiles: number;
  maxTotalBytes: number;
}

export const DEFAULT_WALK_LIMITS: WalkLimits = { maxFiles: 5000, maxTotalBytes: 100 * 1024 * 1024 };

export interface WalkSummary {
  truncated: boolean;
  truncationReason?: string;
  skippedPaths: string[];
}

function isInsideRoot(root: string, candidate: string): boolean {
  const rel = path.relative(root, candidate);
  return rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel));
}

/**
 * Streams text files under `rootPath` one at a time for static analysis
 * only — never executes anything from the target repo, never holds every
 * file's content in memory at once. Stops once `limits.maxFiles` or
 * `limits.maxTotalBytes` is reached (reported via the generator's return
 * value) instead of scanning an unbounded amount of untrusted input. A
 * directory or file that can't be read (e.g. EACCES) is skipped and
 * recorded, not thrown.
 */
export function* collectScannableFiles(
  rootPath: string,
  limits: WalkLimits = DEFAULT_WALK_LIMITS,
): Generator<ScannedFile, WalkSummary> {
  const skippedPaths: string[] = [];
  let filesYielded = 0;
  let totalBytes = 0;
  let truncated = false;
  let truncationReason: string | undefined;

  let root: string;
  try {
    root = realpathSync(rootPath);
  } catch {
    return { truncated: false, skippedPaths: [rootPath] };
  }

  function* walk(dir: string): Generator<ScannedFile> {
    let entries: Dirent[];
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      skippedPaths.push(path.relative(root, dir) || ".");
      return;
    }

    for (const entry of entries) {
      if (truncated) return;
      const entryPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        if (!SKIP_DIRS.has(entry.name)) yield* walk(entryPath);
        continue;
      }

      if (!SCAN_EXTENSIONS.has(path.extname(entry.name))) continue;

      let readPath = entryPath;
      if (entry.isSymbolicLink()) {
        let real: string;
        try {
          real = realpathSync(entryPath);
        } catch {
          continue; // broken symlink
        }
        if (!isInsideRoot(root, real)) continue; // never follow outside the target root
        readPath = real;
      } else if (!entry.isFile()) {
        continue;
      }

      let size: number;
      try {
        const stat = statSync(readPath);
        if (!stat.isFile() || stat.size > MAX_FILE_BYTES) continue;
        size = stat.size;
      } catch {
        skippedPaths.push(path.relative(root, entryPath));
        continue;
      }

      if (filesYielded >= limits.maxFiles) {
        truncated = true;
        truncationReason = `file count limit (${limits.maxFiles}) reached`;
        return;
      }
      if (totalBytes + size > limits.maxTotalBytes) {
        truncated = true;
        truncationReason = `total size limit (${limits.maxTotalBytes} bytes) reached`;
        return;
      }

      let content: string;
      try {
        content = readFileSync(readPath, "utf8");
      } catch {
        skippedPaths.push(path.relative(root, entryPath));
        continue;
      }

      filesYielded++;
      totalBytes += size;
      yield { relativePath: path.relative(root, entryPath), content };
    }
  }

  yield* walk(root);
  return { truncated, truncationReason, skippedPaths };
}
