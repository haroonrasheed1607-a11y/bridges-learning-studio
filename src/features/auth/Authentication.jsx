import { useState } from "react";
import { useWorkspace } from "./WorkspaceProvider.jsx";
import "./auth.css";
export default function Authentication() {
  const workspace = useWorkspace();
  const [role, setRole] = useState("teacher");
  const [pending, setPending] = useState(false),
    [message, setMessage] = useState("");
  async function submit(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setPending(true);
    setMessage("");
    try {
      if (workspace.needsWorkspace)
        await workspace.createWorkspace(data.get("school"), data.get("name"));
      else if (role === "student") await workspace.signInStudent(data.get("studentId"));
      else await workspace.signIn(data.get("username"), data.get("password"));
    } catch (error) {
      setMessage(error.message);
    } finally {
      setPending(false);
    }
  }
  return (
    <section className="auth-screen">
      <div className="auth-card">
        <img
          className="auth-logo"
          src="/assets/bridges-logo.webp"
          alt="Bridges"
        />
        <h1>
          {workspace.needsWorkspace
            ? "Create your school workspace"
            : role === "student" ? "Student sign in" : "Teacher sign in"}
        </h1>
        {!workspace.needsWorkspace && (
          <div className="login-roles" role="group" aria-label="Choose login type">
            {["teacher", "student"].map(value => (
              <button key={value} type="button" aria-pressed={role === value}
                disabled={pending} onClick={() => { setRole(value); setMessage(""); }}>
                {value === "student" ? "Student" : "Teacher"}
              </button>
            ))}
          </div>
        )}
        <form onSubmit={submit} key={role}>
          {workspace.needsWorkspace ? (
            <>
              <label className="field">
                Your name
                <input name="name" required maxLength={160} />
              </label>
              <label className="field">
                School name
                <input name="school" required maxLength={160} />
              </label>
            </>
          ) : role === "student" ? (
            <>
              <p>Enter the Student ID provided by your teacher. No password needed.</p>
              <label className="field">Student ID
                <input name="studentId" autoComplete="username" autoCapitalize="none"
                  spellCheck={false} required maxLength={160} placeholder="Enter your Student ID" />
              </label>
            </>
          ) : (
            <>
              <label className="field">
                Username
                <input
                  name="username"
                  type="text"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  required
                />
              </label>
              <label className="field">
                Password
                <input
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                />
              </label>
            </>
          )}
          <button
            className="primary"
            disabled={pending || Boolean(workspace.error)}
          >
            {pending
              ? "Please wait…"
              : workspace.needsWorkspace
                ? "Create workspace"
                : "Sign in"}
          </button>
        </form>
        <p role="status">{message || workspace.error}</p>
        <button className="auth-link" onClick={workspace.tryDemo}>
          Continue with the demo
        </button>
      </div>
    </section>
  );
}
