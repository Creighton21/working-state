# Proposal

## Why

The first handoff works when the owner has a task URL or can find its note in Home’s recent updates. The owner needs a durable place to return to any task and a way to see how a block of related work is progressing.

## What Changes

- Add a Standalone list for tasks without an effort, including tasks with no notes and tasks whose updates have rolled off Home.
- Let the owner create an effort with a title and optional description, browse efforts, and open an effort page with its task list and completion count. Expose effort creation and lookup through the authenticated REST API.
- Let the owner create a task in an effort or move an existing standalone task into one. Keep the task’s ID, URL, status, and activity when it moves.
- Derive effort status from its current tasks so a status update through the existing agent API is reflected when the effort is reopened.
- Capture the existing standalone-task handoff in a repeatable smoke check. Effort archive controls, manual status overrides, global search, effort-specific activity sections, and MCP Code Mode belong to later slices.

## Capabilities

### New Capabilities

- `efforts` covers effort creation, browsing, task lists, and derived progress.

### Modified Capabilities

- `tasks` gains standalone browsing and effort membership while preserving stable task identity and activity.

## Impact

This adds an SQLite migration, new effort and task operations in the Spring Boot API and OpenAPI contract, and Standalone and Efforts views in the React workspace. The same owner sessions and agent credentials apply. [V1 product design](../../../docs/v1-design.md) · [Workspace design](../../../docs/workspace-design.md)
