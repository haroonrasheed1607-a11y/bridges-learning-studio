import { useStudio } from "../../state/StudioContext.jsx";
import { scoreRoster, resultFor, activityResults } from "./scoreData.js";
export default function Scorecards() {
  const {
    activities,
    students,
    color,
    scoreView,
    setScoreView,
    scoreActivityId,
    setScoreActivityId,
    scoreStudentId,
    setScoreStudentId,
  } = useStudio();
  const roster = scoreRoster(students, color);
  const assessments = activities.filter((a) => a.type === "Assessment");
  const activity =
    activities.find((a) => a.id === scoreActivityId) || assessments[0];
  const rows = activityResults(roster, activity.id);
  const completed = rows.filter((row) => row.score !== null);
  const average = completed.length
    ? Math.round(
        (completed.reduce((sum, row) => sum + row.score, 0) /
          completed.length /
          5) *
          100,
      ) + "%"
    : "—";
  const student = roster.find((s) => s.id === scoreStudentId) || roster[0];
  return (
    <>
      <div className="eyebrow">Results / Sample data</div>
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
        <>
          <label className="field">
            Select activity
            <select
              value={activity.id}
              onChange={(event) => setScoreActivityId(event.target.value)}
            >
              {assessments.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.title}
                </option>
              ))}
            </select>
          </label>
          <p className="small">{activity.grade} · 5 points</p>
          <div className="review">
            {rows.length ? (
              <>
                <strong>
                  {completed.length} of {rows.length} completed
                </strong>{" "}
                · Average score: {average}
              </>
            ) : (
              "No submissions yet for this activity."
            )}
          </div>
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Score</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <button
                      className="student-link"
                      onClick={() => {
                        setScoreStudentId(row.id);
                        setScoreView("student");
                      }}
                    >
                      {row.name}
                    </button>
                  </td>
                  <td>{row.score === null ? "—" : row.score + " / 5"}</td>
                  <td>{row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="small" style={{ marginTop: 18 }}>
            Select a student to see their activity results.
          </p>
        </>
      ) : (
        <>
          <label className="field">
            Select student
            <select
              value={student.id}
              onChange={(event) => setScoreStudentId(event.target.value)}
            >
              {roster.map((row) => (
                <option key={row.id} value={row.id}>
                  {row.name}
                </option>
              ))}
            </select>
          </label>
          <h3>{student.name}</h3>
          <p className="small">Results across assessment activities</p>
          <table>
            <thead>
              <tr>
                <th>Activity</th>
                <th>Score</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {assessments.map((a) => {
                const result = resultFor(student, a.id);
                return (
                  <tr key={a.id}>
                    <td>
                      <button
                        className="student-link"
                        onClick={() => {
                          setScoreActivityId(a.id);
                          setScoreView("activity");
                        }}
                      >
                        {a.title}
                      </button>
                    </td>
                    <td>
                      {result.score === null ? "—" : result.score + " / 5"}
                    </td>
                    <td>{result.status}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="small" style={{ marginTop: 18 }}>
            Teaching activities do not receive assessment scores. A dash means
            no scored submission.
          </p>
        </>
      )}
    </>
  );
}
