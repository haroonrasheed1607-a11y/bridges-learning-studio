export function validateImport(matrix, groups, students = []) {
  const headers = (matrix[0] || [])
    .slice(0, 3)
    .map((value) => String(value).trim().toLowerCase());
  if (
    ["student id", "student name", "class"].some(
      (value, index) => headers[index] !== value,
    )
  ) {
    throw new Error(
      "Use the sample headers in columns A–C: Student ID, Student Name, Class.",
    );
  }
  const rows = matrix
    .slice(1)
    .map((row, index) => ({
      row: index + 2,
      id: String(row[0] ?? "").trim(),
      name: String(row[1] ?? "").trim(),
      classText: String(row[2] ?? "").trim(),
    }))
    .filter((row) => row.id || row.name || row.classText);
  if (!rows.length) throw new Error("No student rows found.");
  if (rows.length > 1000)
    throw new Error("This preview supports up to 1,000 students per file.");
  const existing = new Set(students.map((student) => student.id.toLowerCase()));
  const counts = new Map();
  rows.forEach((row) =>
    counts.set(
      row.id.toLowerCase(),
      (counts.get(row.id.toLowerCase()) || 0) + 1,
    ),
  );
  return rows.map((row) => {
    const group = groups.findIndex(
      (g) => g.name.toLowerCase() === row.classText.toLowerCase(),
    );
    const errors = [];
    if (!row.id) errors.push("Missing ID");
    if (!row.name) errors.push("Missing name");
    if (group < 0) errors.push("Unknown class");
    if (
      row.id &&
      (existing.has(row.id.toLowerCase()) ||
        counts.get(row.id.toLowerCase()) > 1)
    )
      errors.push("Duplicate ID");
    return { ...row, group, error: errors.join(", ") };
  });
}
