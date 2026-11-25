# First slice of Working State

The first slice proves a remote handoff on one standalone task. The owner creates it in the web app. An agent on a separate computer uses REST to mark it **In progress** and append a work note. The owner opens the app on a phone, taps the update on Home, and sees that exact note highlighted in the task’s Activity. The task and note survive a server restart. [Technical specification](technical-spec.md) · [Workspace design](workspace-design.md)

## What to build

1. **Run the shared service.** Serve the Vite-built React app and REST API from Spring Boot. Apply the initial SQLite migration to a persistent database. Use one owner sign-in for the browser and a separately provisioned, revocable credential for the agent. Make the same HTTPS URL reachable from the phone and the agent machine.
2. **Create and open a task.** Add a create action to Home. Accept a required title and optional description, start the task in **Todo**, and open its details after creation. Give the task a stable URL and API ID so the owner can pass it to the agent.
3. **Record the agent’s work.** Let the agent fetch the task, change its status, and append a plain-text work note. Give each entry a stable ID, the agent’s identity, and a server timestamp. Keep the note append independent of the task version.
4. **Follow the update from Home.** Show the latest three work notes, newest first, with the task title, author, timestamp, and excerpt. Selecting an update opens the task and highlights its specific entry by activity ID. The task pane sits along a single divider on desktop. On the phone, it opens full-screen with a Back control. Use the approved prototype for the layout and styling. [Workspace prototype](workspace-prototype.html)

## API contract for the slice

| Operation | Behavior |
| --- | --- |
| `POST /api/v1/tasks` | Create a standalone task and return its ID, status, and version. |
| `GET /api/v1/tasks/{taskId}` | Return the task fields, current version, and activity entries. |
| `PATCH /api/v1/tasks/{taskId}` | Set the task status using an expected version. Return the updated task or `409 Conflict` for a stale version. |
| `POST /api/v1/tasks/{taskId}/activity` | Append a work note and return its activity ID, authenticated author, and timestamp. |
| `GET /api/v1/activity?limit=3` | Return the latest work notes with their task and activity IDs and the fields Home displays. |

Publish these operations in OpenAPI so the agent can find the schemas, accepted statuses (`todo`, `in_progress`, `done`), and authentication requirements. Use task ID and activity ID together when opening an update so two notes on the same task remain distinct.

## Acceptance checks

1. Sign in, create a standalone task in the browser, and confirm the task starts in **Todo** and can be reopened by its URL.
2. From a separate computer, use the agent credential to fetch that task, set it to **In progress**, and append a work note. Add a second note to the same task to exercise exact selection.
3. On a phone, open Home and tap the older of the two entries. Confirm the correct task opens in **In progress**, the selected note is highlighted, and Activity shows the authenticated agent and timestamp. Use Back to return to Home. On desktop, verify the task opens beside Home.
4. Submit a status update with a stale version and verify the newer status remains. Revoke the agent credential and verify further writes with it are rejected. Restart the service and verify the task and both notes are still present.

## Follow-on work

Effort management and status rollups, global search, work logs, and editing task details in the browser come in later slices. MCP discovery and Code Mode build on the REST contract after the direct handoff works. The broader v1 acceptance scenario then exercises one effort and two different agents. [V1 product design](v1-design.md)
