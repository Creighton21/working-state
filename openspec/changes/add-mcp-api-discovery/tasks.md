# Tasks

## 1. MCP transport and access boundary

- [ ] 1.1 Add the official Java MCP SDK Servlet transport to the packaged Spring Boot app at `/mcp`. Verify initialization and tool listing with both Codex CLI and Pi before wiring the discovery index.
- [ ] 1.2 Configure the stateless discovery route and Origin and Host validation. Verify the packaged server accepts expected CLI and loopback requests, rejects a disallowed Origin, and continues to reject anonymous and revoked-token REST writes. Document the HTTPS proxy and allowed-origin settings.

## 2. OpenAPI discovery

- [ ] 2.1 Build the operation index from the packaged OpenAPI 3.1 YAML. Verify exact lookups describe the actual method, path, inherited parameters, authentication, and resolved request and response schemas, including the status update’s `expectedVersion` and `409` response.
- [ ] 2.2 Register the read-only `discover_api` tool with bounded keyword matching and a stable result shape. Verify useful effort lookup, deterministic ordering, invalid and no-match queries, and the absence of live task, effort, and note data from tool results.

## 3. Agent-side execution

- [ ] 3.1 Document setup for Codex CLI and Pi, including how to issue and supply a different REST credential for each. Verify both harnesses can call discovery and their normal command path can access the local credential and workspace origin. Record the tested client versions and update the technical specification with the agent-side decision for this slice.
- [ ] 3.2 Supply a small runnable local REST example and sample handoff prompts. Verify the example reads the token from its local environment, asks for disambiguation before a write when names collide, surfaces stale versions and partial outcomes, and leaves credentials out of tool results and command output.

## 4. Integrated handoff

- [ ] 4.1 Add a repeatable packaged-app check for MCP lookup followed by authenticated REST, then run the existing browser-to-REST smoke check. Verify discovery exposes operation metadata while task data and changes still depend on a valid REST credential.
- [ ] 4.2 Run the documented handoff in actual Codex and Pi sessions using two separately issued credentials and only the effort and task names as the initial identifiers. Confirm on the phone that the effort is Done and the original and closing notes carry the correct authors. Record any harness differences observed during the walkthrough.
