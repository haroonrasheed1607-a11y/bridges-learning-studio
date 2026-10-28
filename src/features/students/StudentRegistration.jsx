import { useState } from "react";
import { useStudio } from "../../state/StudioContext.jsx";
import { validateImport } from "./importValidation.js";
export default function StudentRegistration() {
  const {
    students,
    addStudents,
    groups,
    feedback,
    setFeedback,
    isCloud,
    busy,
  } = useStudio();
  const [pending, setPending] = useState([]);
  const [filename, setFilename] = useState("");
  const [error, setError] = useState("");
  const [reading, setReading] = useState(false);
  async function upload(file) {
    if (!file) return;
    setPending([]);
    setError("");
    setFilename(file.name);
    setReading(true);
    try {
      if (!/\.xlsx$/i.test(file.name)) throw new Error("Choose an .xlsx file.");
      if (file.size > 5 * 1024 * 1024)
        throw new Error("Choose a file smaller than 5 MB.");
      const XLSX = window.XLSX;
      if (!XLSX)
        throw new Error(
          "The Excel reader is not available. Reload the page and try again.",
        );
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const sheet =
        workbook.Sheets.Students || workbook.Sheets[workbook.SheetNames[0]];
      setPending(
        validateImport(
          XLSX.utils.sheet_to_json(sheet, {
            header: 1,
            defval: "",
            raw: false,
          }),
          groups,
          students,
        ),
      );
    } catch (cause) {
      setError(cause.message);
    } finally {
      setReading(false);
    }
  }
  async function importStudents() {
    if (
      !pending.length ||
      pending.some((row) => row.error) ||
      !(await addStudents(pending))
    ) {
      setError(
        "Correct the workbook errors or duplicate IDs, then upload again.",
      );
      return;
    }
    setFeedback(
      pending.length +
        (isCloud
          ? " students saved to your school workspace."
          : " students imported into this preview."),
    );
    setPending([]);
    setFilename("");
    setError("");
  }
  async function register(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const name = data.get("name").trim(),
      id = data.get("studentId").trim(),
      group = Number(data.get("group"));
    if (!name || !id) {
      setFeedback("Enter a name and student ID.");
      return;
    }
    if (!(await addStudents([{ name, id, group }]))) {
      setFeedback("That student ID has already been added.");
      return;
    }
    setFeedback(
      name +
        (isCloud
          ? " saved to your school workspace."
          : " added in this sample."),
    );
    form.reset();
  }
  const invalid = pending.filter((row) => row.error).length;
  return (
    <>
      <div className="eyebrow">Student registration</div>
      <h2>Sign Up Students</h2>
      <h3>Upload an Excel file</h3>
      {!groups.length && (
        <p role="status">
          Create a student group first, then use its exact name in the Excel
          Class column.
        </p>
      )}
      <p className="small">
        Use the sample format: Student ID, Student Name, Class.
      </p>
      <div className="actions" style={{ marginTop: 12 }}>
        <a
          className="sample-download"
          href="/assets/Student_Import_Template.xlsx"
          download="Student_Import_Template.xlsx"
        >
          Download sample Excel
        </a>
      </div>
      <label className="field">
        Choose workbook (.xlsx, up to 5 MB)
        <input
          type="file"
          accept=".xlsx"
          onChange={(event) => upload(event.target.files[0])}
        />
      </label>
      <div aria-live="polite">
        {filename && <p className="small">{filename}</p>}
        {reading && <p>Reading workbook…</p>}
        {error && <p role="alert">{error}</p>}
        {!!pending.length && (
          <>
            <p>
              <strong>{pending.length} rows</strong> · {invalid} need correction
            </p>
            <table>
              <thead>
                <tr>
                  <th>Row</th>
                  <th>Student</th>
                  <th>Class</th>
                  <th>Check</th>
                </tr>
              </thead>
              <tbody>
                {pending.slice(0, 10).map((row) => (
                  <tr key={row.row}>
                    <td>{row.row}</td>
                    <td>
                      {row.name}
                      <br />
                      <span className="small">{row.id}</span>
                    </td>
                    <td>{row.classText}</td>
                    <td>{row.error || "Ready"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {pending.length > 10 && (
              <p className="small">
                Showing the first 10 rows. All rows are validated.
              </p>
            )}
            <div className="actions">
              <button
                className="primary"
                disabled={!!invalid || busy}
                onClick={importStudents}
              >
                Import {pending.length} students
              </button>
            </div>
          </>
        )}
      </div>
      <div className="line" />
      <details>
        <summary>Or add one student manually</summary>
        <form onSubmit={register}>
          <label className="field">
            Student name
            <input name="name" required placeholder="Enter student name" />
          </label>
          <label className="field">
            Student ID
            <input
              name="studentId"
              required
              placeholder="Enter a unique student ID"
            />
          </label>
          <label className="field">
            Class
            <select name="group">
              {groups.map((group, index) => (
                <option key={group.name} value={index}>
                  {group.name}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="primary"
            disabled={busy || !groups.length}
          >
            Sign up student
          </button>
        </form>
      </details>
      <div className="status" role="status">
        {feedback}
      </div>
      <div className="line" />
      <h3>Added students ({students.length})</h3>
      {students.length ? (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Student ID</th>
              <th>Class</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr key={student.id}>
                <td>{student.name}</td>
                <td>{student.id}</td>
                <td>{groups[student.group]?.name || "No group"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="small">No students added yet.</p>
      )}
      <p className="small" style={{ marginTop: 18 }}>
        {isCloud
          ? "Student records are saved privately. Student login accounts are not created by this form."
          : "Sample registration only. No real accounts are created."}
      </p>
    </>
  );
}
