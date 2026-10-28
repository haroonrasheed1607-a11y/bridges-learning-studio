import { test } from "node:test";
import assert from "node:assert/strict";
import { scoreRoster, resultFor, activityResults } from "./scoreData.js";
test("completed color results appear under the color activity only", () => {
  const roster = scoreRoster([], {
    complete: true,
    responses: [{ correct: true }, { correct: false }, { correct: true }],
  });
  const color = activityResults(roster, "color-recognition");
  assert.equal(color.length, 1);
  assert.equal(color[0].score, 2);
  assert.equal(resultFor(color[0], "adding-fractions").status, "Not assigned");
  assert.equal(activityResults(roster, "adding-fractions").length, 6);
});
test("duplicate display names do not combine student identities", () => {
  const roster = scoreRoster(
    [
      { id: "one", name: "Student 01" },
      { id: "two", name: "Student 01" },
    ],
    { complete: false },
  );
  assert.equal(new Set(roster.map((s) => s.id)).size, 8);
  assert.equal(activityResults(roster, "comparing-fractions").length, 0);
});
