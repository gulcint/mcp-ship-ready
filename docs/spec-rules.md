# MCP 2026-07-28 spec rules

Human-readable index of the rules implemented in `src/scanner/rules.ts`.
This is a v1 starting set, not an exhaustive rendering of every spec
change — each rule cites the exact spec section it was derived from so new
rules can be added the same way later (task-2026-09-25-0003 follow-ups).

Primary source: official MCP spec repo,
`modelcontextprotocol/modelcontextprotocol` on GitHub,
`docs/specification/2026-07-28/`.

| Rule ID | Category | Spec source | What it detects |
| --- | --- | --- | --- |
| `mcp-2026-mech-error-code-32002` | mechanical | [changelog.mdx](https://raw.githubusercontent.com/modelcontextprotocol/modelcontextprotocol/main/docs/specification/2026-07-28/changelog.mdx), Minor changes #6 | Literal `-32002` (old resource-not-found code, renumbered to `-32602`). |
| `mcp-2026-arch-stateless-handshake` | architectural | [changelog.mdx](https://raw.githubusercontent.com/modelcontextprotocol/modelcontextprotocol/main/docs/specification/2026-07-28/changelog.mdx), Major changes #1-#3 | `Mcp-Session-Id` header or `notifications/initialized` — remnants of the removed session/initialize handshake. |
| `mcp-2026-arch-dynamic-client-registration` | architectural | [deprecated.mdx](https://raw.githubusercontent.com/modelcontextprotocol/modelcontextprotocol/main/docs/specification/2026-07-28/deprecated.mdx) + [client-registration.mdx](https://raw.githubusercontent.com/modelcontextprotocol/modelcontextprotocol/main/docs/specification/2026-07-28/basic/authorization/client-registration.mdx) | `registration_endpoint` — indicates OAuth Dynamic Client Registration (RFC 7591), deprecated in favor of Client ID Metadata Documents (CIMD). |

## Why mechanical vs architectural

- **Mechanical**: a literal, unambiguous find-replace (e.g. a renumbered
  error code). Safe to auto-fix later (task-2026-09-25-0004).
- **Architectural**: fixing the finding requires redesigning request flow
  or auth — e.g. moving from a session handshake to per-request `_meta`
  fields, or standing up a Client ID Metadata Document endpoint. Reported
  only, never auto-changed (BRIEF.md "Kapsam").

## Detection approach

Plain per-line literal substring matching (`String.includes`), not AST
parsing — every current rule keys off an exact protocol-level token
(header name, notification name, field name, error code), so AST would add
implementation cost without meaningfully improving precision here. Revisit
per-rule if a future rule needs structural context an AST would provide.
