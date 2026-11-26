# task-activity Specification

## Purpose

Preserve attributable work notes and let the owner open a specific entry directly from the recent updates feed.

## Requirements

### Requirement: Agents can append attributed work notes

The API SHALL let an authenticated agent append a plain-text work note to an existing task. It SHALL assign a stable activity ID, record the authenticated agent and server timestamp, and preserve the entry across restarts. Appending a note SHALL leave the task status and version intact.

#### Scenario: Append a note after a status change

- **WHEN** an agent appends a note after the task’s version has advanced
- **THEN** the API records the note with its own ID, the authenticated author, and a server timestamp
- **AND** the task’s status and version remain as they were before the append

#### Scenario: Read a saved note after a restart

- **WHEN** an authorized caller opens the task after a service restart
- **THEN** the note is available with its original ID, text, author, and timestamp

### Requirement: Home shows recent notes

Home SHALL show up to three work notes in newest-first order. Each entry SHALL show the task title, author, timestamp, and an excerpt. The recent activity API SHALL return both task and activity IDs for every entry.

#### Scenario: Open Home after new notes are recorded

- **WHEN** the owner loads Home with four saved notes
- **THEN** the three newest notes appear in descending order with their task titles, authors, times, and excerpts

#### Scenario: Open Home with an empty workspace

- **WHEN** the owner loads Home before any notes have been recorded
- **THEN** the updates area shows an empty state

### Requirement: An update opens its exact activity entry

Selecting a Home update SHALL open its task and bring the corresponding activity entry into view with a visible highlight. The task opens beside Home in a right-hand pane at desktop widths and as a full-screen view with a Back control on a phone.

#### Scenario: Select the older of two notes

- **WHEN** the owner taps the older of two Home updates for the same task on a phone
- **THEN** the full-screen task view brings the older note into view and highlights it
- **AND** Back returns to Home

#### Scenario: Open a note on desktop

- **WHEN** the owner opens a Home update at a desktop width
- **THEN** Home remains visible beside the task pane and the selected note is highlighted in Activity
