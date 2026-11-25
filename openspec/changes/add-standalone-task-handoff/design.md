# Design

## Context

The repository contains a static workspace prototype and product documentation. This change introduces the first application runtime and persistent schema. The approved prototype establishes the layout, task pane behavior, and selected-note treatment. The technical specification establishes the deployment model and stack. [Proposal](proposal.md) · [Technical specification](../../../docs/technical-spec.md) · [Workspace prototype](../../../docs/workspace-prototype.html)

## Goals / Non-Goals

**Goals**

- Package a browser client and authoritative REST API as one release for a single owner.
- Keep task edits and activity appends independently consistent, with an OpenAPI contract usable by a remote agent.
- Make the handoff verifiable across desktop, phone, and a service restart.

**Non-Goals**

- MCP discovery, Code Mode execution, and cross-harness integration belong to a follow-on change.
- Effort management, search, logs, and the full task editor belong to later product slices.
- Shared multi-owner hosting and a PostgreSQL deployment profile remain future deployment work.

## Decisions

### Build and serve one application

Use a Maven Wrapper for the Spring Boot application in `backend/` and keep React, TypeScript, and Vite in `web/`. Package the Vite build with Spring Boot and serve both the client and `/api/v1` from one origin. Use the Vite proxy for local development. The task URL resolves through the web client on a direct load or refresh. API routes retain their own JSON errors. One release simplifies self-hosting and lets the owner’s browser session stay same-origin. Serving the client separately would allow independent releases, with a second deployment to manage.

### Use REST as the handoff contract

Publish the five operations below in OpenAPI, with stable operation IDs, explicit authentication schemes, and the expected validation, authorization, lookup, and version-conflict responses. Task details include activity so the client can render the selected note with one task request. GraphQL’s variable field selection would be useful if future clients need substantially different views.

| Operation ID | Request | Response |
| --- | --- | --- |
| `createTask` | `POST /api/v1/tasks` with title and optional description | `201` and task with ID, `todo` status, and version |
| `getTask` | `GET /api/v1/tasks/{taskId}` | `200` with task details, version, and activity |
| `updateTaskStatus` | `PATCH /api/v1/tasks/{taskId}` with status and expected version | `200` with updated task, or `409` for a stale version |
| `appendTaskNote` | `POST /api/v1/tasks/{taskId}/activity` with note body | `201` with canonical activity ID, author, and server timestamp |
| `listRecentActivity` | `GET /api/v1/activity?limit=3` | `200` with the latest notes and the task and activity IDs |

### Keep owner and agent authentication distinct

Use Spring Security for the single owner’s cookie-backed session and for bearer-token authentication on the API. Apply CSRF protection to browser-session writes. Bootstrap the owner through deployment configuration and provide an operator workflow to issue and revoke a high-entropy token for each agent installation. Store token digests and a stable installation identity in SQLite. Derive the note’s author from that identity and retain attribution when its token is revoked. Each token has its own revocation state. An external identity provider could support organizational sign-in later. Local provisioning fits a single-owner instance and keeps agent credential management independent of the browser session.

### Persist task and activity writes independently

Use `JdbcClient` with the Xerial SQLite driver. Versioned SQL migrations create task, activity, and agent credential records. Generate stable IDs on the server. Store the activity author and UTC timestamp with each note, and index by task and by recency. Order the Home feed newest first and use a stable tie-breaker for equal timestamps. Update task status with a single SQL update guarded by task ID and expected version. A note append inserts its own activity row and leaves that version intact. Use a persistent local directory, WAL mode, and short transactions. A separate PostgreSQL service would become useful for shared database access across multiple backend instances. Keep database-specific SQL in the persistence layer for that eventual move.

### Carry activity identity through the task route

Use the task URL for the owner or agent handoff, and include the activity ID in the query when the owner opens a Home update. Match the entry within that task’s activity and scroll it into view. The prototype supplies the docked layout at 950 px and above, the right-side overlay at 721–949 px, and the full-screen task view at 720 px and below. Use one divider for the docked pane, restore the originating view on close, and honor reduced-motion preferences. URL-based state makes refresh and browser navigation preserve the chosen entry. Local component state would be sufficient for opening and closing the pane within a single visit. [Workspace design](../../../docs/workspace-design.md) · [Design guidelines](../../../DESIGN.md)

## Risks / Trade-offs

- Concurrent task edits → Check and advance the task version in the same database write. Exercise simultaneous edits against SQLite.
- Multiple notes on one task make the chosen note ambiguous → Carry both IDs in the update link and verify the older of two notes is still highlighted after reload.
- Credentials or database state are lost during deployment → Keep sensitive configuration outside the bundle, persist the SQLite directory, and use SQLite’s backup mechanism with a restore check.
- Mobile emulation misses real network, sign-in, or Back behavior → Run the acceptance walkthrough from a phone and a separate agent computer against the same HTTPS instance.

## Migration Plan

Provision a persistent data directory and owner login, then start the combined release and run the initial migration on an empty SQLite database. Configure a reachable HTTPS origin and issue a separate agent credential. Verify the handoff and a restart before using the instance for regular work. Keep a backup before later schema migrations. If a release needs rollback after an incompatible schema change, restore the matching database backup with the prior application version.
