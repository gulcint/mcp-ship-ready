export type FindingCategory = "mechanical" | "architectural";

export interface RuleMatch {
  line: number;
  message: string;
}

export interface Rule {
  id: string;
  category: FindingCategory;
  /** Source section of the official MCP 2026-07-28 spec this rule is derived from. */
  source: string;
  detect(content: string): RuleMatch[];
}

/** Plain per-line substring search — no backtracking, safe on untrusted input. */
function findLiteral(content: string, literal: string, message: string): RuleMatch[] {
  const matches: RuleMatch[] = [];
  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(literal)) {
      matches.push({ line: i + 1, message });
    }
  }
  return matches;
}

/**
 * Digit/dot-boundary-aware pattern for a numeric literal (e.g. an error
 * code): won't match inside a larger token like "-320021", "1-32002" or
 * "-32002.5". Fixed-width lookaround, no backtracking — safe on untrusted
 * input. Exported so src/fixer/rules.ts's matching fix uses this exact
 * pattern too, instead of a second hand-written copy that could drift out
 * of sync with what detection actually flags.
 */
export function numericTokenPattern(literal: string): RegExp {
  return new RegExp(`(?<![\\d.])${literal}(?![\\d.])`, "g");
}

function findNumericToken(content: string, literal: string, message: string): RuleMatch[] {
  const pattern = numericTokenPattern(literal);
  const matches: RuleMatch[] = [];
  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    if (pattern.test(lines[i])) {
      matches.push({ line: i + 1, message });
    }
    pattern.lastIndex = 0;
  }
  return matches;
}

export const rules: Rule[] = [
  {
    id: "mcp-2026-mech-error-code-32002",
    category: "mechanical",
    source:
      "changelog.mdx, Minor changes #6 (docs/specification/2026-07-28/changelog.mdx): " +
      "resource-not-found error code -32002 renumbered to -32602 (JSON-RPC Invalid Params).",
    detect: (content) =>
      findNumericToken(
        content,
        "-32002",
        "Deprecated JSON-RPC error code -32002 (resource not found). The 2026-07-28 spec " +
          "renumbers this to -32602 (Invalid Params).",
      ),
  },
  {
    id: "mcp-2026-arch-stateless-handshake",
    category: "architectural",
    source:
      "changelog.mdx, Major changes #1-#3 (docs/specification/2026-07-28/changelog.mdx): " +
      "protocol-level sessions and the initialize/notifications/initialized handshake are " +
      "removed in favor of per-request _meta fields and server/discover.",
    detect: (content) => [
      ...findLiteral(
        content,
        "Mcp-Session-Id",
        "Mcp-Session-Id header relies on the removed protocol-level session model. " +
          "Migrating to stateless per-request _meta fields is an architectural change — report only.",
      ),
      ...findLiteral(
        content,
        "notifications/initialized",
        "notifications/initialized is part of the removed initialize handshake. Migrating to " +
          "the stateless request model is an architectural change — report only.",
      ),
    ],
  },
  {
    id: "mcp-2026-arch-dynamic-client-registration",
    category: "architectural",
    source:
      "deprecated.mdx DCR row + basic/authorization/client-registration.mdx " +
      "(docs/specification/2026-07-28/): OAuth 2.0 Dynamic Client Registration (RFC 7591) is " +
      "deprecated in favor of Client ID Metadata Documents (CIMD).",
    detect: (content) =>
      findLiteral(
        content,
        "registration_endpoint",
        "registration_endpoint indicates OAuth Dynamic Client Registration (RFC 7591), " +
          "deprecated in favor of Client ID Metadata Documents. Migrating auth is an " +
          "architectural change — report only.",
      ),
  },
];
