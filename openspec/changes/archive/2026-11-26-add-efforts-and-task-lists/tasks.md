# Tasks

## 1. Standalone handoff baseline

- [x] 1.1 Add a documented smoke command that runs against a disposable workspace. Verify it passes on the first-slice app by creating a task in the browser, changing status and appending two notes with an agent token, then opening the older note from Home.

## 2. SQLite and task membership

- [x] 2.1 Add and register the `V004` migration for efforts and indexed task membership. Verify a fresh database boots and a seeded V003 database upgrades without changing task IDs, versions, notes, or agent credentials. Document the pre-upgrade backup and rollback steps.
- [x] 2.2 Extend task persistence to list standalone tasks, create tasks with an optional effort, and assign standalone tasks with a guarded version update. Verify existing create requests stay standalone, unknown efforts fail cleanly, and competing assignment and status writes leave one winning update.
- [x] 2.3 Implement effort creation, list and detail reads, and shared progress calculation. Verify counts and statuses for empty, all-Todo, all-Done, and mixed efforts, plus consistent detail and member rows after a move or status change.

## 3. REST and OpenAPI

- [x] 3.1 Add the effort REST operations and publish their OpenAPI schemas and examples. Verify owner and agent access, validation for a blank title, an unknown effort response, and authentication on protected requests.
- [x] 3.2 Add standalone listing and assignment routes, extend task creation and detail with effort membership, and update the OpenAPI contract and README examples. Verify the existing task paths, request shapes, and note links still work, and the new assignment route returns the documented `404` and `409` responses.

## 4. Workspace navigation and task lists

- [x] 4.1 Add routes and navigation for Standalone, the Efforts index, and effort details. Verify direct loads, signed-out links that resume after sign-in, and access to both lists at desktop and phone widths.
- [x] 4.2 Build Standalone and effort list views and effort and task creation forms. Verify a task with no notes opens from Standalone, a new effort opens with zero of zero complete, and a task created from an effort appears in that effort and stays out of Standalone.
- [x] 4.3 Add assignment to the existing task pane and preserve its originating view. Verify a move refreshes the task and both lists, an earlier note link still works, and a conflict can be recovered by fetching the current task. Check keyboard access to assignment controls and focus restoration on desktop close and phone Back.

## 5. Integrated verification

- [x] 5.1 Run the original handoff smoke command against the packaged build using disposable data. Verify Home still selects the exact note and a migrated task can be opened by its original link.
- [x] 5.2 On a phone, create an effort and move an existing standalone task into it. From an agent computer, retrieve the effort and mark its remaining task Done through the existing task API. Reopen the effort and verify the completion count, Done status, and original notes.
