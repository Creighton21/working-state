# Design

## Context

Spring Boot already serves a same-origin React workspace and the SQLite task and activity API. `TaskStore` checks task versions on status writes, and Home links directly to a task ID and activity ID. `BrowserRoutes` currently forwards Home and task URLs to React. The existing migrations create tasks, notes, and agent credentials, and the project has no checked-in handoff smoke test. [Proposal](proposal.md) · [Workspace design](../../../docs/workspace-design.md)

## Goals / Non-Goals

**Goals**

- Upgrade existing data in place and preserve every task and activity link.
- Make the REST API the source of effort membership and progress for both the browser and agents.
- Extend the current workspace and verify its original handoff from a repeatable command.

**Non-Goals**

- This slice supports assigning standalone work to an effort. Removing or reassigning membership, effort metadata edits, archive controls, and manual status belong to later effort lifecycle work.
- Global search, per-effort updates and recent tasks, MCP discovery, and Code Mode are follow-on work.
- The client refreshes effort progress when an effort is opened or reloaded. Live synchronization is separate work.

## Decisions

### Store membership on the task

Append `V004` to the existing migration registry. Create an `efforts` table with a stable ID, title, and optional description. Add a nullable, indexed `tasks.effort_id` foreign key. Existing rows remain standalone and retain their IDs, versions, and note relationships. A join table would support several efforts per task. A nullable foreign key fits the product’s zero-or-one relationship and makes both list scopes explicit.

Use the existing task version for both status updates and assignment. Apply assignment in one guarded database update using the task ID, expected version, unassigned state, and an existing destination effort. Classify a failed update as missing resource (`404`) or membership/version conflict (`409`). Preserve the existing status update operation and note writes so callers can continue using the original flow.

### Compute progress from the current task rows

Use the same server-side rollup for the efforts index and effort details. Return the total and done counts, and calculate status using the product rules for empty, all-Todo, all-Done, and mixed efforts. Build effort details and their task list from one consistent database read. Calculate the result on read so changes made through existing task endpoints appear on the next fetch. Persisted effort counters would add coordination to every status and membership write.

### Extend the REST contract additively

Publish new and updated operations in the existing OpenAPI document. Keep the current owner-session and agent-bearer access rules, including CSRF on browser writes. Reuse task records for detail and write responses, and use compact summaries without note bodies for task lists. Use title and ID as a stable list order.

| Operation | Contract |
| --- | --- |
| `GET /api/v1/tasks?scope=standalone` | List task summaries for unassigned tasks, independent of activity. |
| `POST /api/v1/tasks` | Extend `createTask` with optional `effortId`. Requests without it still create standalone tasks. |
| `GET /api/v1/tasks/{taskId}` | Extend the task response with its nullable `effortId` and preserve all existing fields. |
| `PATCH /api/v1/tasks/{taskId}/effort` | Assign a standalone task using `effortId` and `expectedVersion`. Return the updated task. |
| `GET /api/v1/efforts` | List effort summaries with ID, title, status, completed count, and total count. |
| `POST /api/v1/efforts` | Create an effort from a title and optional description. Return `201` and the new effort. |
| `GET /api/v1/efforts/{effortId}` | Return the effort summary, description, and member task summaries. |

The dedicated membership operation keeps the existing status write contract focused. A separate task-creation endpoint inside each effort would duplicate the task inputs and creation behavior.

### Keep task URLs independent of the list that opened them

Add browser routes for `/standalone`, `/efforts`, and `/efforts/{effortId}` using the existing React shell and Spring’s route forwarding. Give Standalone and Efforts visible navigation on desktop and phone. Reuse the task pane and keep `/tasks/{taskId}` and its activity query as the shareable links. Track the originating list in browser history so closing the pane restores that list and its focus. A direct task link opened without an origin can fall back to Home on close. An effort-specific nested task URL would tie the share link to mutable membership.

Show effort progress above the task list, with task creation on the effort page and assignment in standalone task details. Use the existing single-divider dock, tablet overlay, and full-screen phone view. Extend the phone pane’s focus handling to include assignment controls as well as Back. After a move, refresh the affected lists and task context. If the original task row disappeared from Standalone, restore focus to the list heading on close. [Design guidelines](../../../DESIGN.md) · [Workspace prototype](../../../docs/workspace-prototype.html)

## Risks / Trade-offs

- Existing data or bookmarks change during migration → Test the upgrade from a seeded first-slice database with saved notes and agent credentials, and open the original task and exact-note links afterward.
- A status update races with an effort assignment → Share the task version and verify that a stale request returns a conflict while preserving the winning write.
- Users lose their place after a move or on the phone → Reuse the existing pane and verify Back, reload, and focus return from both lists.
- The new navigation breaks the original handoff → Run the same smoke check before and after implementation using disposable workspace data.

## Migration Plan

Take a SQLite backup before deploying the combined release. Let the existing migration runner apply `V004` on startup and verify old tasks appear under Standalone with their activity intact. Verify a subsequent startup opens the upgraded database. The previous release rejects newer schema versions, so rollback uses the pre-upgrade backup with the prior release.
