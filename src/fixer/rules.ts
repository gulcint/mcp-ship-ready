/**
 * Allowlist of rule IDs this tool is allowed to auto-fix, and how. Deliberately
 * kept separate from src/scanner/rules.ts (not a `fix` field on Rule): an
 * architectural finding must never be auto-changed (BRIEF.md "Kapsam"), and
 * keeping that decision in this file's own allowlist — rather than trusting
 * every scanner rule definition to never accidentally grow a fixer — means
 * src/fixer/index.ts only needs to trust one small, reviewable map.
 *
 * Each fixer is a pure function: given a file's full text, return the fixed
 * text. Uses the same digit/dot-boundary-aware pattern as the matching
 * rule's `detect` in src/scanner/rules.ts (not a blind replaceAll), so a fix
 * never touches a larger token like "-320021" or "-32002.5" that `detect`
 * itself wouldn't have flagged.
 */
export const FIXERS: Record<string, (content: string) => string> = {
  "mcp-2026-mech-error-code-32002": (content) => content.replace(/(?<![\d.])-32002(?![\d.])/g, "-32602"),
};
