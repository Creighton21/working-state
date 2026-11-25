# Tasks

## 1. Application setup

- [ ] 1.1 Scaffold Spring Boot with the Maven Wrapper in `backend/` and React, TypeScript, and Vite in `web/`. Verify the backend starts and the frontend type-checks and builds.
- [ ] 1.2 Package the built client in Spring Boot and wire the development proxy and browser route fallback. Verify the packaged app serves Home and direct task URLs and an unknown API route returns a JSON error. Document how to develop, package, and run the app behind an HTTPS origin.

## 2. Storage and access

- [ ] 2.1 Configure file-backed SQLite and apply the versioned task, activity, and credential migrations with WAL enabled. Verify a fresh database boots and later launches reuse it and recognize the applied migrations. Document the persistent directory and SQLite backup and restore commands.
- [ ] 2.2 Implement owner sign-in, session authentication, and CSRF protection for browser-session writes. Verify a signed-in session can use the protected API and an anonymous or invalid browser write is rejected.
- [ ] 2.3 Implement operator provisioning and revocation for per-installation bearer credentials, including token-digest storage and stable installation identity. Verify one revoked token returns `401` while a second active token still works. Document owner setup and agent credential commands.

## 3. Task and activity REST API

- [ ] 3.1 Implement and document task creation and retrieval. Verify a valid title and optional description create a versioned `todo` task, its ID can be fetched, and an empty title is rejected.
- [ ] 3.2 Implement and document version-checked status updates. Verify valid statuses, invalid input, and two updates using the same expected version produce one success and one `409`.
- [ ] 3.3 Implement and document note append and recent activity retrieval. Verify notes use the authenticated author and server timestamp, leave the task version intact, appear in task details, and the Home query returns the newest three with both IDs.
- [ ] 3.4 Publish the five operations in one accessible OpenAPI document. Verify it exposes the agreed operation IDs, authentication schemes, request and response schemas, and stale-write response against the implemented routes.

## 4. Browser handoff

- [ ] 4.1 Connect owner sign-in and task creation to the API. Verify a signed-out task link resumes after login, validation errors are visible, and creating a valid task opens its stable URL.
- [ ] 4.2 Build Home’s recent notes, including the empty state, and use the task and activity IDs in each update link. Verify a reload reads current updates and selecting the older of two notes brings that exact entry into view.
- [ ] 4.3 Apply the approved task pane layout and interaction. Verify desktop dock and single divider, tablet overlay, phone full-screen view, Back navigation, selected-note behavior after refresh, and reduced-motion handling in browser checks.

## 5. Self-hosted verification

- [ ] 5.1 Verify the packaged release uses one HTTPS origin and a persistent local database directory. From that instance, create a task and notes, restart the service, and restore a SQLite backup into a test instance to confirm the saved task, notes, and attribution.
- [ ] 5.2 Run the acceptance walkthrough from a phone and a separate agent computer. Create a task, update its status and append two notes through REST, then return to Home and open the older note. Verify the task status, highlight, author, timestamp, Back behavior, and access rejection after credential revocation.
