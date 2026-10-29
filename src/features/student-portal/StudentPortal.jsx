import { useEffect, useState } from "react";
import { useWorkspace } from "../auth/WorkspaceProvider.jsx";
import Footer from "../../components/Footer.jsx";
import StudentActivity from "./StudentActivity.jsx";
import { loadStudentWorkspace } from "./studentRepository.js";
import "./student-portal.css";
export default function StudentPortal() {
  const { studentToken, signOutStudent } = useWorkspace();
  const [data, setData] = useState(null), [error, setError] = useState("");
  const [active, setActive] = useState(null), [view, setView] = useState("activities");
  const [signingOut, setSigningOut] = useState(false);
  async function refresh() {
    try { setData(await loadStudentWorkspace(studentToken)); setError(""); }
    catch (cause) { setError(cause.message); }
  }
  useEffect(() => { let alive = true;
    loadStudentWorkspace(studentToken).then(next => { if (alive) setData(next); })
      .catch(cause => { if (alive) setError(cause.message); });
    return () => { alive = false; };
  }, [studentToken]);
  async function logout() { setSigningOut(true); try { await signOutStudent(); } finally { setSigningOut(false); } }
  return <div className="student-shell">
    <header className="student-header">
      <strong>Learning Studio</strong>
      <nav aria-label="Student navigation">
        <button aria-current={view === "activities" ? "page" : undefined} onClick={() => {setView("activities");setActive(null);}}>My activities</button>
        <button aria-current={view === "results" ? "page" : undefined} onClick={() => {setView("results");setActive(null);}}>My results</button>
      </nav>
      <img src="/assets/bridges-logo.webp" alt="Bridges" />
      <button onClick={logout} disabled={signingOut}>{signingOut ? "Signing out…" : "Sign out"}</button>
    </header>
    <main className="student-main">
      {error && <div role="alert"><p>{error}</p><button onClick={refresh}>Retry</button></div>}
      {!data ? !error && <p role="status">Loading your activities…</p> : <>
        <p className="small">{data.student.school} · Student ID: {data.student.studentCode}</p>
        {active ? <StudentActivity key={active.id} activity={active} token={studentToken} onSaved={refresh} onBack={() => setActive(null)} /> : <>
          <h1>Hello, {data.student.name}</h1>
          <h2>{view === "activities" ? "My activities" : "My results"}</h2>
          {view === "activities" ? data.activities.length ? <div className="student-cards">
            {data.activities.map(activity => {
              const result = data.results.find(row => row.assignmentId === activity.id);
              return <article key={activity.id} className="student-card">
                <p className="small">{activity.definition.mode === "teaching" ? "Lesson" : "Assessment"} · Version {activity.versionNumber}</p>
                <h3>{activity.definition.title}</h3><p>{activity.definition.goal}</p>
                <p>{result ? "Latest score: " + result.score + " / " + result.possiblePoints : "Not started"}</p>
                <button className="primary" onClick={() => setActive(activity)}>{result ? "Open again" : "Open activity"}</button>
              </article>;
            })}
          </div> : <p>No activities assigned yet. Ask your teacher to add you to a group and send an activity.</p>
          : data.results.length ? <div className="student-table"><table><thead><tr><th>Activity</th><th>Score</th><th>Completed</th></tr></thead><tbody>
            {data.results.map(row => <tr key={row.id}><td>{row.title}</td><td>{row.score} / {row.possiblePoints}</td><td>{new Date(row.completedAt).toLocaleString()}</td></tr>)}
          </tbody></table></div> : <p>You have no results yet. Complete an assigned assessment to see your score here.</p>}
        </>}
      </>}
    </main>
    <Footer />
  </div>;
}
