# tasks Specification

## Purpose

Provide durable tasks with stable identities that the owner and agents can use to coordinate work.

## Requirements

### Requirement: Owner can create a standalone task

The signed-in owner SHALL be able to create a standalone task from Home with a required title and an optional description. The task SHALL start in `todo` with a stable ID and SHALL open in the browser after creation.

#### Scenario: Create and open a task

- **WHEN** the owner submits a task title and an optional description
- **THEN** a standalone task is created and its details show the saved fields and **Todo** status

#### Scenario: Reject an empty title

- **WHEN** the owner submits a missing, empty, or whitespace-only title
- **THEN** the task is not created and the owner sees a title validation error

### Requirement: Task details are available by stable identity

The system SHALL let an authorized browser user reopen a task by its URL and an authorized REST caller fetch it by ID. The REST response SHALL include the task fields, current status, version, and activity entries. The identity SHALL remain stable across edits and service restarts.

#### Scenario: Share a task with an agent

- **WHEN** the owner gives the task ID to an agent on another computer
- **THEN** the authenticated agent can retrieve the same task and its current version

#### Scenario: Reopen a task after a restart

- **WHEN** the service restarts and the owner reopens a saved task URL
- **THEN** the task opens with its saved fields, status, and version

### Requirement: Status edits reject stale task versions

The API SHALL accept `todo`, `in_progress`, and `done` as task statuses. A status update SHALL include the expected version. The API SHALL apply the status and advance the version atomically when the version matches, and return `409 Conflict` for a stale version.

#### Scenario: Update the task status

- **WHEN** an agent submits `in_progress` with the current version
- **THEN** the API returns the task in `in_progress` with an advanced version

#### Scenario: Two writers use the same version

- **WHEN** two status updates for the same task use the same expected version
- **THEN** one update succeeds and the other returns `409 Conflict`
- **AND** the successful update remains in effect

#### Scenario: Reject an unsupported status

- **WHEN** a caller submits a status outside the supported values
- **THEN** the API reports a validation error and preserves the task status and version
