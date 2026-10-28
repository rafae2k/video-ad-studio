import assert from "node:assert/strict";
import test from "node:test";
import { resolveRequestPath } from "./dev-server.mjs";

test("serves only the browser app and approved media folders", () => {
  assert.match(resolveRequestPath("/"), /web\/index\.html$/);
  assert.match(
    resolveRequestPath("/packages/video/index.js"),
    /packages\/video\/index\.js$/,
  );
  assert.match(
    resolveRequestPath("/assets/sfx/whoosh.wav"),
    /assets\/sfx\/whoosh\.wav$/,
  );
  assert.match(
    resolveRequestPath("/projects/sample/variants/v1.json"),
    /projects\/sample\/variants\/v1\.json$/,
  );
  assert.match(
    resolveRequestPath("/research/ai-video-editing/source-videos/example.mp4"),
    /source-videos\/example\.mp4$/,
  );
  assert.match(
    resolveRequestPath("/storage/exports/demo/v1.mp4"),
    /storage\/exports\/demo\/v1\.mp4$/,
  );
});

test("does not expose credentials, dotfiles or unrelated repository files", () => {
  for (const target of [
    "/.env",
    "/.git/config",
    "/package.json",
    "/projects/sample/brief.json",
    "/projects/sample/approvals.json",
    "/research/ai-video-ads/README.md",
    "/web/%2e%2e/.env",
    "/web/%5c.env",
  ]) {
    assert.equal(resolveRequestPath(target), null, target);
  }
});

import {
  mkdtemp,
  mkdir,
  writeFile,
  symlink,
  rm,
  realpath,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readProjects } from "./dev-server.mjs";

test("project API includes versioned ideas without exposing private project files or fields", async () => {
  const root = await realpath(await mkdtemp(join(tmpdir(), "studio-ideas-")));
  try {
    const folder = join(root, "projects", "sample");
    await mkdir(folder, { recursive: true });
    await writeFile(
      join(folder, "project.json"),
      JSON.stringify({
        id: "sample",
        title: "Sample",
        brief: { private: true },
        approvals: ["private"],
        assets: ["private"],
      }),
    );
    await writeFile(join(folder, "brief.json"), "PRIVATE BRIEF");
    await writeFile(
      join(folder, "ideas.json"),
      JSON.stringify({
        projectId: "sample",
        ideas: [
          {
            id: "i1",
            title: "A hook",
            hookHypothesis: "Hello",
            status: "proposed",
            privateNotes: "omit",
          },
        ],
      }),
    );
    const result = await readProjects(root);
    assert.deepEqual(result, [
      {
        id: "sample",
        title: "Sample",
        ideas: [
          {
            id: "i1",
            title: "A hook",
            status: "proposed",
            hookHypothesis: "Hello",
          },
        ],
      },
    ]);
    await writeFile(join(folder, "ideas.json"), "{invalid");
    assert.equal((await readProjects(root))[0].ideasUnavailable, true);
    await rm(join(folder, "ideas.json"));
    assert.deepEqual((await readProjects(root))[0].ideas, []);
    await symlink(join(folder, "brief.json"), join(folder, "ideas.json"));
    assert.equal((await readProjects(root))[0].ideasUnavailable, true);
    await rm(join(folder, "project.json"));
    await symlink(join(folder, "brief.json"), join(folder, "project.json"));
    assert.deepEqual(await readProjects(root), []);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("raw idea and asset documents remain outside static allowlist", () => {
  assert.equal(resolveRequestPath("/projects/sample/ideas.json"), null);
  assert.equal(resolveRequestPath("/projects/sample/assets.json"), null);
});
