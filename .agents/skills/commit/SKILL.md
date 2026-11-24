---
name: commit
description: Create a local Git commit in mat using Conventional Commits and Creighton Cornelison's configured Git identity. Use when asked to commit, including the /commit shorthand.
---

# Commit changes in mat

1. Inspect `git status --short`, the staged diff, and any candidate unstaged changes. Use explicitly requested paths or the staged changes when they match the request. Stage only intended paths. If the intended scope is ambiguous, ask before staging or committing. If there is nothing to commit, report that and stop.
2. Review `git diff --cached` and run `git diff --cached --check`. Run relevant checks for the change and call out any failures or gaps. A docs-only change does not need a Cargo build.
3. Write a [Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/) subject as `type(scope): description`, with an optional scope. Use `feat` for a feature, `fix` for a bug fix, and other types such as `docs`, `test`, or `chore` as appropriate. Example: `docs(specs): define the Rust shell phase`. Add a body when it helps explain why. Mark breaking changes with `!` before the colon or a `BREAKING CHANGE:` footer.
4. Before committing, check `git config --get user.name`, `git config --get user.email`, `git var GIT_AUTHOR_IDENT`, and `git var GIT_COMMITTER_IDENT`. Both effective identities must match Creighton Cornelison and his configured email. If an identity is missing, overridden, or belongs to someone else, stop and tell Creighton what needs to be corrected. Use plain `git commit` with the existing identity. Leave Git configuration and identity environment variables alone. Do not add Codex or bot authorship, co-author trailers, or sign-offs.
5. Create the requested local commit. Afterward, check its author, committer, subject, and hash with `git log -1 --format=fuller` and report the short hash and subject. If the recorded identity differs, flag it without rewriting history. Pushing and amending require a separate request.
