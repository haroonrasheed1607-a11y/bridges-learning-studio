import { useEffect, useRef, useState } from "react";
import { useStudio } from "../../state/StudioContext.jsx";
export default function SendActivityDialog({ onClose }) {
  const { groups, groupSize, recipientCount, activeActivity, sendActivity, busy, isCloud } =
    useStudio();
  const [selected, setSelected] = useState([]);
  const dialog = useRef(null);
  useEffect(() => {
    const node = dialog.current;
    if (!node.open) node.showModal();
  }, []);
  const count = recipientCount(selected);
  async function send() {
    if (!selected.length || busy) return;
    if (await sendActivity(selected)) onClose();
  }
  return (
    <dialog
      ref={dialog}
      aria-labelledby="ls-send-title"
      onCancel={onClose}
      onClose={onClose}
    >
      <h2 id="ls-send-title">Send to students</h2>
      <p>{activeActivity.title}</p>
      <fieldset style={{ border: 0, padding: 0, margin: "20px 0" }}>
        <legend>
          <strong>Select student groups</strong>
        </legend>
        {groups.map((group, index) => (
          <label className="field" key={group.name}>
            <input
              type="checkbox"
              style={{ width: "auto" }}
              checked={selected.includes(index)}
              onChange={(event) =>
                setSelected((current) =>
                  event.target.checked
                    ? [...current, index]
                    : current.filter((i) => i !== index),
                )
              }
            />{" "}
            {group.name}{" "}
            <span className="small">({groupSize(index)} students)</span>
          </label>
        ))}
      </fieldset>
      <div className="review" aria-live="polite">
        {count} students in {selected.length} selected{" "}
        {selected.length === 1 ? "group" : "groups"}
      </div>
      <p className="small">
        {isCloud
          ? "The saved activity version will be assigned to the current students in these groups."
          : "Sample groups. Sending is simulated in this wireframe."}
      </p>
      <div className="actions">
        <button onClick={onClose}>Cancel</button>
        <button
          className="primary"
          disabled={!selected.length || busy}
          onClick={send}
        >
          Send activity
        </button>
      </div>
    </dialog>
  );
}
