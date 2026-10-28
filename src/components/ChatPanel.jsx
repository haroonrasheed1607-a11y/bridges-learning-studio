import { useEffect, useRef, useState } from "react";
import { useStudio } from "../state/StudioContext.jsx";
import { introductions } from "../data/demoData.js";
export default function ChatPanel() {
  const { view, mode, setMode, messages, sendPrompt } = useStudio();
  const [prompt, setPrompt] = useState("");
  const input = useRef(null);
  useEffect(() => {
    if (window.matchMedia("(min-width: 768px)").matches)
      input.current?.focus({ preventScroll: true });
  }, []);
  return (
    <aside className="chat" aria-label="Chat panel">
      <div className="messages" aria-live="polite">
        <div className="message">
          <strong>Assistant</strong>
          <p>{introductions[view]}</p>
        </div>
        {messages[view].map(([role, text], index) => (
          <div
            key={index}
            className={"message" + (role === "You" ? " user" : "")}
          >
            <strong>{role}</strong>
            <p>{text}</p>
          </div>
        ))}
      </div>
      <form
        className="composer"
        onSubmit={(event) => {
          event.preventDefault();
          sendPrompt(prompt);
          setPrompt("");
        }}
      >
        {view === "build" && (
          <label className="small">
            Activity mode
            <select
              value={mode}
              onChange={(event) => setMode(event.target.value)}
            >
              <option value="assessment">Assessment</option>
              <option value="teaching">Teaching</option>
            </select>
          </label>
        )}
        <label className="small" htmlFor="ls-prompt">
          Message
        </label>
        <textarea
          id="ls-prompt"
          ref={input}
          placeholder="Describe what students should learn…"
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
        />
        <button className="primary" type="submit">
          Send message
        </button>
        <span className="small">
          Sample interactions. No AI service connected.
        </span>
      </form>
    </aside>
  );
}
