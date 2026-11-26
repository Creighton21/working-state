# Spec Delta

## Purpose

Let one owner and their agents access the same hosted workspace with separately attributable and revocable access.

## ADDED Requirements

### Requirement: Owner can sign in across devices

The workspace SHALL require the owner to sign in before viewing private workspace data or creating a task in the browser. The owner SHALL be able to sign in to the same instance from their desktop and phone over HTTPS.

#### Scenario: Open the workspace from a phone

- **WHEN** the owner opens the workspace URL on their phone and signs in
- **THEN** Home shows the same workspace data available from their signed-in desktop

#### Scenario: Open a private task while signed out

- **WHEN** a signed-out browser follows a task URL
- **THEN** the browser is prompted to sign in before seeing any task data
- **AND** a successful sign-in opens the requested task

### Requirement: Agents use installation credentials

The workspace SHALL support a separately issued and revocable credential for each agent installation. Task API access using an agent credential SHALL be attributed to the installation associated with that credential.

#### Scenario: An agent accesses the workspace remotely

- **WHEN** an agent supplies an active credential to a supported task operation over HTTPS
- **THEN** the API authenticates the agent as the credential’s installation identity

#### Scenario: A credential is revoked

- **WHEN** an agent attempts a task write with a revoked credential
- **THEN** the API responds with `401 Unauthorized` and leaves the task and its activity intact
- **AND** other active credentials retain their access

#### Scenario: A caller omits authentication

- **WHEN** a caller requests private task or activity data without an authenticated session or an active agent credential
- **THEN** the REST API responds with `401 Unauthorized` without returning private data
