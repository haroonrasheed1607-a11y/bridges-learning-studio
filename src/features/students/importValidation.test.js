import { test } from "node:test";
import assert from "node:assert/strict";
import { validateImport } from "./importValidation.js";
const groups = [{ name: "Grade 7 · Section A" }];
const header = ["Student ID", "Student Name", "Class"];
test("valid workbook rows map to the intended group and ignore blank rows", () => {
  const rows = validateImport(
    [header, [" A1 ", " Ada ", "grade 7 · section a"], ["", "", ""]],
    groups,
  );
  assert.equal(rows.length, 1);
  assert.equal(rows[0].name, "Ada");
  assert.equal(rows[0].group, 0);
  assert.equal(rows[0].error, "");
});
test("invalid IDs, unknown groups and missing names are rejected", () => {
  const rows = validateImport(
    [
      header,
      ["A1", "", "Unknown"],
      ["a1", "Bob", groups[0].name],
      ["A2", "Chris", groups[0].name],
    ],
    groups,
    [{ id: "A2" }],
  );
  assert.match(rows[0].error, /Missing name/);
  assert.match(rows[0].error, /Unknown class/);
  rows.forEach((row) => assert.match(row.error, /Duplicate ID/));
});
test("bad workbook shape, empty files and excessive row counts fail clearly", () => {
  assert.throws(() => validateImport([["Name"]], groups), /sample headers/);
  assert.throws(() => validateImport([header], groups), /No student rows/);
  assert.throws(
    () =>
      validateImport(
        [
          header,
          ...Array.from({ length: 1001 }, (_, i) => [
            i,
            "Student",
            groups[0].name,
          ]),
        ],
        groups,
      ),
    /1,000/,
  );
});

test("students can be imported without classes, including into a school with no groups", () => {
  const rows = validateImport([header, ["U1", "Una", ""], ["U2", "Bo", "--"]], []);
  assert.ok(rows.every(row => row.group === -1 && row.error === ""));
});
