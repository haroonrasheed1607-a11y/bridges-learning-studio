import { useStudio } from "../../state/StudioContext.jsx";
export default function CloudScorecards() {
  const {
    activities,
    students,
    versions,
    attempts,
    scoreView,
    setScoreView,
    scoreActivityId,
    setScoreActivityId,
    scoreStudentId,
    setScoreStudentId,
  } = useStudio();
  const assessments = activities.filter((a) => a.type === "Assessment");
  const activity =
    assessments.find((a) => a.id === scoreActivityId) || assessments[0];
  const student =
    students.find((s) => s.dbId === scoreStudentId) || students[0];
  const rows = attempts
    .map((attempt) => ({
      ...attempt,
      student: students.find((s) => s.dbId === attempt.student_id),
      version: versions.find((v) => v.id === attempt.version_id),
    }))
    .filter((attempt) => attempt.student && attempt.version);
  const displayed = rows.filter((row) =>
    scoreView === "activity"
      ? row.version.activity_id === activity?.id
      : row.student_id === student?.dbId,
  );
  return (
    <>
      <h2>Scoreboard</h2>
      <div className="score-filters" role="group" aria-label="Scorecard view">
        <button
          aria-pressed={scoreView === "activity"}
          onClick={() => setScoreView("activity")}
        >
          Activity Wise Score Card
        </button>
        <button
          aria-pressed={scoreView === "student"}
          onClick={() => setScoreView("student")}
        >
          Student Wise Score Card
        </button>
      </div>
      {scoreView === "activity" ? (
        <label className="field">
          Select activity
          <select
            value={activity?.id || ""}
            onChange={(e) => setScoreActivityId(e.target.value)}
          >
            {!assessments.length && (
              <option value="">No saved assessments</option>
            )}
            {assessments.map((a) => (
              <option key={a.id} value={a.id}>
                {a.title}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <label className="field">
          Select student
          <select
            value={student?.dbId || ""}
            onChange={(e) => setScoreStudentId(e.target.value)}
          >
            {!students.length && (
              <option value="">No students registered</option>
            )}
            {students.map((s) => (
              <option key={s.dbId} value={s.dbId}>
                {s.name} ({s.id})
              </option>
            ))}
          </select>
        </label>
      )}
      <p className="small">
        Each result belongs to the saved activity version used for that attempt.
      </p>
      {!displayed.length ? (
        <p>No recorded attempts yet.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>{scoreView === "activity" ? "Student" : "Activity"}</th>
              <th>Version</th>
              <th>Score</th>
              <th>Completed</th>
            </tr>
          </thead>
          <tbody>
            {displayed.map((row) => (
              <tr key={row.id}>
                <td>
                  <button
                    className="student-link"
                    onClick={() => {
                      if (scoreView === "activity") {
                        setScoreStudentId(row.student_id);
                        setScoreView("student");
                      } else {
                        setScoreActivityId(row.version.activity_id);
                        setScoreView("activity");
                      }
                    }}
                  >
                    {scoreView === "activity"
                      ? row.student.name
                      : row.version.definition.title}
                  </button>
                </td>
                <td>{row.version.version_number}</td>
                <td>
                  {row.score} / {row.possible_points}
                </td>
                <td>{new Date(row.completed_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
