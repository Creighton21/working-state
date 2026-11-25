# Working State technical specification

Working State is a single-owner, self-hosted app. One Java Spring Boot instance serves the web client and a REST API. SQLite stores the workspace on the host. The owner’s phone and Mac, along with agents on other computers, connect to the same instance over HTTPS. [V1 product design](v1-design.md)

## Application and API

Use Spring MVC for the JSON REST API under `/api/v1`. OpenAPI describes the operations, request and response shapes, authentication, and errors. Give operations stable names so agents can find them by intent and compose calls in Code Mode. Keep validation, authorization, effort status derivation, and writes in the Spring application so every caller uses the same rules. [Spring MVC](https://docs.spring.io/spring-boot/reference/web/servlet.html) · [OpenAPI specification](https://spec.openapis.org/oas/latest.html)

Home, effort pages, and task details each have a predictable data shape. An effort response can include its summary, tasks, and a bounded set of recent updates in one request. GraphQL’s field selection would be useful if several clients later need different combinations of deeply nested data. REST and OpenAPI cover the current views and give the MCP discovery layer a contract it can index. [GraphQL queries](https://graphql.org/learn/queries/)

Task and effort edits carry a version so the API can reject stale updates without losing a newer edit. Notes and logs are independent appends. The server records the authenticated author and timestamp for each entry. Stable task and activity IDs let the client open the exact note or log selected from Home.

## Web client and deployment

Use React and TypeScript with Vite. Vite builds static assets that Spring Boot serves on the same origin as the API. Node is needed for frontend development and builds. The deployed web client and REST API run together as one Java service. Next.js also supports static exports. Server-rendered pages or a public web surface would be reasons to revisit it. [Vite production builds](https://vite.dev/guide/build) · [Spring Boot static content](https://docs.spring.io/spring-boot/reference/web/servlet.html#web.servlet.spring-mvc.static-content) · [Next.js static exports](https://nextjs.org/docs/pages/guides/static-exports)

The owner signs in to the web app. Each agent installation uses its own revocable API credential so activity can be attributed to that installation. The deployment model is one owner per instance. A second owner can run a separate instance with its own data. [Workspace design](workspace-design.md)

## Storage and PostgreSQL migration

Use Spring’s `JdbcClient`, the Xerial SQLite JDBC driver, and versioned SQL migrations. Store the database in a persistent directory on the same host as Spring Boot. Use WAL mode and keep write transactions short. SQLite can serve readers while a write is in progress and allows one writer at a time. Back up the live database with SQLite’s backup mechanism and verify that the backup can be restored. [Spring JDBC](https://docs.spring.io/spring-framework/reference/data-access/jdbc/core.html) · [SQLite JDBC driver](https://github.com/xerial/sqlite-jdbc) · [SQLite WAL](https://www.sqlite.org/wal.html) · [SQLite backups](https://sqlite.org/backup.html)

Keep SQL and database-specific behavior in the persistence layer. Revisit PostgreSQL if the app needs multiple backend instances sharing one database or shows sustained write contention. Moving existing instances would require PostgreSQL schema migrations and a data transfer that preserves task IDs, activity IDs, authors, and timestamps. The REST contract stays stable across that move.

## MCP and Code Mode

MCP provides discovery against the same OpenAPI contract the web app and agents use. Where the JavaScript runs is still an open decision. In the server-side model, a remote MCP endpoint exposes `search` and `execute`, and `execute` runs the script in an isolated environment with a scoped API client. That gives different harnesses a common interface. In the agent-side model, MCP supplies discovery and each harness runs its own code and calls Spring Boot directly. That keeps the hosted service simpler and depends on the harness’s execution capabilities. In either model, Spring Boot authorizes the calls and attributes changes to the agent credential. [Cloudflare Code Mode](https://blog.cloudflare.com/code-mode-mcp/#server-side-code-mode)

The first slice uses direct REST calls from an agent machine. It proves the handoff before the project chooses and implements a Code Mode execution model. [First slice specification](first-slice.md)
