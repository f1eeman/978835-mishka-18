# Issue tracker: Local Markdown

Issues and PRDs for this repo live as Markdown files under `.scratch/<feature>/prd.md`. GitHub Issues are disabled on this repo.

## Conventions

- **Create a ticket**: write a Markdown file at `.scratch/<feature-slug>/prd.md`. Add `**Status:** ready-for-agent` (or the relevant triage label) at the top.
- **List tickets**: `ls .scratch/` and read the `prd.md` in each subdirectory.
- **Update status**: edit the `**Status:**` line in the relevant `prd.md`.
- **Close a ticket**: add `**Status:** done` and optionally a `## Resolution` section.

## Pull requests as a triage surface

**PRs as a request surface: no.**

## When a skill says "publish to the issue tracker"

Create `.scratch/<feature-slug>/prd.md` with `**Status:** ready-for-agent` at the top.

## When a skill says "fetch the relevant ticket"

Read `.scratch/<feature-slug>/prd.md`.
