# efforts Specification

## Purpose

Group related tasks into efforts so the owner and agents can find the work and see its current progress.

## Requirements

### Requirement: Owner and agents can create an effort

The signed-in owner SHALL be able to create an effort in the workspace. Authenticated REST callers SHALL be able to create an effort through the API. Creation SHALL require a nonblank title, accept an optional description, and assign a stable effort ID.

#### Scenario: Create an effort from the phone

- **WHEN** the owner submits a valid title and description from the Efforts view on a phone
- **THEN** the workspace opens the new effort and shows the saved title and description

#### Scenario: Create an effort through REST

- **WHEN** an agent submits a valid title without a description
- **THEN** the API returns the new effort and its stable ID

#### Scenario: Reject a blank effort title

- **WHEN** an authenticated caller submits a missing, empty, or whitespace-only title
- **THEN** the service reports a validation error and creates no effort

### Requirement: Efforts are browsable and reopen by ID

An authenticated caller SHALL be able to list efforts and retrieve a specific effort by ID. The owner SHALL be able to browse efforts on desktop and phone and open one by URL. The effort view SHALL show its title, description when provided, status, completion count, and member tasks.

#### Scenario: Reopen an existing effort

- **WHEN** the owner selects an effort from the list or opens its saved URL
- **THEN** the effort view shows the same effort and lists only tasks assigned to it

#### Scenario: Open a new effort before adding tasks

- **WHEN** the owner opens an effort with no tasks
- **THEN** the page shows an empty task list and a completion count of zero out of zero

### Requirement: Effort progress is derived from its tasks

The system SHALL derive the effort’s completion count and status from its current tasks. An empty effort or one with all tasks in `todo` SHALL have status `todo`. A nonempty effort with all tasks in `done` SHALL have status `done`. Every other combination SHALL have status `in_progress`.

#### Scenario: Open an effort with mixed status

- **WHEN** an effort has one Todo task and one Done task and an authenticated caller retrieves it
- **THEN** the effort reports `in_progress` with one of two tasks complete

#### Scenario: Reopen an effort after an agent finishes the last task

- **WHEN** an agent sets the last unfinished task to `done` and the owner reopens or reloads the effort
- **THEN** the effort shows **Done** with all tasks complete

#### Scenario: Reopen an effort after attaching unfinished work

- **WHEN** a Todo task is moved into an effort that previously contained only Done tasks
- **THEN** the next read of the effort reports `in_progress` and includes the new task in its total
