import { useState } from "react";
import { colorPalette } from "../../data/demoData.js";
import { submitStudentAnswers } from "./studentRepository.js";
export default function StudentActivity({ activity, token, onBack, onSaved }) {
  const definition = activity.definition;
  const [step, setStep] = useState(0), [answers, setAnswers] = useState({});
  const [attemptId] = useState(() => crypto.randomUUID());
  const [busy, setBusy] = useState(false), [error, setError] = useState(""), [result, setResult] = useState(null);
  const questions = definition.questions || [], question = questions[step];
  async function next() {
    if (step < questions.length - 1) { setStep(step + 1); return; }
    setBusy(true); setError("");
    try {
      const saved = await submitStudentAnswers(token, activity.id, attemptId, answers);
      setResult(saved); onSaved();
    } catch (cause) { setError(cause.message); }
    finally { setBusy(false); }
  }
  return <article className="student-activity">
    <button onClick={onBack} disabled={busy}>← My activities</button>
    <h2>{definition.title}</h2>
    {result ? <div role="status" className="student-result">
      <h3>Activity complete</h3><p className="equation">{result.score} / {result.possiblePoints}</p>
      <p>Your result has been saved.</p>
    </div> : definition.mode === "teaching" ? <>
      <p>{definition.goal}</p><p className="student-content">{definition.answer || definition.prompt}</p>
    </> : !question ? <p>This activity has no questions yet. Please ask your teacher.</p> : <>
      <p className="small">Question {step + 1} of {questions.length}</p>
      <p className={definition.kind === "color" ? "color-word" : "student-prompt"}>{question.prompt}</p>
      {question.options?.length ? <div className={definition.kind === "color" ? "color-options" : "student-options"} role="group" aria-label="Choose your answer">
        {question.options.map((option, index) => <button key={option}
          className={definition.kind === "color" ? "color-choice" : ""}
          style={definition.kind === "color" ? { "--choice-color": colorPalette[option] || option } : undefined}
          aria-label={definition.kind === "color" ? "Color option " + (index + 1) + ": " + option : option}
          aria-pressed={answers[question.id] === option} disabled={busy}
          onClick={() => setAnswers({ ...answers, [question.id]: option })}>
          {definition.kind === "color" ? <span className="color-choice-marker" aria-hidden="true">{answers[question.id] === option ? "✓" : ""}</span> : option}
        </button>)}
      </div> : <label className="field">Your answer
        <textarea value={answers[question.id] || ""} disabled={busy}
          onChange={event => setAnswers({ ...answers, [question.id]: event.target.value })} />
      </label>}
      <div className="actions">
        {step > 0 && <button disabled={busy} onClick={() => setStep(step - 1)}>Previous question</button>}
        <button className="primary" onClick={next} disabled={busy || !String(answers[question.id] || "").trim()}>
          {busy ? "Saving…" : step === questions.length - 1 ? "Finish and save result" : "Next question"}
        </button>
      </div>
    </>}
    {error && <p role="alert">{error} Your answers are still here; try saving again.</p>}
  </article>;
}
