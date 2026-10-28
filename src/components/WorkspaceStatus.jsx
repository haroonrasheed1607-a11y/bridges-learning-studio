import { useState } from "react";
import { useWorkspace } from "../features/auth/WorkspaceProvider.jsx";
export default function WorkspaceStatus() {
  const w = useWorkspace();
  const [error, setError] = useState("");
  async function signOut() {
    setError("");
    try {
      await w.signOut();
    } catch (cause) {
      setError("Sign out failed. Please try again: " + cause.message);
    }
  }
  return (
    <div className="workspace-notice">
      <span>
        {w.isCloud
          ? `${w.profile.name} · School workspace`
          : "Demo mode · Data resets when this page reloads"}
      </span>
      {w.configured && !w.isCloud && (
        <button onClick={w.openSignIn}>Teacher sign in</button>
      )}
      {w.isCloud && <button onClick={signOut}>Sign out</button>}
      {error && <span role="alert">{error}</span>}
    </div>
  );
}
