import assert from "node:assert/strict";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { createProject } from "./new-project.mjs";

test("creates the project contract without replacing existing work", async () => {
  const root = await mkdtemp(join(tmpdir(), "video-project-test-"));
  try {
    const output = await createProject({
      id: "sample-ad",
      title: "  Sample Ad  ",
      projectsDir: root,
    });
    const files = (await readdir(output)).sort();
    assert.deepEqual(files, [
      "approvals.json",
      "assets.json",
      "brief.json",
      "ideas.json",
      "intake",
      "project.json",
      "reviews",
      "variants",
    ]);
    const project = JSON.parse(
      await readFile(join(output, "project.json"), "utf8"),
    );
    assert.equal(project.title, "Sample Ad");
    assert.deepEqual(project.finals, []);
    await assert.rejects(
      createProject({ id: "sample-ad", title: "Overwrite", projectsDir: root }),
    );
    const retained = JSON.parse(
      await readFile(join(output, "project.json"), "utf8"),
    );
    assert.equal(retained.title, "Sample Ad");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("rejects path-like identifiers and missing titles", async () => {
  await assert.rejects(createProject({ id: "../secret", title: "Unsafe" }));
  await assert.rejects(createProject({ id: "valid-id", title: " " }));
});
