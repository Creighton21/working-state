# Design

## Context

Spring Boot already serves the web workspace, the agent REST API, and a public OpenAPI 3.1 document at `/api/v1/openapi.yaml`. The API has stable operation IDs for listing efforts, retrieving member tasks, changing status, and appending attributed notes. The existing smoke test exercises a browser and direct REST against a disposable workspace. [Proposal](proposal.md) · [OpenAPI contract](../../../backend/src/main/resources/static/api/v1/openapi.yaml) · [Handoff smoke test](../../../web/scripts/smoke-handoff.mjs)

## Goals / Non-Goals

**Goals**

- Give both terminal harnesses one MCP tool that returns the operation details needed for a REST call.
- Keep the published OpenAPI document as the source of discovery metadata and the REST service as the authority for workspace state.
- Verify a real Codex-to-Pi handoff using distinct installation credentials.

**Non-Goals**

- A hosted code runner, an MCP tool for each REST operation, and access to live workspace records through MCP are outside this discovery slice.
- OAuth onboarding, credential lifecycle changes, and web UI changes belong to separate work.

## Decisions

### Serve discovery from the existing Spring Boot process

Mount a stateless Streamable HTTP endpoint at `/mcp` using the official Java MCP SDK’s Servlet transport. Use the existing HTTPS reverse proxy and keep protocol handling in the SDK. Verify protocol negotiation with both clients on the packaged app before wiring the discovery index. A separate stdio adapter would require installation on each agent host and would add a distribution path to maintain. [MCP Java SDK](https://java.sdk.modelcontextprotocol.io/latest/server/) · [MCP transports](https://modelcontextprotocol.io/specification/2025-11-25/basic/transports)

### Build one discovery tool from the shipped OpenAPI document

Load the same packaged YAML that Spring Boot serves and index its operations by operation ID, method, path, summary, and description. Expose `discover_api` with a required text `query`. An exact operation ID returns that operation. Otherwise rank normalized keyword matches and return up to five with a stable tie-breaker. Empty or whitespace-only queries are input errors. A search with no matches returns an empty array and a hint to try an operation ID or narrower terms.

Return the operation ID, summary, HTTP method and relative path, merged path and operation parameters, request body, response status codes and schemas, and effective authentication schemes. Resolve references within the packaged document so the required fields and enum values are usable from the result. Keep the result bounded and return structured data with a text representation for clients. A curated tool registry would repeat the same schemas and require updates whenever the REST contract changes.

### Match the current public metadata boundary

Discovery accepts unauthenticated requests because its only data source is the already public OpenAPI document. The discovery handler has no workspace data dependencies and takes a text query only. Validate any supplied Origin against the deployment’s allowed origins, and validate Host against the deployed hosts, with a documented loopback setup for tests. Give the exact `/mcp` route its own stateless Spring Security configuration so MCP POSTs can work without browser CSRF tokens. Keep the REST bearer, browser session, and CSRF rules on their existing routes. Requiring a second MCP credential would add provisioning for the same published metadata. [MCP transport security](https://modelcontextprotocol.io/specification/2025-11-25/basic/transports#security-warning)

### Execute REST calls in each agent environment

Connect Codex and Pi to the same Streamable HTTP URL through their MCP configuration. Keep one credential per harness in its local secret environment. Document a small Node REST example that reads `WORKSPACE_URL` and `WORKSPACE_TOKEN` at execution time, uses the configured origin, and keeps tokens out of discovery arguments, prompts, and output. Codex uses its permitted command tool. Pi can call its local shell tool from Codemode to run the Node example because the Codemode sandbox has no direct network access. Verify that both installed clients can run this path with their normal permissions. A shared server-side runner would add a new execution and credential boundary. Defer that decision until both clients have tried the local workflow. [Codex MCP](https://developers.openai.com/codex/mcp) · [Pi MCP](https://docs.pi.dev/latest/mcp) · [Pi Codemode](https://docs.pi.dev/latest/codemode) · [Cloudflare server-side approach](https://blog.cloudflare.com/code-mode-mcp/#server-side-code-mode)

### Use the current REST flow for the handoff

Start with one effort and a uniquely named task as the only unfinished task. Each agent discovers the relevant operations, lists efforts, and reads the matching effort to find the task. Use the task detail response for the current version and notes. When a name matches more than one record, the example asks for a unique match or ID before writing. Codex sets the task to In progress and appends a note. Pi reads that note, sets the task Done, and appends its own. A stale version is handled by fetching the task again and reassessing before writing. Report a failed note append separately from a successful status write so the agent can check stored activity before retrying. The phone walkthrough confirms the derived effort status and both authors.

## Risks / Trade-offs

- Discovery and REST schemas drift → Exercise exact lookup against the packaged contract, including shared parameters, authentication schemes, and the existing `409` response.
- Browser-origin traffic reaches the MCP endpoint → Check the Origin allowlist and ensure the dedicated route cannot grant access to private REST endpoints.
- The two harnesses have different command or credential behavior → Record the actual client versions and execution setup and run the real handoff with two distinct credentials.

## Migration Plan

Deploy the updated Spring Boot package and forward `/mcp` through the existing HTTPS proxy. Confirm discovery, private REST authorization, and the original smoke test before registering the endpoint on each agent machine. The database schema stays at V004. If the MCP release needs rollback, redeploy the preceding package against the existing workspace data.
