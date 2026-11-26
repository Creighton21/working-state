# Spec Delta

## Purpose

Let agent harnesses discover the Working State REST contract on demand and use it to coordinate work under their own identities.

## ADDED Requirements

### Requirement: Agents can connect to the workspace discovery endpoint

The deployed workspace SHALL serve MCP discovery over Streamable HTTP at `/mcp` on its existing HTTPS origin. MCP clients SHALL be able to initialize and list the `discover_api` tool without a workspace credential. Requests from a disallowed browser origin SHALL receive `403 Forbidden`.

#### Scenario: Connect from a terminal harness

- **WHEN** Codex or Pi connects to the deployed MCP endpoint and lists tools
- **THEN** it can call the same discovery tool

#### Scenario: Reject a disallowed origin

- **WHEN** a request has an Origin outside the configured allowed origins
- **THEN** the endpoint returns `403 Forbidden`

### Requirement: Discovery returns matching operations from OpenAPI

The discovery tool SHALL accept an exact operation ID or keyword text. It SHALL return a bounded set of matching operations derived from the published OpenAPI contract. Each result SHALL give the operation ID, method, path, relevant parameters, request and response schemas, and authentication requirements.

#### Scenario: Discover a status update by operation ID

- **WHEN** a client queries for `updateTaskStatus`
- **THEN** the result describes the existing PATCH operation, the required `expectedVersion`, the supported status values, and the stale-version response

#### Scenario: Discover by intent

- **WHEN** a client searches for operations to find an effort and read its tasks
- **THEN** the results include the relevant effort-list and effort-detail operations

#### Scenario: Search for an unavailable operation

- **WHEN** a client submits a valid query with no matching operation
- **THEN** the tool returns an empty result with guidance to refine the query

### Requirement: Discovery is limited to published metadata

The MCP endpoint SHALL expose only metadata from the published contract. It SHALL neither execute workspace operations nor return live task, effort, or activity records. Private REST requests SHALL continue to require the existing credentials.

#### Scenario: Discover a write operation without a credential

- **WHEN** a caller looks up the operation for appending a work note through MCP
- **THEN** discovery returns the published operation metadata and leaves workspace data intact
- **AND** a subsequent REST write without a valid credential is rejected

#### Scenario: Revoke an agent credential

- **WHEN** an installation credential is revoked after its agent discovers an operation
- **THEN** REST rejects further writes using that credential
- **AND** the public discovery metadata remains available

### Requirement: Two agent harnesses can hand off a task through discovery and REST

Codex and Pi SHALL be able to discover the operations through MCP, locate the same task by effort and task name, and compose authenticated REST calls in their own environments. The workspace SHALL attribute notes to the authenticated installations and derive effort status from the resulting task statuses.

#### Scenario: Complete a two-agent handoff

- **WHEN** Codex discovers the operations, finds the task, sets it In progress, and appends a note using its own credential
- **AND** Pi independently discovers the operations, finds the same task, reads Codex’s note, sets the task Done, and appends its own note
- **THEN** the owner can reopen the effort on the phone and see Done when it is the last unfinished task
- **AND** the task history attributes each note to the corresponding installation
