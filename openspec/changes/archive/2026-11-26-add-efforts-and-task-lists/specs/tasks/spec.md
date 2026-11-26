# Spec Delta

## ADDED Requirements

### Requirement: Standalone tasks can be found without recent activity

The signed-in owner SHALL be able to open a Standalone view on desktop and phone and browse tasks that have no effort. The authenticated REST API SHALL provide the same set independently of whether tasks have notes or appear on Home.

#### Scenario: Reopen a task with no notes

- **WHEN** the owner opens Standalone after creating a task with no notes
- **THEN** the task appears in the list and opens by its stable URL

#### Scenario: Reopen a task after its note leaves Home

- **WHEN** a standalone task’s notes fall outside the recent Home updates
- **THEN** the task remains available through Standalone

#### Scenario: Browse standalone and effort tasks

- **WHEN** the owner opens Standalone in a workspace with both kinds of tasks
- **THEN** the view includes standalone tasks and excludes effort members

### Requirement: A task can be created in an effort

The owner SHALL be able to create a task from an effort’s page. The authenticated task creation API SHALL accept an optional effort ID. When a valid effort ID is supplied, the task SHALL start in `todo` and belong to that effort.

#### Scenario: Create a task inside an effort

- **WHEN** the owner creates a valid task from an effort’s page
- **THEN** the task opens and appears in that effort’s task list
- **AND** it is absent from Standalone

#### Scenario: Create a task with an unknown effort

- **WHEN** an authenticated caller supplies an effort ID that does not exist
- **THEN** the API returns `404 Not Found` and creates no task

### Requirement: A standalone task can move into an effort

The owner and authenticated REST callers SHALL be able to assign an existing standalone task to an effort with the expected task version. Assignment SHALL advance the version atomically and preserve the task ID, URL, status, and activity. A stale version or a task already assigned to an effort SHALL return `409 Conflict`.

#### Scenario: Move a task with existing notes

- **WHEN** the owner moves a standalone task into an existing effort using the current version
- **THEN** the task appears in the effort list and leaves Standalone
- **AND** the original task URL and Home activity link still open the same task and notes

#### Scenario: Two moves use the same version

- **WHEN** two assignments of the same standalone task use the same expected version
- **THEN** one assignment succeeds and the other returns `409 Conflict`
- **AND** the successful assignment remains in effect

#### Scenario: Attempt to reassign an effort member

- **WHEN** a caller supplies the current version of a task that already belongs to an effort
- **THEN** the API returns `409 Conflict` and preserves the current membership and version

#### Scenario: Move a task to an unknown effort

- **WHEN** a caller moves a standalone task to an effort ID that does not exist
- **THEN** the API returns `404 Not Found` and preserves its membership and version

## MODIFIED Requirements

### Requirement: Task details are available by stable identity

The system SHALL let an authorized browser user reopen a task by its URL and an authorized REST caller fetch it by ID. The REST response SHALL include the task fields, current status, version, activity entries, and effort ID when assigned. The identity SHALL remain stable across edits, effort assignment, and service restarts.

#### Scenario: Share a task with an agent

- **WHEN** the owner gives the task ID to an agent on another computer
- **THEN** the authenticated agent can retrieve the same task and its current version

#### Scenario: Reopen a task after a restart

- **WHEN** the service restarts and the owner reopens a saved task URL
- **THEN** the task opens with its saved fields, status, and version

#### Scenario: Reopen a task after its effort membership changes

- **WHEN** the owner opens the original task URL after moving it into an effort
- **THEN** the same task opens with its current effort context and existing activity
