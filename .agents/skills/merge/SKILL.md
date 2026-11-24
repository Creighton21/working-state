---
name: merge
description: Land a completed feature branch on local main as one Conventional Commit by rebasing, squashing, validating, and fast-forwarding. Use when asked to merge or land a feature on main.
---

# Merge a feature into main

Follow the merge policy in the repository's `AGENTS.md`. Land one commit per feature and preserve the existing history of `main`. This workflow changes local branches. Push only when separately requested.

1. Identify the requested feature branch and inspect `git status --short --branch`, `git log --oneline main..FEATURE`, and the feature diff. Stop if the worktree or index has changes, a Git operation is active, the feature branch is ambiguous, or there is no feature work to land. Use the [commit skill](../commit/SKILL.md) if the user asks to commit pending work first. Check that local `main` is current. If it tracks an upstream, fetch and fast-forward local `main` when needed. Stop if it has diverged.
2. Verify Creighton Cornelison's configured Git identity using the commit skill before rewriting feature commits. If the feature history is shared, confirm that rewriting it is acceptable or work on a local integration branch based on the feature tip.
3. On the feature branch or its local copy, run `git rebase -i main` when there are multiple commits. Keep the first commit and squash or fix up the remainder. Use one Conventional Commit subject describing the full feature. With one commit, use `git rebase main` if the base has advanced. If a conflict occurs, resolve it only when the intended behavior is clear. Inspect the resulting diff for lost or unrelated changes.
4. Before landing, verify `git log -1 --format=fuller` shows Creighton as both author and committer with his configured email, and confirm the subject follows Conventional Commits. Verify that the feature tip has exactly one parent and that its parent is the current `main`. Run `git diff --check main..HEAD` and the feature's validation. Stop on failures.
5. Record the validated feature tip and its parent. Switch to `main` and verify its tip still matches that parent. Run `git merge --ff-only FEATURE` using the actual branch name. If `main` advanced, rebase and revalidate before retrying. Afterward, verify that `main` points to the validated commit and that the worktree is clean. Report the commit hash, subject, and validation result.
