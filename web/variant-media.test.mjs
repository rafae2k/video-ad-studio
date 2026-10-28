import assert from "node:assert/strict";
import test from "node:test";
import { draftVideoPath } from "./variant-media.js";
test("draft playback accepts only MP4 exports in the owning project", () => {
  const project = "david-pronunciamento-black";
  const path = `/storage/exports/${project}/v1-pronunciamento.mp4`;
  assert.equal(draftVideoPath(project, path), path);
  for (const invalid of [
    "https://example.com/ad.mp4",
    "//example.com/ad.mp4",
    "/storage/exports/other/ad.mp4",
    `/storage/exports/${project}/../ad.mp4`,
    `/storage/exports/${project}/%2e%2e/ad.mp4`,
    `/storage/exports/${project}/ad.mp4?secret=x`,
    `/storage/exports/${project}/ad.webm`,
    `/storage/exports/${project}/ad\\x.mp4`,
    null,
  ])
    assert.equal(draftVideoPath(project, invalid), null);
  assert.equal(draftVideoPath("../other", path), null);
});
