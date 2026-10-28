import { createContext, useContext, useState } from "react";
import { demoActivities, demoGroups, labels } from "../data/demoData.js";
const StudioContext = createContext(null);
export function StudioProvider({ children }) {
  const [started, setStarted] = useState(false);
  const [view, setView] = useState("previous");
  const [activities, setActivities] = useState(() =>
    demoActivities.map((a) => ({ ...a })),
  );
  const [students, setStudents] = useState([]);
  const [messages, setMessages] = useState(() =>
    Object.fromEntries(Object.keys(labels).map((key) => [key, []])),
  );
  const [activeId, setActiveId] = useState("color-recognition");
  const [mode, setMode] = useState("assessment");
  const [draft, setDraft] = useState(false);
  const [saved, setSaved] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [activityPage, setActivityPage] = useState(0);
  const [scoreView, setScoreView] = useState("activity");
  const [scoreActivityId, setScoreActivityId] = useState("adding-fractions");
  const [scoreStudentId, setScoreStudentId] = useState("sample-01");
  const [color, setColor] = useState({
    round: 0,
    responses: [],
    complete: false,
  });
  const groups = demoGroups;
  const activeActivity = activities.find((a) => a.id === activeId);
  function navigate(next) {
    setFeedback("");
    setView(next);
  }
  function createActivity() {
    setActiveId("color-recognition");
    setMode("assessment");
    setDraft(false);
    setSaved(false);
    navigate("build");
  }
  function openActivity(activity) {
    setActiveId(activity.id);
    setMode(activity.type === "Teaching" ? "teaching" : "assessment");
    setDraft(true);
    setSaved(activity.status !== "Draft");
    navigate("build");
  }
  function updateStatus(status) {
    setActivities((current) =>
      current.map((a) => (a.id === activeId ? { ...a, status } : a)),
    );
    setSaved(true);
  }
  function saveActivity() {
    updateStatus("Saved");
    setFeedback("Activity saved in this preview. Find it under Activities.");
  }
  function showActivityScores(id) {
    setScoreActivityId(id);
    setScoreView("activity");
    navigate("scores");
  }
  function sendPrompt(prompt) {
    const text = prompt.trim();
    if (!text) return;
    let answer =
      "Use the " +
      labels[view] +
      " workspace on the right. This is a wireframe interaction.";
    if (view === "build") {
      const id = /colou?r/i.test(text) ? "color-recognition" : activeId;
      setActiveId(id);
      setDraft(true);
      setSaved(false);
      answer =
        id === "color-recognition"
          ? "The color-matching activity is ready. Select a color on the right to try it."
          : "The sample activity is ready to review on the right.";
    }
    setMessages((current) => ({
      ...current,
      [view]: [...current[view], ["You", text], ["Assistant", answer]],
    }));
  }
  function addStudents(rows) {
    const existing = new Set(students.map((s) => s.id.toLowerCase()));
    if (rows.some((s) => existing.has(s.id.toLowerCase()))) return false;
    setStudents((current) => [
      ...current,
      ...rows.map(({ id, name, group }) => ({ id, name, group })),
    ]);
    return true;
  }
  const groupSize = (index) =>
    groups[index].count + students.filter((s) => s.group === index).length;
  return (
    <StudioContext.Provider
      value={{
        started,
        setStarted,
        view,
        navigate,
        activities,
        students,
        addStudents,
        groups,
        groupSize,
        messages,
        sendPrompt,
        activeActivity,
        mode,
        setMode,
        draft,
        setDraft,
        saved,
        feedback,
        setFeedback,
        createActivity,
        openActivity,
        saveActivity,
        updateStatus,
        activityPage,
        setActivityPage,
        scoreView,
        setScoreView,
        scoreActivityId,
        setScoreActivityId,
        scoreStudentId,
        setScoreStudentId,
        showActivityScores,
        color,
        setColor,
      }}
    >
      {children}
    </StudioContext.Provider>
  );
}
export function useStudio() {
  const value = useContext(StudioContext);
  if (!value) throw new Error("Studio components require StudioProvider.");
  return value;
}
