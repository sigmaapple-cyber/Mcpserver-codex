import dotenv from "dotenv";
import { z } from "zod";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema
} from "@modelcontextprotocol/sdk/types.js";

dotenv.config();

const BRIDGE_URL = process.env.BRIDGE_URL ?? "http://127.0.0.1:8181";
const TOKEN = process.env.SHARED_TOKEN ?? "change-me";

async function bridgePost(path, payload = {}) {
  const response = await fetch(`${BRIDGE_URL}${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-codex-token": TOKEN
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  if (!response.ok || !data.ok) {
    throw new Error(data.error || `Bridge error ${response.status}`);
  }
  return data.data;
}

const server = new Server(
  { name: "roblox-mcp-server", version: "0.1.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "roblox_ping",
      description: "Check bridge/plugin availability.",
      inputSchema: { type: "object", properties: {} }
    },
    {
      name: "roblox_get_selection",
      description: "Read selected script sources by path list.",
      inputSchema: {
        type: "object",
        properties: {
          selection: { type: "array", items: { type: "string" } }
        }
      }
    },
    {
      name: "roblox_write_script",
      description: "Write source into a script path.",
      inputSchema: {
        type: "object",
        properties: {
          path: { type: "string" },
          source: { type: "string" }
        },
        required: ["path", "source"]
      }
    },
    {
      name: "roblox_insert_instance",
      description: "Insert an instance under a parent path.",
      inputSchema: {
        type: "object",
        properties: {
          parentPath: { type: "string" },
          className: { type: "string" },
          name: { type: "string" }
        },
        required: ["parentPath", "className"]
      }
    },
    {
      name: "roblox_undo_last",
      description: "Undo the previous write operation.",
      inputSchema: { type: "object", properties: {} }
    }
  ]
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "roblox_ping") {
    const data = await bridgePost("/plugin/ping");
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }

  if (name === "roblox_get_selection") {
    const schema = z.object({ selection: z.array(z.string()).default([]) });
    const input = schema.parse(args ?? {});
    const data = await bridgePost("/plugin/read_selection", input);
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }

  if (name === "roblox_write_script") {
    const schema = z.object({ path: z.string().min(1), source: z.string() });
    const input = schema.parse(args ?? {});
    const data = await bridgePost("/plugin/write_script", input);
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }

  if (name === "roblox_insert_instance") {
    const schema = z.object({
      parentPath: z.string().min(1),
      className: z.string().min(1),
      name: z.string().optional()
    });
    const input = schema.parse(args ?? {});
    const data = await bridgePost("/plugin/insert_instance", input);
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }

  if (name === "roblox_undo_last") {
    const data = await bridgePost("/plugin/undo_last");
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }

  throw new Error(`Unknown tool: ${name}`);
});

const transport = new StdioServerTransport();
await server.connect(transport);
