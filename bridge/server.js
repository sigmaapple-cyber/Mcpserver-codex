import express from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json({ limit: "1mb" }));

const HOST = process.env.BRIDGE_HOST ?? "127.0.0.1";
const PORT = Number(process.env.BRIDGE_PORT ?? 8181);
const TOKEN = process.env.SHARED_TOKEN ?? "change-me";

const scriptStore = new Map();
const undoStack = [];

function ensureToken(req, res, next) {
  const token = req.header("x-codex-token");
  if (token !== TOKEN) {
    return res.status(401).json({ ok: false, error: "invalid token" });
  }
  return next();
}

app.use("/plugin", ensureToken);

app.post("/plugin/ping", (_req, res) => {
  res.json({ ok: true, data: { bridge: "online", now: Date.now() } });
});

app.post("/plugin/read_selection", (req, res) => {
  const selection = req.body?.selection ?? [];
  const scripts = selection.map((path) => ({
    path,
    source: scriptStore.get(path) ?? ""
  }));
  res.json({ ok: true, data: { scripts } });
});

app.post("/plugin/write_script", (req, res) => {
  const { path, source } = req.body ?? {};
  if (!path || typeof source !== "string") {
    return res.status(400).json({ ok: false, error: "path and source required" });
  }
  undoStack.push({ path, source: scriptStore.get(path) ?? "" });
  scriptStore.set(path, source);
  return res.json({ ok: true, data: { path, bytes: source.length } });
});

app.post("/plugin/insert_instance", (req, res) => {
  const { parentPath, className, name } = req.body ?? {};
  if (!parentPath || !className) {
    return res.status(400).json({ ok: false, error: "parentPath and className required" });
  }
  return res.json({
    ok: true,
    data: {
      parentPath,
      className,
      name: name ?? `${className}FromCodex`
    }
  });
});

app.post("/plugin/undo_last", (_req, res) => {
  const last = undoStack.pop();
  if (!last) {
    return res.json({ ok: true, data: { undone: false } });
  }
  scriptStore.set(last.path, last.source);
  return res.json({ ok: true, data: { undone: true, path: last.path } });
});

app.listen(PORT, HOST, () => {
  console.log(`Bridge listening at http://${HOST}:${PORT}`);
});
