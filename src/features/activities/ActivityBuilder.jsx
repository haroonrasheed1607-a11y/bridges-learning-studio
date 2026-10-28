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
  } = useStudio();
  const [sending, setSending] = useState(false);
  return (
    <>
      {draft && activity.id === "color-recognition" ? (
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
        {draft && <button onClick={saveActivity}>Save activity</button>}
        <button
          className="primary"
          disabled={!draft}
          onClick={() => setSending(true)}
        >
          Send to students
        </button>
      </div>
      <div className="status" role="status">
        {feedback}
      </div>
      {sending && <SendActivityDialog onClose={() => setSending(false)} />}
    </>
  );
}
