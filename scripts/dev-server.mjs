import { createServer } from "node:http";
import { createReadStream } from "node:fs";
import { readFile, readdir, realpath, stat } from "node:fs/promises";
import { extname, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const allowedRoots = [
  "web",
  "packages/video",
  "projects",
  "assets/sfx",
  "research/ai-video-editing/video-review/screenshots",
  "research/ai-video-editing/video-review/videos",
  "research/ai-video-editing/source-videos",
  "storage/exports",
];

const mime = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".mp4": "video/mp4",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".webm": "video/webm",
  ".wav": "audio/wav",
};

export function resolveRequestPath(urlPath) {
  let pathname;
  try {
    pathname = decodeURIComponent(
      new URL(urlPath, "http://localhost").pathname,
    );
  } catch {
    return null;
  }
  if (pathname.includes("\\") || pathname.includes("\0")) return null;
  const parts = pathname.split("/").filter(Boolean);
  if (parts.some((part) => part.startsWith(".") || part === "..")) return null;
  if (
    parts[0] === "projects" &&
    !(
      parts.length === 4 &&
      parts[2] === "variants" &&
      parts[3].endsWith(".json")
    )
  )
    return null;
  const mapped =
    parts.length === 0
      ? "web/index.html"
      : parts[0] === "web"
        ? parts.join("/")
        : parts.join("/");
  const candidate = resolve(repoRoot, mapped);
  const permitted = allowedRoots.some((root) => {
    const rel = relative(resolve(repoRoot, root), candidate);
    return (
      rel === "" ||
      (rel !== ".." && !rel.startsWith(`..${sep}`) && !rel.startsWith(sep))
    );
  });
  return permitted ? candidate : null;
}

const publicProjectKeys = [
  "id",
  "title",
  "brand",
  "status",
  "updatedAt",
  "description",
  "thumbnail",
  "variants",
  "finals",
];
const publicIdeaKeys = [
  "id",
  "title",
  "status",
  "hook",
  "hookHypothesis",
  "message",
  "beats",
  "cta",
  "format",
  "duration",
  "visualDirection",
  "direction",
  "style",
  "note",
  "source",
  "sources",
  "sourceSpan",
  "claimIds",
  "reuseCandidateIds",
  "requiredAssets",
  "risks",
  "pending",
];
const pick = (record, keys) =>
  Object.fromEntries(
    keys
      .filter((key) => Object.hasOwn(record, key))
      .map((key) => [key, record[key]]),
  );

async function readLocalJson(path) {
  // Reject symlinked files or ancestors rather than reading outside this workspace.
  if ((await realpath(path)) !== path)
    throw new Error("Symlink is not allowed");
  return JSON.parse(await readFile(path, "utf8"));
}

export async function readProjects(root = repoRoot) {
  let entries;
  try {
    entries = await readdir(resolve(root, "projects"), { withFileTypes: true });
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
  const projects = [];
  for (const entry of entries.filter(
    (item) => item.isDirectory() && !item.name.startsWith("."),
  )) {
    const folder = resolve(root, "projects", entry.name);
    let project;
    try {
      project = await readLocalJson(resolve(folder, "project.json"));
    } catch {
      continue;
    }
    if (!project || project.id !== entry.name) continue;
    const output = { ...pick(project, publicProjectKeys), ideas: [] };
    try {
      const document = await readLocalJson(resolve(folder, "ideas.json"));
      const ideas = Array.isArray(document) ? document : document.ideas;
      if (
        !Array.isArray(ideas) ||
        (document.projectId && document.projectId !== project.id)
      )
        throw new Error("Invalid ideas document");
      output.ideas = ideas
        .filter(
          (idea) =>
            idea &&
            typeof idea === "object" &&
            typeof idea.id === "string" &&
            typeof idea.title === "string",
        )
        .map((idea) => pick(idea, publicIdeaKeys));
    } catch (error) {
      if (error.code !== "ENOENT") output.ideasUnavailable = true;
    }
    projects.push(output);
  }
  return projects;
}

function reply(res, status, body, extra = {}) {
  res.writeHead(status, {
    "content-type": "text/plain; charset=utf-8",
    "cache-control": "no-store",
    ...extra,
  });
  res.end(body);
}

async function handle(req, res) {
  if (!["GET", "HEAD"].includes(req.method))
    return reply(res, 405, "Method not allowed");
  if (req.url === "/api/projects") {
    try {
      const projects = await readProjects();
      const body = JSON.stringify({ projects });
      res.writeHead(200, {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store",
        "content-length": Buffer.byteLength(body),
      });
      return res.end(req.method === "HEAD" ? undefined : body);
    } catch (error) {
      if (error.code !== "ENOENT") return reply(res, 500, "Server error");
      const body = '{"projects":[]}';
      res.writeHead(200, {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store",
        "content-length": Buffer.byteLength(body),
      });
      return res.end(req.method === "HEAD" ? undefined : body);
    }
  }
  const path = resolveRequestPath(req.url || "/");
  if (!path) return reply(res, 403, "Forbidden");
  try {
    const [real, info] = await Promise.all([realpath(path), stat(path)]);
    if (real !== path || !info.isFile()) return reply(res, 403, "Forbidden");
    const type = mime[extname(path).toLowerCase()];
    if (!type) return reply(res, 403, "Forbidden");
    const headers = {
      "content-type": type,
      "accept-ranges": "bytes",
      "cache-control": "no-store",
    };
    const range = req.headers.range;
    if (range) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(range);
      if (!match)
        return reply(res, 416, "Invalid range", {
          "content-range": `bytes */${info.size}`,
        });
      const start = match[1]
        ? Number(match[1])
        : Math.max(0, info.size - Number(match[2] || 0));
      const end = match[1]
        ? match[2]
          ? Number(match[2])
          : info.size - 1
        : info.size - 1;
      if (start > end || end >= info.size)
        return reply(res, 416, "Invalid range", {
          "content-range": `bytes */${info.size}`,
        });
      res.writeHead(206, {
        ...headers,
        "content-length": end - start + 1,
        "content-range": `bytes ${start}-${end}/${info.size}`,
      });
      if (req.method === "HEAD") return res.end();
      return createReadStream(path, { start, end }).pipe(res);
    }
    res.writeHead(200, { ...headers, "content-length": info.size });
    if (req.method === "HEAD") return res.end();
    createReadStream(path).pipe(res);
  } catch (error) {
    if (error.code === "ENOENT") return reply(res, 404, "Not found");
    reply(res, 500, "Server error");
  }
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const port = Number(process.env.PORT || 4173);
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw new Error("Invalid PORT");
  createServer((req, res) => {
    res.setHeader("x-content-type-options", "nosniff");
    res.setHeader("x-frame-options", "DENY");
    res.setHeader("cross-origin-resource-policy", "same-origin");
    res.setHeader(
      "content-security-policy",
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob:; connect-src 'self'; font-src 'self'; object-src 'none'; base-uri 'none'",
    );
    handle(req, res);
  }).listen(port, "127.0.0.1", () => {
    process.stdout.write(`Local workbench: http://127.0.0.1:${port}/\n`);
  });
}
