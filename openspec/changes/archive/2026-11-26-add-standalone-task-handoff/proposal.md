# Proposal

## Why

The workspace prototype demonstrates the handoff using sample data. A working standalone-task handoff will prove that the owner and an agent on different devices can share task state, attribute work, and reopen the exact update from Home.

## What Changes

- Serve a signed-in web workspace and a documented REST API from one self-hosted instance.
- Let the owner create a standalone task in the browser and give an agent its stable URL or ID.
- Let an agent fetch the task, move it to **In progress**, and append a work note using its own revocable credential.
- Show the three latest notes on Home. Opening an update highlights its note in a docked task pane on desktop and a full-screen task view on the phone.
- Preserve tasks and notes across restarts and reject stale task updates. The handoff uses direct REST calls. Efforts, search, logs, and MCP Code Mode are follow-on work.

## Capabilities

### New Capabilities

- `workspace-access` covers owner sign-in, per-installation agent credentials, and authenticated access to the hosted workspace.
- `tasks` covers creating standalone tasks, retrieving them by stable ID, and updating status with version checks.
- `task-activity` covers attributed work notes, the recent updates feed, and navigation to a specific activity entry.

### Modified Capabilities

## Impact

This change introduces the first Spring Boot service, React web app, SQLite schema and migrations, and OpenAPI contract. The existing product and workspace documents guide the first live screens. [First slice specification](../../../docs/first-slice.md) · [Workspace design](../../../docs/workspace-design.md)
