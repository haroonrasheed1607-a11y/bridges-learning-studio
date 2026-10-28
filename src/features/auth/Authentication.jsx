import { useState } from "react";
import { useWorkspace } from "./WorkspaceProvider.jsx";
import "./auth.css";
export default function Authentication() {
  const workspace = useWorkspace();
  const [signup, setSignup] = useState(false),
    [pending, setPending] = useState(false),
    [message, setMessage] = useState("");
  async function submit(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setPending(true);
    setMessage("");
    try {
      if (workspace.needsWorkspace)
        await workspace.createWorkspace(data.get("school"), data.get("name"));
      else if (signup) {
        const signedIn = await workspace.signUp(
          data.get("email"),
          data.get("password"),
        );
        if (!signedIn)
          setMessage("Check your email to confirm your account, then sign in.");
      } else await workspace.signIn(data.get("email"), data.get("password"));
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
            : signup
              ? "Create a teacher account"
              : "Teacher sign in"}
        </h1>
        <form onSubmit={submit}>
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
          ) : (
            <>
              <label className="field">
                Email
                <input
                  name="email"
                  type="email"
                  autoComplete="username"
                  required
                />
              </label>
              <label className="field">
                Password
                <input
                  name="password"
                  type="password"
                  autoComplete={signup ? "new-password" : "current-password"}
                  minLength={8}
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
                : signup
                  ? "Create account"
                  : "Sign in"}
          </button>
        </form>
        {!workspace.needsWorkspace && (
          <button
            className="auth-link"
            onClick={() => {
              setSignup(!signup);
              setMessage("");
            }}
          >
            {signup
              ? "Already registered? Sign in"
              : "Create a teacher account"}
          </button>
        )}
        <p role="status">{message || workspace.error}</p>
        <button className="auth-link" onClick={workspace.tryDemo}>
          Continue with the demo
        </button>
      </div>
    </section>
  );
}
