# Task app v1 design

The task app gives one person and their AI agents a shared place to track work. You can start an effort on your phone, hand a task to Codex or Pi on either computer, and pick it up later with the task’s current status, notes, and logs. The workspace is hosted so each device and agent can reach the same data remotely.

## Efforts and tasks

An **effort** groups tasks for a block of work, such as a DNS migration. You and your agents can create efforts, edit their titles and descriptions, and archive or unarchive them. Archiving is independent of progress. An unfinished effort can be archived and restored with its task state intact.

A **task** can belong to an effort or stand alone. In either case, you and your agents can create it, update its title and description, set its status to **Todo**, **In progress**, or **Done**, and append work notes and logs. A standalone task can be moved into an effort later while keeping its identity and activity history. Each activity entry records its author and timestamp.

### Effort status

Automatic status uses the tasks currently linked to the effort.

| Task state | Effort status |
| --- | --- |
| No tasks, or every task is Todo | Todo |
| Every task is Done | Done |
| Any other combination | In progress |

A person or an agent can set a manual effort status. It stays in effect until someone chooses to use task status again. Clearing the override immediately shows the status derived from the current tasks.

## Client and HTTP API

The initial client is a responsive web app for Mac and phone. It gives you a place to capture standalone tasks, browse efforts and their progress, and open a task to edit its details or review its activity. Archived efforts are accessible through a filter.

The workspace design covers Home, effort pages, the task pane, and the approved dark glass treatment. [Workspace design](workspace-design.md)

The client and MCP use the same HTTP API and database. The API handles validation, permissions, and status derivation. You sign in as yourself. Each agent installation has its own revocable credential so its activity can be attributed to it. The API detects stale edits to an effort or task to avoid silently overwriting newer changes. Notes and logs are independent appends.

## MCP and server-side Code Mode

Codex, Pi, and other MCP-capable harnesses connect to one remote MCP endpoint. The endpoint follows Cloudflare’s server-side Code Mode pattern with two tools. [Cloudflare Code Mode](https://blog.cloudflare.com/code-mode-mcp#server-side-code-mode)

- **`search(code)`** runs a query against the app’s OpenAPI contract and returns the relevant operations and request and response schemas.
- **`execute(code)`** runs agent-written JavaScript in a server-side sandbox. The script uses a scoped client for the task API under the calling agent’s permissions. It can compose several operations in one run and return a concise result.

For example, a script can find a task by effort and title, update its status, append a note, and return the resulting task ID and status. The agent performs the underlying work in its usual environment and uses Code Mode to record it in the app.

## First end-to-end test

1. On your phone, create a DNS migration effort with one task, then create a standalone task.
2. On one computer, have Codex use MCP to find the effort task, mark it **In progress**, and leave a work note.
3. On the other computer, have Pi read the note, mark the task **Done**, and record the outcome.
4. Reopen the client on your phone and verify that the effort is **Done**, the task activity shows both agents, and the standalone task is still accessible on its own.
