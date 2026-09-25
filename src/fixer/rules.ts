import { numericTokenPattern } from "../scanner/rules.ts";

/**
 * Allowlist of rule IDs this tool is allowed to auto-fix, and how. Deliberately
 * kept separate from src/scanner/rules.ts (not a `fix` field on Rule): an
 * architectural finding must never be auto-changed (BRIEF.md "Kapsam"), and
 * keeping that decision in this file's own allowlist — rather than trusting
 * every scanner rule definition to never accidentally grow a fixer — means
 * src/fixer/index.ts only needs to trust one small, reviewable map.
 *
 * Each fixer is a pure function: given a file's full text, return the fixed
 * text. Reuses scanner/rules.ts's numericTokenPattern (the exact pattern the
 * matching rule's `detect` uses), not a second hand-written regex, so a fix
 * can never disagree with detection about what counts as a match.
 */
export const FIXERS: Record<string, (content: string) => string> = {
  "mcp-2026-mech-error-code-32002": (content) => content.replace(numericTokenPattern("-32002"), "-32602"),
};
