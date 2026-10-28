import VersionHistory from "./VersionHistory.jsx";
import { useState } from "react";
import { useStudio } from "../../state/StudioContext.jsx";
import ColorActivity from "./ColorActivity.jsx";
import SendActivityDialog from "./SendActivityDialog.jsx";
export default function ActivityBuilder() {
  const {
    activeActivity: activity,
    mode,
    draft,
    setDraft,
    saved,
    saveActivity,
    feedback,
    busy,
    source,
    isCloud,
    editActivity,
  } = useStudio();
  const [sending, setSending] = useState(false);
  return (
    <>
      <label className="field">
        Activity title
        <input
          value={activity.title}
          onChange={(event) => editActivity({ title: event.target.value })}
        />
      </label>
      <label className="field">
        Learning objective
        <textarea
          value={activity.goal || ""}
          onChange={(event) => editActivity({ goal: event.target.value })}
        />
      </label>
      <VersionHistory />
      {draft &&
      mode === "assessment" &&
      (activity.kind === "color" || activity.id === "color-recognition") ? (
        <ColorActivity />
      ) : (
        <>
          <div className="eyebrow">
            {mode === "assessment" ? "Assessment" : "Teaching"} /{" "}
            {saved ? "Saved" : "Draft"}
          </div>
          <h2>Build a new Activity</h2>
          <p className="small">
            {activity.title} · {activity.grade}
          </p>
          {draft ? (
            <>
              <div className="line" />
              <h3>
                {mode === "assessment"
                  ? "Student question"
                  : "Concept explanation"}
              </h3>
              <p className="equation">
                {mode === "assessment" ? activity.prompt : activity.answer}
              </p>
              <div className="placeholder">
                [ Picture / audio / video content preview ]
              </div>
              <h3>Learning objective</h3>
              <p>{activity.goal}</p>
            </>
          ) : (
            <div className="empty">
              <div className="placeholder">[ Live activity preview ]</div>
              <p>Start with a prompt in the chat panel.</p>
              <div className="actions">
                <button className="primary" onClick={() => setDraft(true)}>
                  Use color example
                </button>
              </div>
            </div>
          )}
        </>
      )}
      <div className="line" />
      <div
        className="actions"
        style={{ justifyContent: draft ? "space-between" : "flex-end" }}
      >
        {draft && (
          <button
            disabled={busy || !activity.title.trim()}
            onClick={saveActivity}
          >
            {busy ? "Saving…" : isCloud ? "Save new version" : "Save activity"}
          </button>
        )}
        <button
          className="primary"
          disabled={!draft || busy}
          onClick={() => setSending(true)}
        >
          Send to students
        </button>
      </div>
      {source && (
        <details>
          <summary>View saved JSX source</summary>
          <pre
            style={{
              whiteSpace: "pre-wrap",
              overflowWrap: "anywhere",
              maxHeight: 300,
              overflow: "auto",
              fontSize: 12,
            }}
          >
            {source}
          </pre>
        </details>
      )}
      <div className="status" role="status">
        {feedback}
      </div>
      {sending && <SendActivityDialog onClose={() => setSending(false)} />}
    </>
  );
}
