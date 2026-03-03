# Codex + MCP Server + Roblox Studio Plugin (Step-by-Step)

This guide shows a practical architecture for connecting **Codex** to Roblox Studio through an **MCP server** and a **Roblox Studio plugin**.

## 1) High-level architecture

Use three pieces:

1. **Codex client** (your AI coding environment) that can call MCP tools.
2. **Local MCP server** (Node/Python) that exposes tools like `create_script`, `read_selection`, `run_lint`.
3. **Roblox Studio plugin** that talks to a local HTTP bridge and applies changes inside Studio.

Recommended data flow:

- Codex -> MCP tool call -> MCP server
- MCP server -> HTTP call -> local bridge endpoint used by Studio plugin
- Studio plugin updates scripts, selection, and workspace objects
- Plugin returns status/result -> MCP server -> Codex

## 2) Build the Roblox Studio plugin first

Create a plugin with a toolbar button and a dock widget:

- Toolbar button: **Connect MCP**
- Widget UI fields:
  - Local bridge URL (default `http://127.0.0.1:8181`)
  - Connection status
  - Last operation result

Core plugin responsibilities:

- Read/modify scripts in `game` safely.
- Return selected Instance paths and source text.
- Apply diffs (or full source replacement) by script path.
- Keep an operation log with timestamps.

Minimum endpoints the plugin should consume (from your local bridge):

- `POST /plugin/ping`
- `POST /plugin/read_selection`
- `POST /plugin/write_script`
- `POST /plugin/insert_instance`
- `POST /plugin/undo_last`

## 3) Add a tiny local bridge service

Because plugins are easiest to wire with HTTP JSON workflows, run a local bridge on your machine.

Suggested bridge API contract:

- Request fields: `requestId`, `action`, `payload`
- Response fields: `requestId`, `ok`, `data`, `error`

Security basics:

- Bind only to `127.0.0.1`.
- Require a shared secret token header from plugin and MCP server.
- Validate script paths and block dangerous writes outside intended containers.

## 4) Implement the MCP server

Create an MCP server exposing tools Codex can call.

Suggested tools:

1. `roblox_ping()` -> checks plugin connectivity.
2. `roblox_get_selection()` -> returns selected objects + source.
3. `roblox_write_script(path, source)` -> writes Luau source.
4. `roblox_insert_instance(parentPath, className, props)` -> creates objects.
5. `roblox_run_playtest_smoke()` -> optional: trigger your own test pipeline.

Each MCP tool should:

- Validate input schema.
- Forward to the bridge endpoint.
- Normalize errors into concise actionable messages.

## 5) Wire Codex to the MCP server

Add your MCP server to Codex's MCP config (local process transport or stdio).

Verify with a smoke sequence:

1. Call `roblox_ping`.
2. Select a Script in Studio and call `roblox_get_selection`.
3. Send a tiny edit with `roblox_write_script`.
4. Confirm the Script changed in Studio.

## 6) Safe edit strategy (important)

For Roblox projects, prefer this workflow:

1. Read current script source.
2. Ask Codex for a patch/diff.
3. Apply patch.
4. Re-read and verify exact expected text.
5. Keep an undo snapshot in plugin memory.

Avoid blind full-file overwrite unless explicitly requested.

## 7) Example payloads

Read selection:

```json
{
  "requestId": "abc-123",
  "action": "read_selection",
  "payload": {}
}
```

Write script:

```json
{
  "requestId": "abc-124",
  "action": "write_script",
  "payload": {
    "path": "game.ServerScriptService.Main",
    "source": "print('hello from codex+mcp')"
  }
}
```

## 8) Common pitfalls

- Plugin HTTP not enabled in Studio environment.
- Endpoint bound to wrong host/port.
- Missing auth token match between plugin and MCP server.
- Attempting to edit non-script Instances.
- No rollback on failed apply.

## 9) Milestone plan

- **M1**: `ping` and `get_selection` working.
- **M2**: write script text working with undo.
- **M3**: insert instances and property patching.
- **M4**: add guardrails (allowlists, diff preview, operation logs).

## 10) Quick starter checklist

- [ ] Plugin toolbar + widget created
- [ ] Local bridge running on `127.0.0.1:8181`
- [ ] Shared token configured in both plugin and bridge
- [ ] MCP tools implemented (`ping`, `get_selection`, `write_script`)
- [ ] Codex MCP config updated
- [ ] End-to-end smoke test passed

If you want, next step is I can generate:

- a minimal **Luau plugin skeleton**,
- a minimal **Node MCP server** tool set,
- and matching **JSON schemas** for each tool.
