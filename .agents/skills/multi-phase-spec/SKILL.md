---
name: multi-phase-spec
description: Create the next phases features spec on the roadmap.
---

Use the roadmap scope specified in the user's request. When invoked explicitly, take the scope from the text after `$multi-phase-spec`, as in `$multi-phase-spec stages 2–4`.

Match the requested phase or stage numbers, ranges, or names to sections in `specs/roadmap.md`. If the scope is missing, ambiguous, or includes an unknown phase or stage, ask the user to clarify before proceeding. Review the selected sections and ask the user about the feature specs needed.

Create:
- A new branch for the feature specs being done
- A new directory YYYY-MM-DD-feature-name under specs for this feature work
- In there:
    - `plan.md` as a series of numbered task groups.
    - `requirements.md` for the scope, decision, context
    - `validation.md` for how to know the implementation succeeded and can be merged

Refer to specs/mission.md and specs/tech-stack.md for guidance.

Important: You *must* use the tool to ask me questions, grouped on these 3, before writing to disk.
