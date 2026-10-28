import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  validateProject,
  activeLayers,
  animationState,
  synthesizeSfx,
  SFX,
} from "../index.js";
const demo = JSON.parse(
  await readFile(new URL("../examples/demo.json", import.meta.url), "utf8"),
);
test("examples validate and every layer is active at its first frame, absent at its end", async () => {
  for (const name of ["demo", "demo-variant"]) {
    const project = JSON.parse(
      await readFile(
        new URL(`../examples/${name}.json`, import.meta.url),
        "utf8",
      ),
    );
    assert.deepEqual(validateProject(project), []);
    for (const layer of project.layers) {
      assert.ok(activeLayers(project, layer.start).includes(layer));
      assert.ok(
        !activeLayers(project, layer.start + layer.duration).includes(layer),
      );
    }
  }
});
test("invalid timeline and coordinates are rejected before rendering", () => {
  const bad = structuredClone(demo);
  bad.layers[0].duration = 99;
  bad.layers[1].id = bad.layers[0].id;
  bad.layers[2].x = Infinity;
  bad.fps = 0;
  assert.equal(validateProject(bad).length, 4);
  assert.deepEqual(validateProject(null), ["Project must be an object"]);
});
test("animation frame results are deterministic regardless of seeking order", () => {
  const layer = demo.layers[0];
  const first = animationState(layer, 1);
  animationState(layer, 2);
  animationState(layer, 0);
  assert.deepEqual(animationState(layer, 1), first);
  assert.equal(animationState(layer, 0).alpha, 0);
  assert.equal(animationState(layer, layer.duration).alpha, 0);
});
test("SFX files are deterministic valid PCM, bounded, non-silent and de-clicked", () => {
  for (const id of SFX) {
    const a = synthesizeSfx(id),
      b = synthesizeSfx(id);
    assert.deepEqual(a, b);
    const v = new DataView(a.buffer);
    assert.equal(new TextDecoder().decode(a.slice(0, 4)), "RIFF");
    assert.equal(v.getUint32(4, true) + 8, a.length);
    assert.equal(v.getUint32(24, true), 44100);
    const samples = [];
    for (let i = 44; i < a.length; i += 2) samples.push(v.getInt16(i, true));
    assert.equal(samples[0], 0);
    assert.equal(samples.at(-1), 0);
    assert.ok(samples.some((s) => Math.abs(s) > 100));
    assert.ok(samples.every((s) => Math.abs(s) <= 32767));
  }
  assert.throws(() => synthesizeSfx("missing"));
  assert.throws(() => synthesizeSfx("click", { duration: -1 }));
  assert.throws(() => synthesizeSfx("click", { gain: 2 }));
});
