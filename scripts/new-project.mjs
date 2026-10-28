#!/usr/bin/env node
import { mkdir, rm, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

const repository = fileURLToPath(new URL("..", import.meta.url));

export async function createProject({
  id,
  title,
  brand = null,
  projectsDir = join(repository, "projects"),
}) {
  if (!/^[a-z0-9][a-z0-9-]{1,62}$/.test(id || "")) {
    throw new Error("ID must be 2–63 lowercase letters, numbers or hyphens");
  }
  if (!title || !title.trim()) throw new Error("Project title is required");
  const target = resolve(projectsDir, id);
  const now = new Date().toISOString();
  const files = {
    "project.json": {
      schemaVersion: 1,
      id,
      title: title.trim(),
      brand: brand?.trim() || null,
      status: "draft",
      updatedAt: now,
      description: "",
      variants: [],
      finals: [],
    },
    "brief.json": {
      schemaVersion: 1,
      projectId: id,
      brand: brand?.trim() || null,
      product: null,
      objective: null,
      audience: null,
      placements: [],
      format: { width: 1080, height: 1920, fps: 30, durationSeconds: null },
      volumePerWeek: null,
      monthlyToolBudget: null,
      syntheticFaceAllowed: null,
      syntheticVoiceAllowed: null,
      allowedClaims: [],
      restrictions: [],
    },
    "ideas.json": { schemaVersion: 1, projectId: id, ideas: [] },
    "assets.json": { schemaVersion: 1, projectId: id, assets: [] },
    "approvals.json": { schemaVersion: 1, projectId: id, decisions: [] },
  };
  await mkdir(projectsDir, { recursive: true });
  await mkdir(target);
  try {
    await Promise.all(
      ["intake", "variants", "reviews"].map((name) =>
        mkdir(join(target, name)),
      ),
    );
    for (const [name, content] of Object.entries(files)) {
      await writeFile(
        join(target, name),
        `${JSON.stringify(content, null, 2)}\n`,
        { flag: "wx" },
      );
    }
  } catch (error) {
    await rm(target, { recursive: true, force: true });
    throw error;
  }
  return target;
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const [id, title, brand] = process.argv.slice(2);
  try {
    const output = await createProject({ id, title, brand });
    process.stdout.write(`${output}\n`);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}
