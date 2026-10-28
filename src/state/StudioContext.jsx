import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { demoActivities, demoGroups, labels } from "../data/demoData.js";
import { useWorkspace } from "../features/auth/WorkspaceProvider.jsx";
import { supabase } from "../lib/supabaseClient.js";
import { createWorkspaceRepository } from "../services/workspaceRepository.js";
import {
  activityDefinition,
  generateActivitySource,
} from "../features/activities/activityPackage.js";
const StudioContext = createContext(null);
const emptyColor = () => ({ round: 0, responses: [], complete: false });
export function StudioProvider({ children }) {
  const workspace = useWorkspace(),
    isCloud = workspace.isCloud;
  const repository = useMemo(
    () => (isCloud ? createWorkspaceRepository(supabase) : null),
    [isCloud, workspace.profile?.id],
  );
  const [started, setStarted] = useState(false),
    [view, setView] = useState("previous");
  const [activities, setActivities] = useState(() =>
      demoActivities.map((a) => ({ ...a })),
    ),
    [groups, setGroups] = useState(demoGroups),
    [students, setStudents] = useState([]);
  const [versions, setVersions] = useState([]),
    [attempts, setAttempts] = useState([]);
  const [messages, setMessages] = useState(() =>
    Object.fromEntries(Object.keys(labels).map((key) => [key, []])),
  );
  const [activeActivity, setActiveActivity] = useState(demoActivities[4]),
    [mode, setMode] = useState("assessment"),
    [draft, setDraft] = useState(false),
    [saved, setSaved] = useState(false);
  const [source, setSource] = useState(""),
    [busy, setBusy] = useState(false),
    [cloudLoading, setCloudLoading] = useState(false),
    [cloudError, setCloudError] = useState("");
  const [feedback, setFeedback] = useState(""),
    [activityPage, setActivityPage] = useState(0);
  const [scoreView, setScoreView] = useState("activity"),
    [scoreActivityId, setScoreActivityId] = useState("adding-fractions"),
    [scoreStudentId, setScoreStudentId] = useState("sample-01");
  const [color, setColor] = useState(emptyColor),
    [resultStudentId, setResultStudentId] = useState("");
  function applySnapshot(snapshot) {
    setGroups(snapshot.groups);
    setStudents(snapshot.students);
    setActivities(snapshot.activities);
    setVersions(snapshot.versions);
    setAttempts(snapshot.attempts);
  }
  async function refresh() {
    if (!repository) return;
    const data = await repository.load();
    applySnapshot(data);
    return data;
  }
  useEffect(() => {
    let cancelled = false;
    setFeedback("");
    setSource("");
    setColor(emptyColor());
    setResultStudentId("");
    setView("previous");
    setActivityPage(0);
    setCloudError("");
    if (!repository) {
      setActivities(demoActivities.map((a) => ({ ...a })));
      setGroups(demoGroups);
      setStudents([]);
      setVersions([]);
      setAttempts([]);
      setActiveActivity(demoActivities[4]);
      setCloudLoading(false);
      return;
    }
    setActivities([]);
    setGroups([]);
    setStudents([]);
    setVersions([]);
    setAttempts([]);
    setCloudLoading(true);
    repository
      .load()
      .then((data) => {
        if (!cancelled) applySnapshot(data);
      })
      .catch((error) => {
        if (!cancelled) setCloudError(error.message);
      })
      .finally(() => {
        if (!cancelled) setCloudLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [repository]);
  function navigate(next) {
    setFeedback("");
    setView(next);
  }
  function createActivity() {
    setActiveActivity({
      ...demoActivities[4],
      id: crypto.randomUUID(),
      kind: "color",
      title: "New activity",
    });
    setSource("");
    setMode("assessment");
    setDraft(false);
    setSaved(false);
    setColor(emptyColor());
    setMessages((current) => ({ ...current, build: [] }));
    navigate("build");
  }
  async function openActivity(activity) {
    setActiveActivity(activity);
    setMode(activity.type === "Teaching" ? "teaching" : "assessment");
    setDraft(true);
    setSaved(activity.status !== "Draft");
    setColor(emptyColor());
    setSource("");
    navigate("build");
    if (repository && activity.versionId) {
      setBusy(true);
      try {
        const version = versions.find((v) => v.id === activity.versionId);
        const loaded = await repository.loadVersion(version);
        setSource(loaded.source);
        setMessages((current) => ({ ...current, build: loaded.prompts }));
      } catch (error) {
        setFeedback("Could not load activity source: " + error.message);
      } finally {
        setBusy(false);
      }
    }
  }
  function editActivity(changes) {
    setActiveActivity((current) => ({ ...current, ...changes }));
    setSaved(false);
    setSource("");
  }
  function updateStatus(status) {
    setActivities((current) =>
      current.map((a) => (a.id === activeActivity.id ? { ...a, status } : a)),
    );
    setSaved(true);
  }
  async function saveActivity() {
    if (busy) return null;
    setBusy(true);
    setFeedback("");
    try {
      const definition = activityDefinition(activeActivity, mode);
      const jsx = generateActivitySource(definition);
      if (repository) {
        const version = await repository.saveActivity(
          activeActivity,
          definition,
          messages.build,
          jsx,
        );
        const updated = {
          ...activeActivity,
          ...definition,
          type: mode === "teaching" ? "Teaching" : "Assessment",
          status: "Saved",
          versionId: version.version_id,
          versionNumber: version.version_number,
          sourcePath: version.source_path,
        };
        setActiveActivity(updated);
        await refresh();
        setFeedback("Saved as version " + version.version_number + ".");
        setSaved(true);
        setSource(jsx);
        return updated;
      }
      const updated = {
        ...activeActivity,
        ...definition,
        type: mode === "teaching" ? "Teaching" : "Assessment",
        status: "Saved",
      };
      setActivities((current) =>
        current.some((a) => a.id === updated.id)
          ? current.map((a) => (a.id === updated.id ? updated : a))
          : [...current, updated],
      );
      setActiveActivity(updated);
      setSaved(true);
      setSource(jsx);
      setFeedback(
        "Saved in this demo session. Sign in to save across devices.",
      );
      return updated;
    } catch (error) {
      setFeedback("Save failed: " + error.message);
      return null;
    } finally {
      setBusy(false);
    }
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
      " workspace on the right. AI generation is not connected yet.";
    if (view === "build") {
      setDraft(true);
      setSaved(false);
      setSource("");
      if (/colou?r/i.test(text))
        setActiveActivity((current) => ({ ...current, kind: "color" }));
      answer =
        "The sample activity is ready to review. You can edit its title and learning objective before saving.";
    }
    setMessages((current) => ({
      ...current,
      [view]: [...current[view], ["You", text], ["Assistant", answer]],
    }));
  }
  async function addStudents(rows) {
    const existing = new Set(students.map((s) => s.id.toLowerCase()));
    if (rows.some((s) => existing.has(s.id.toLowerCase()))) return false;
    if (repository) {
      setBusy(true);
      try {
        await repository.addStudents(rows, groups);
        await refresh();
        return true;
      } catch (error) {
        setFeedback("Student registration failed: " + error.message);
        return false;
      } finally {
        setBusy(false);
      }
    }
    setStudents((current) => [
      ...current,
      ...rows.map(({ id, name, group }) => ({ id, name, group })),
    ]);
    return true;
  }
  async function addGroup(name) {
    setBusy(true);
    try {
      if (repository) {
        await repository.addGroup(name);
        await refresh();
      } else
        setGroups((current) => [
          ...current,
          { id: crypto.randomUUID(), name, count: 0 },
        ]);
      return true;
    } catch (error) {
      setFeedback("Group could not be created: " + error.message);
      return false;
    } finally {
      setBusy(false);
    }
  }
  const groupSize = (index) =>
    groups[index].count +
    students.filter((s) =>
      s.groupIds ? s.groupIds.includes(groups[index].id) : s.group === index,
    ).length;
  const recipientCount = (selected) =>
    isCloud
      ? students.filter((student) =>
          student.groupIds?.some((id) =>
            selected.some((index) => groups[index].id === id),
          ),
        ).length
      : selected.reduce((sum, index) => sum + groupSize(index), 0);
  async function sendActivity(selected) {
    let activity = activeActivity;
    if (repository && (!saved || !activity.versionId)) {
      activity = await saveActivity();
      if (!activity) return false;
    }
    setBusy(true);
    try {
      if (repository) {
        const result = await repository.assignActivity(
          activity.versionId,
          selected.map((index) => groups[index].id),
        );
        setFeedback(
          "Assigned version " +
            activity.versionNumber +
            " to " +
            result.student_count +
            " students.",
        );
      } else
        setFeedback(
          "Sample send confirmed for " +
            selected.reduce((sum, index) => sum + groupSize(index), 0) +
            " students. No notifications were sent.",
        );
      updateStatus("Sent");
      return true;
    } catch (error) {
      setFeedback("Assignment failed: " + error.message);
      return false;
    } finally {
      setBusy(false);
    }
  }
  async function recordColorResult() {
    if (
      !repository ||
      !resultStudentId ||
      !color.complete ||
      !activeActivity.versionId ||
      !saved
    )
      return false;
    setBusy(true);
    try {
      const attemptId = color.attemptId || crypto.randomUUID();
      setColor((current) => ({ ...current, attemptId }));
      await repository.recordAttempt({
        attemptId,
        studentId: resultStudentId,
        versionId: activeActivity.versionId,
        answers: Object.fromEntries(
          color.responses.map((r, i) => ["color-" + (i + 1), r.choice]),
        ),
      });
      await refresh();
      setFeedback(
        "Student result saved for version " +
          activeActivity.versionNumber +
          ".",
      );
      return true;
    } catch (error) {
      setFeedback("Result could not be saved: " + error.message);
      return false;
    } finally {
      setBusy(false);
    }
  }
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
        recipientCount,
        addGroup,
        messages,
        sendPrompt,
        activeActivity,
        editActivity,
        mode,
        setMode: (next) => {
          setMode(next);
          setSaved(false);
        },
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
        source,
        busy,
        isCloud,
        versions,
        attempts,
        cloudLoading,
        cloudError,
        refresh,
        sendActivity,
        resultStudentId,
        setResultStudentId,
        recordColorResult,
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
