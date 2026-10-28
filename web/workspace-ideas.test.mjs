import test from "node:test";
import assert from "node:assert/strict";
import { normalizeWorkspaceIdeas } from "./workspace-ideas.js";
test("versioned ideas retain source status and project identity without mutating source", () => {
  const raw = {
    id: "campaign",
    title: "Campaign",
    ideas: [
      {
        id: "same-id",
        title: "Concept",
        status: "rejected",
        hookHypothesis: "Try this",
        visualDirection: "Photo",
        beats: [{ text: "Hello" }],
      },
    ],
  };
  const before = structuredClone(raw);
  const [idea] = normalizeWorkspaceIdeas(raw);
  assert.equal(idea.id, "workspace:campaign:same-id");
  assert.equal(idea.hook, "Try this");
  assert.equal(idea.sourceStatus, "rejected");
  assert.equal(idea.status, "draft");
  assert.equal(idea.duration, null);
  assert.deepEqual(raw, before);
});
