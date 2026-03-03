# Codex + MCP + Roblox Studio Starter (Working Scaffold)

You asked to "make it here" — this repo now includes an actual scaffold:

- `mcp-server/server.js`: MCP tool server (stdio transport)
- `bridge/server.js`: local HTTP bridge for plugin-facing actions
- `roblox-plugin/CodexMCPPlugin.lua`: Roblox Studio plugin script

## 1) Install dependencies

```bash
npm install
```

## 2) Configure env

Create `.env` from `.env.example` and set a strong token.

```bash
cp .env.example .env
```

## 3) Start bridge

```bash
npm run start:bridge
```

Bridge defaults to `http://127.0.0.1:8181`.

## 4) Start MCP server

In another terminal:

```bash
npm run start:mcp
```

Register this process in your Codex MCP configuration.

## 5) Install plugin into Roblox Studio

1. Open Studio.
2. Create a new plugin script.
3. Paste `roblox-plugin/CodexMCPPlugin.lua`.
4. Update `BRIDGE_URL` and `TOKEN` in the script to match `.env`.
5. Enable HTTP requests for Studio/plugin environment.

## 6) Smoke test with MCP tools

Use these tools from Codex:

- `roblox_ping`
- `roblox_get_selection` with `selection` paths
- `roblox_write_script` with `{ path, source }`
- `roblox_insert_instance` with `{ parentPath, className, name? }`
- `roblox_undo_last`

## Notes

- The bridge currently uses an in-memory script store for bootstrapping.
- The plugin currently demonstrates ping + selection read flow.
- Extend this by mapping paths to real `LuaSourceContainer` instances and adding strict allowlists.
