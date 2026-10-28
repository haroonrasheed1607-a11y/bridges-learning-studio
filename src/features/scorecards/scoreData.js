import { demoRoster } from "../../data/demoData.js";
export function scoreRoster(students, color) {
  return [
    ...demoRoster,
    ...students.map((student) => ({
      id: "enrolled:" + student.id,
      name: student.name,
      score: null,
      status: "Not started",
    })),
    ...(color.complete
      ? [
          {
            id: "demo-learner",
            name: "Demo learner",
            score: color.responses.filter((r) => r.correct).length,
            status: "Completed",
          },
        ]
      : []),
  ];
}
export function resultFor(student, activityId) {
  const assigned =
    (activityId === "adding-fractions" && student.id !== "demo-learner") ||
    (activityId === "color-recognition" && student.id === "demo-learner");
  return {
    score: assigned ? student.score : null,
    status: assigned ? student.status : "Not assigned",
  };
}
export function activityResults(roster, activityId) {
  return roster.filter(
    (student) => resultFor(student, activityId).status !== "Not assigned",
  );
}
