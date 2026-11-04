export const sampleActivityPrompt = `Create an interactive activity for Bridges Learning Studio. You have no prior project context: use all instructions below.

CONTEXT
A teacher will download your single HTML file, upload it into Learning Studio, preview it, and later assign it to students. Learning Studio handles identity and storage. Build only the activity. Current upload supports local preview; assignment integration is still being connected.

ACTIVITY BRIEF — replace these values
Title: Color recognition
Audience: Beginning learners
Language: English
Mode: assessment
Objective: Identify a written color name and select the matching color.
Concepts: Recognizing red, blue, green, and yellow.
Tasks: Four questions, each showing one color name and four color swatches.
Adapt the brief to the teacher's requested topic. Ask only if essential information is missing.

DELIVERABLE AND DESIGN
Provide one downloadable .html file containing all HTML, CSS, JavaScript, JSON, and assets. No external scripts, fonts, APIs, tracking, requests, or installation. Use inline SVG or CSS diagrams and embedded media if needed.
Use a white background, navy #0B2467 accents, dark readable text, large touch controls, keyboard support, visible focus, and a responsive layout that works at 360px width.
Include an introduction and Begin button; one question at a time; Question X of Y; Previous/Next controls preserving responses; and a completion screen. Assessment answers must not be revealed before submission. Require every response before Submit answers. Teaching mode is ungraded and can provide immediate explanations.
Do not build login, teacher tools, student selection, or database access. Do not access parent DOM, cookies, storage, popups, or permissions.

EMBEDDED DATA — required for upload
Include exactly one script element with type="application/json" and id="bridges-activity". Its text must be valid JSON, no comments or trailing commas. Render questions from this data so they stay consistent.
Example:
{
 "schemaVersion":"1.0",
 "activityId":"color-recognition",
 "title":"Color recognition",
 "language":"en",
 "mode":"assessment",
 "learningObjective":"Match written color names to colors.",
 "instructions":"Read the name and choose the matching color.",
 "questions":[{
  "id":"q1","type":"single-choice","concept":"Recognizing red",
  "prompt":"RED",
  "options":[{"id":"red","label":"Red"},{"id":"blue","label":"Blue"}],
  "correctAnswer":"red","points":1,
  "feedback":{"correct":"You matched red.","incorrect":"Review the color red."}
 }]
}
Expand the example to satisfy the brief. Keep stable unique question/option IDs. Use positive numeric points. For color swatches, do not display answer labels, but provide accessible control names.
Supported types:
- single-choice: correctAnswer and response are one option ID.
- multiple-choice: correctAnswer and response are arrays of option IDs; exact set match earns credit.
- short-text: correctAnswer is a nonempty array of accepted strings; response is a string; trim and compare without letter case.
Do not invent additional graded types. Teaching mode uses mode="teaching" and questions:[], with explanatory content in the HTML.
The embedded answer key is inspectable, so this format is for learning activities, not secure exams.

PREVIEW AND FUTURE INTEGRATION
When opened directly, or embedded without initialization, allow a clearly labelled local preview and state: Preview only — results are not saved to Learning Studio.
Do not require a parent message to begin local preview.
Install a message listener and, when embedded, send parent.postMessage({type:"bridges.activity.ready",protocolVersion:"1.0",activityId},"*").
Accept bridges.activity.init only from window.parent, with matching protocolVersion/activityId, a nonempty sessionId, and mode test or student. Remember the validated parent origin.
For initialized assessments send {type:"bridges.activity.submit",protocolVersion:"1.0",activityId,sessionId,submissionId,answers} to that origin, where answers maps question IDs to responses. Teaching completion uses type bridges.activity.complete without answers. Generate a unique submissionId; never include student identity, score, or answer key.
Show Saving only for initialized submissions. Accept bridges.activity.saved or bridges.activity.error only from the validated parent source/origin with matching activityId, sessionId, and submissionId. On saved, show saved confirmation, or Test complete — no student result recorded in test mode. On error or 15-second timeout retain answers and offer Retry using exactly the same submissionId and payload. Never claim a save without acknowledgement.

QUALITY CHECK
Validate JSON, IDs, answer references, required responses, navigation, local preview, keyboard usability, mobile layout, and absence of external dependencies. State which checks you actually performed. Deliver the complete HTML file and a brief explanation of the objective and limitations.`;
