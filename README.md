# Working State

Working State is a shared task workspace for you and your AI agents. Group related tasks into efforts, track standalone tasks, and pick up work across devices with a shared history of status changes, notes, and logs.

## Develop locally

Install JDK 21 or later and Node.js 22.12 or later. The backend uses the included Maven Wrapper.

```sh
cd backend
WORKSPACE_SECURE_SESSION_COOKIE=false ./mvnw spring-boot:run
```

In another terminal, start the client. Vite proxies requests under `/api` to Spring Boot on port 8080.

```sh
cd web
npm ci
npm run dev
```

Open `http://localhost:5173`.

Set `WORKSPACE_OWNER_PASSWORD` in the backend's environment before starting it. The sign-in username defaults to `owner` and can be set with `WORKSPACE_OWNER_USERNAME`. The session cookie requires HTTPS by default. Use the HTTP cookie setting above for loopback development.

## Package and run

Build the client first so Maven can copy its output into the executable jar.

```sh
(cd web && npm ci && npm run build)
(cd backend && ./mvnw clean package)
java -jar backend/target/working-state-0.1.0-SNAPSHOT.jar
```

The service listens at `127.0.0.1:8080` by default. Put an HTTPS reverse proxy on the same host and route the entire origin to that port, including both page and API requests. For example, with a DNS name pointed at the host, a Caddyfile can contain the following.

```caddyfile
workspace.example.com {
    reverse_proxy 127.0.0.1:8080
}
```

Set `WORKSPACE_DATA_DIR` to an absolute path on a persistent local disk that is writable by the service account. The default is `./data` relative to the process. Keep the directory across releases so SQLite can retain its database and WAL files. The service runs the SQL migrations automatically on startup.

### Owner and agent access

Configure `WORKSPACE_OWNER_PASSWORD` and, optionally, `WORKSPACE_OWNER_USERNAME` in the service environment. Open the HTTPS workspace URL and sign in with those values. The default username is `owner`.

Run the following on the service host as the same account, with `WORKSPACE_DATA_DIR` pointing at the same directory.

```sh
java -jar backend/target/working-state-0.1.0-SNAPSHOT.jar agent issue "Office Mac"
java -jar backend/target/working-state-0.1.0-SNAPSHOT.jar agent revoke CREDENTIAL_ID
```

Issuing prints an installation ID, a credential ID, and the bearer token once. Use a unique name for each installation. Issuing again with the same name keeps its installation identity and creates a separate credential. Save the credential ID for revocation and put the token in the agent installation's secret storage. Send it as `Authorization: Bearer TOKEN` on REST requests. Revocation takes effect on subsequent requests and preserves the attribution of previous notes.

### Back up and restore

With the SQLite CLI installed, use its backup command while the service is running. To check a restore, restore into an empty directory and point a separate instance at that directory.

```sh
sqlite3 "$WORKSPACE_DATA_DIR/workspace.sqlite3" ".backup '/var/backups/working-state.sqlite3'"
mkdir -p /tmp/working-state-restore
sqlite3 /tmp/working-state-restore/workspace.sqlite3 ".restore '/var/backups/working-state.sqlite3'"
sqlite3 /tmp/working-state-restore/workspace.sqlite3 'PRAGMA integrity_check;'
WORKSPACE_DATA_DIR=/tmp/working-state-restore \
  java -jar backend/target/working-state-0.1.0-SNAPSHOT.jar --server.port=8081
```

## Agent REST API

The workspace publishes its OpenAPI 3.1 contract at `/api/v1/openapi.yaml`.

Set `WORKSPACE_URL` to the HTTPS workspace origin and `WORKSPACE_TOKEN` to the installation's bearer token. The owner can share a browser URL such as `/tasks/TASK_ID`. Use that same ID with the API.

```sh
curl -fsS "$WORKSPACE_URL/api/v1/tasks/TASK_ID" \
  -H "Authorization: Bearer $WORKSPACE_TOKEN"
```

To create a standalone task through REST, send a nonblank title and an optional description. A successful request returns `201 Created`, the new task's API path in `Location`, and its fields with status `todo` and version `1`. An unknown task ID returns `404` and invalid input returns `400`.

```sh
curl -fsS "$WORKSPACE_URL/api/v1/tasks" \
  -H "Authorization: Bearer $WORKSPACE_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"title":"Review backup restore","description":"Verify that previous notes are present."}'
```

Fetch the task before changing its status and send that version as `expectedVersion`. The accepted statuses are `todo`, `in_progress`, and `done`. A successful update returns the task with its advanced version. If another writer changed the version, the API returns `409 Conflict`. Fetch the task again before deciding whether to retry.

```sh
curl -fsS -X PATCH "$WORKSPACE_URL/api/v1/tasks/TASK_ID" \
  -H "Authorization: Bearer $WORKSPACE_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"status":"in_progress","expectedVersion":1}'
```

Append a plain-text note to a task with a nonblank `body`. The response includes the note ID, task ID, authenticated author, and an ISO 8601 UTC timestamp assigned by the server. Appending does not advance the task version. A task lookup includes its notes with the newest first.

```sh
curl -fsS "$WORKSPACE_URL/api/v1/tasks/TASK_ID/activity" \
  -H "Authorization: Bearer $WORKSPACE_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"body":"The restored database contains both notes."}'
```

The recent feed returns the latest work notes across tasks, with each note's ID, task ID, title, author, timestamp, and excerpt. The limit defaults to three and accepts values from one through three.

```sh
curl -fsS "$WORKSPACE_URL/api/v1/activity?limit=3" \
  -H "Authorization: Bearer $WORKSPACE_TOKEN"
```

## Try the prototype

Open the [workspace prototype](docs/workspace-prototype.html) in a browser. It runs locally with sample data and requires no installation. Search for **DNS migration**, open the effort, and select a task to see its details and activity.

## Project docs

- [V1 product design](docs/v1-design.md)
- [Technical specification](docs/technical-spec.md)
- [First slice specification](docs/first-slice.md)
- [Workspace design](docs/workspace-design.md)
- [Design guidelines](DESIGN.md)
- [Handoff video](docs/workspace-handoff/workspace-handoff.mp4)
