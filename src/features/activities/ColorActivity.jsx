import { useStudio } from "../../state/StudioContext.jsx";
import { colorQuestions, colorPalette } from "../../data/demoData.js";
export default function ColorActivity() {
  const {
    color,
    setColor,
    showActivityScores,
    isCloud,
    students,
    resultStudentId,
    setResultStudentId,
    recordColorResult,
    saved,
    busy,
    activeActivity,
  } = useStudio();
  const question = colorQuestions[color.round];
  const response = color.responses[color.round];
  const points = color.responses.filter((r) => r.correct).length;
  function choose(choice) {
    if (response) return;
    setColor((current) => ({
      ...current,
      responses: [
        ...current.responses,
        { word: question.word, choice, correct: choice === question.word },
      ],
    }));
  }
  return (
    <>
      <div className="eyebrow">Assessment / Playable demo</div>
      <h2>Match the color</h2>
      {isCloud && (
        <label className="field">
          Student taking this activity
          <select
            value={resultStudentId}
            disabled={color.responses.length > 0}
            onChange={(event) => setResultStudentId(event.target.value)}
          >
            <option value="">
              Preview only — do not record a student result
            </option>
            {students.map((student) => (
              <option key={student.dbId} value={student.dbId}>
                {student.name} ({student.id})
              </option>
            ))}
          </select>
        </label>
      )}
      {color.complete ? (
        <>
          <div className="color-result">
            <p>Activity complete</p>
            <h3>
              You matched {points} of {colorQuestions.length} color names
            </h3>
            <p className="equation">
              {points} / {colorQuestions.length}
            </p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Word</th>
                <th>Your choice</th>
                <th>Result</th>
              </tr>
            </thead>
            <tbody>
              {color.responses.map((r) => (
                <tr key={r.word}>
                  <td>{r.word}</td>
                  <td>{r.choice}</td>
                  <td>{r.correct ? "Correct" : "Incorrect"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {isCloud && resultStudentId && (
            <>
              <p className="small">
                {saved
                  ? "Record this teacher-led assessment against the saved activity version."
                  : "Save this activity version before recording the result."}
              </p>
              <button disabled={!saved || busy} onClick={recordColorResult}>
                Save student result
              </button>
            </>
          )}
          <div className="actions">
            <button
              className="primary"
              onClick={() =>
                setColor({ round: 0, responses: [], complete: false })
              }
            >
              Try again
            </button>
            <button onClick={() => showActivityScores(activeActivity.id)}>
              View scorecard
            </button>
          </div>
        </>
      ) : (
        <>
          <p>Read the color name, then select the matching color below.</p>
          <p className="small">
            Question {color.round + 1} of {colorQuestions.length}
          </p>
          <div
            className="color-word"
            aria-label={"Color name: " + question.word}
          >
            {question.word.toUpperCase()}
          </div>
          <div
            className="color-options"
            role="group"
            aria-label="Choose the matching color"
          >
            {question.options.map((name, index) => (
              <button
                type="button"
                key={name}
                className="color-choice"
                style={{ "--choice-color": colorPalette[name] }}
                aria-label={"Color option " + (index + 1) + ": " + name}
                aria-pressed={response?.choice === name}
                disabled={!!response}
                onClick={() => choose(name)}
              >
                <span className="color-choice-marker" aria-hidden="true">
                  {response?.choice === name ? "✓" : ""}
                </span>
              </button>
            ))}
          </div>
          <div className="color-feedback" role="status">
            {response
              ? response.correct
                ? "Correct. You selected " + response.choice + "."
                : "You selected " +
                  response.choice +
                  ". The word was " +
                  question.word.toUpperCase() +
                  "."
              : "Choose one of the four colors."}
          </div>
          {response && (
            <div className="actions" style={{ justifyContent: "flex-end" }}>
              <button
                className="primary"
                onClick={() =>
                  setColor((current) =>
                    current.round === colorQuestions.length - 1
                      ? { ...current, complete: true }
                      : { ...current, round: current.round + 1 },
                  )
                }
              >
                {color.round === colorQuestions.length - 1
                  ? "Finish activity"
                  : "Next question"}
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}
