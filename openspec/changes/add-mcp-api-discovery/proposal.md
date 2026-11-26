# Proposal

## Why

The standalone and effort handoffs work over REST, but each agent needs to learn the API from the README or raw OpenAPI file. A shared MCP discovery tool gives Codex and Pi a way to look up the operations they need during a handoff.

## What Changes

- Serve a read-only MCP discovery tool from the same Working State deployment. It returns relevant operation metadata derived from the published OpenAPI contract.
- Keep agent-authored code in the agent environment. Codex and Pi use their own installation credentials for direct REST requests to read workspace data, update task status, and append notes.
- Document how to connect both harnesses and verify a handoff that starts with an effort and task name. Codex starts the task and leaves a note, Pi reads it and finishes the same task, and the owner confirms the effort is Done and both notes are attributed on the phone.
- Use the two-client trial to evaluate agent-side execution. A shared server-side code runner is future work.

## Capabilities

### New Capabilities

- `mcp-api-discovery` covers operation discovery over MCP and the discovery-to-REST workflow for agent clients.

### Modified Capabilities

## Impact

This adds an MCP endpoint and OpenAPI lookup to the Spring Boot app, plus a repeatable interoperability check and client setup instructions. The existing effort, task, activity, and credential APIs supply the handoff workflow. [Technical specification](../../../docs/technical-spec.md#mcp-and-code-mode) · [V1 product design](../../../docs/v1-design.md)
