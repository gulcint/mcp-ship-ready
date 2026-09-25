# Community Directory submission checklist

Preparation for submitting MCP Ship-Ready to Anthropic's Claude Code
plugin community marketplace. This file **prepares** the submission —
it does not submit anything. Actual submission is a human step (see
"Human gate" below).

## What we're submitting to, and what we're not

MCP Ship-Ready is a **Claude Code plugin** (`.claude-plugin/plugin.json`,
slash commands, no server component) — not a remote MCP connector/app
(the kind with OAuth, tool-calling widgets, and a UI). Those are two
different Anthropic submission processes with different requirements:

- **What applies to us**: submitting a Claude Code plugin to the
  community marketplace, via
  [Publish and distribute a plugin](https://code.claude.com/docs/en/plugins/publish.md)
  ("Submit to the community marketplace" section). No manifest field for
  example prompts or a privacy note exists in this process — see below.
- **What does NOT apply to us**: the Claude *connector* directory's
  submission checklist (OAuth/authless requirement, tool annotations,
  widget layout, screenshots) — that's for remote MCP servers/apps with
  a UI, a different product category from ours. Confirmed by reading the
  actual checklist file locally cached from the official `mcp-server-dev`
  plugin
  (`skills/build-mcp-app/references/directory-checklist.md`), the same
  file task-2026-09-25-0001 flagged as a possible platform risk — it
  turns out to describe a different submission process than the one we
  need.

Sources fetched directly, not guessed:
- https://code.claude.com/docs/en/plugins/publish.md — submission process
- https://code.claude.com/docs/en/plugins/manifest-reference.md — full
  `plugin.json` field list

## Pre-flight checklist (from "Prepare your plugin for release")

- [x] **Permanent kebab-case name**: `mcp-ship-ready`, set since
  task-2026-09-25-0002, unchanged since.
- [x] **Version decided**: `0.1.0`. This is a first release; we're not
  omitting `version`, so future releases need an explicit bump for
  `claude plugin update` to pick them up (see the doc's "Decide how
  you'll version" step).
- [x] **`claude plugin validate .` passes**: exit 0, `Validation passed
  with warnings`. The one warning (`CLAUDE.md at the plugin root is not
  loaded as project context`) is expected — `CLAUDE.md` here is AI
  Company's internal governance file, not plugin-user-facing content;
  moving it into a skill would defeat its purpose. `--strict` does fail
  on this warning; we're intentionally not running `--strict` in CI for
  that reason (documented in this repo's `CLAUDE.md`/CI history).
- [x] **Metadata filled in `plugin.json`**: `description`, `author.name`,
  `homepage`, `repository`, `license`, `keywords`. `author.email` is
  intentionally omitted — the BRIEF records that a direct contact
  person/email hadn't been designated yet; we didn't invent one.
- [x] **`README.md` at the plugin root**: present, and updated in this
  ticket to accurately describe all three commands (`scan`, `fix`,
  `fix-apply`) and their real read/write behavior.
- [x] **Installed from a local marketplace and confirmed it loads**:
  tested with a temporary, uncommitted `.claude-plugin/marketplace.json`
  (`source: "./"`) — `claude plugin marketplace add` +
  `claude plugin install mcp-ship-ready@<test-marketplace>` succeeded,
  `claude plugin list` showed it enabled at version `0.1.0`, and
  `/mcp-ship-ready:scan` ran successfully through the installed copy
  (not `--plugin-dir`) with `permission_denials: []`. The marketplace
  test file was deleted afterward — it's not part of this submission
  package.
- [ ] **Eval suite** (`claude plugin eval`): not applicable — we don't
  have an eval suite (`evals/` directory). The doc marks this step
  conditional ("If you have an eval suite"), not required.

## Example prompts

Not a `plugin.json` field — prepared here as ready-to-use content for
whoever fills out the actual submission form.

1. `/mcp-ship-ready:scan .` — "Check whether my MCP connector repo is
   compliant with the July 2026 MCP spec change before I submit it to
   the Community Directory."
2. `/mcp-ship-ready:fix .` — "Show me which of the compliance findings
   can be auto-fixed, and what the fix would change, before I decide
   whether to apply it."
3. `/mcp-ship-ready:fix-apply .` — "Apply the mechanical fixes now that
   I've reviewed the preview — leave the architectural findings alone,
   those need my own judgment."

## Privacy / data-handling note

Derived from `BRIEF.md`'s "Veri" section (human-approved 2026-09-24/25):

- MCP Ship-Ready is designed for public, open-source MCP connector/
  server repos the user already has locally — private/closed-repo
  support is out of scope for v1. That's the intended use, not a
  technical restriction the plugin enforces: it reads whatever local
  directory path the user gives it, public or private.
- The plugin makes no network calls and has no server component. It
  doesn't "phone home." Its output — including file paths and short
  code excerpts from the target repo (a `fix` preview shows up to 20
  changed lines, each truncated to 200 characters) — is processed
  within the user's own Claude Code session, the same way any command
  output the user runs is.
- MCP Ship-Ready is designed for source code static analysis of MCP
  connector/server repos, not for personal or financial data — but,
  same caveat as above, it reads whatever local directory it's pointed
  at and doesn't inspect content to check whether that's what's there.
- No production access of any kind. `fix-apply` writes only to files
  inside the local target directory the user explicitly passed in.
- The plugin never executes code from the target repository (see
  `src/scanner/walk.ts` and `src/fixer/index.ts` doc comments) and never
  invokes `git` against it.

## Human gate

Per `BRIEF.md` "İnsan Kapıları" #1, the first submission to the
Community Directory requires human approval. This ticket does not
submit anything — it prepares the package. Once this PR merges, the
ticket is escalated `to: human` for the actual submission via one of:

- claude.ai: https://claude.ai/admin-settings/directory/submissions/plugins/new
  (requires a Team/Enterprise org with Directory permission)
- Console: https://platform.claude.com/plugins/submit (individual authors)

Neither form's exact fields were verified against this checklist — both
require an authenticated session this ticket doesn't have. The content
above (example prompts, privacy note) is prepared for the human to
paste in and adjust as the form actually asks, not asserted as a
literal match to unseen form fields.
