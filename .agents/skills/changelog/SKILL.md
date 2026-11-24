---
name: changelog
description: Create or update mat's root CHANGELOG.md from Git history and the feature diff. Run manually before merging a feature into main.
---

# Update the changelog

Keep `CHANGELOG.md` at the repository root. Use `# Changelog` and `## YYYY-MM-DD` headings, newest date first, with concise Markdown bullets describing what changed. Reuse an existing heading for the same date.

## When the changelog is missing

Read the history already landed on local `main` with `git log --first-parent --format='%h %cs %s' main`. Use each commit's committer date and inspect its diff when the subject lacks detail. Group the entries by date and give each landed change a bullet. If invoked on a feature branch, also apply the pre-merge steps below.

## Before merging a feature

1. Invoke on the feature branch. Review `git log main..HEAD`, `git diff main...HEAD`, and `git status --short`. Include staged, unstaged, and untracked changes only when they belong to the feature. Use the diffs to describe the combined result of the feature, including work split across several commits.
2. Use the local date from `date +%F` for new bullets. Review the existing changelog and the branch's changes to it before writing. If this branch already records the change, keep or refine its existing entry, even on a later invocation date. Preserve prior entries and skip changes solely to the changelog.
3. Review the final changelog diff for accurate wording, unique date headings, and duplicate entries. Leave the edit in the working tree for the feature commit. Git staging, commits, and merges are separate actions.

When invoked on `main` with an existing changelog, report that the pre-merge update runs on the feature branch.
