export const labels = {
  build: "Build a new Activity",
  previous: "Activities",
  students: "Sign Up Students",
  groups: "Student Groups",
  scores: "Scorecards",
  dashboard: "Dashboard",
};
export const introductions = {
  build:
    "Try this color-matching activity: read the word, then choose the matching color. Each question has four choices.",
  previous: "Open a saved activity to continue editing or review its results.",
  students: "Add students and assign their class.",
  groups:
    "Review your student groups and add learners to a group through student registration.",
  dashboard:
    "See an overview of your activities and student groups. These are demonstration records.",
  scores:
    "Review scores and completion status for the sample fractions assessment.",
};
export const demoActivities = [
  {
    id: "adding-fractions",
    title: "Adding unlike fractions",
    type: "Assessment",
    grade: "Grade 7",
    status: "Published",
    prompt: "1/2 + 1/3 = ?",
    answer: "3/6 + 2/6 = 5/6",
    goal: "Use equivalent fractions to add fractions with different denominators.",
  },
  {
    id: "equivalent-fractions",
    title: "Equivalent fractions",
    type: "Teaching",
    grade: "Grade 7",
    status: "Saved",
    prompt: "Why does 1/2 equal 3/6?",
    answer: "Both fractions describe the same amount of a whole.",
    goal: "Explain equivalent fractions using equal-sized parts.",
  },
  {
    id: "comparing-fractions",
    title: "Comparing fractions",
    type: "Assessment",
    grade: "Grade 6",
    status: "Draft",
    prompt: "Which is larger: 2/3 or 3/4? Explain.",
    answer: "2/3 = 8/12 and 3/4 = 9/12, so 3/4 is larger.",
    goal: "Compare fractions by expressing them with a common denominator.",
  },
  {
    id: "everyday-fractions",
    title: "Fractions in everyday situations",
    type: "Assessment",
    grade: "Grade 7",
    status: "Draft",
    prompt:
      "A recipe needs 1/4 cup and then 1/2 cup of milk. How much is that altogether?",
    answer: "1/4 + 2/4 = 3/4 cup.",
    goal: "Apply fraction addition to a real-world situation.",
  },
  {
    id: "color-recognition",
    title: "Color recognition",
    type: "Assessment",
    grade: "All learners",
    status: "Draft",
    prompt: "Read a color name and select the matching color.",
    answer: "Match the written color name to the correct swatch.",
    goal: "Match five written color names to colors using four choices per question.",
  },
];
export const demoGroups = [
  { name: "Grade 7 · Section A", count: 28 },
  { name: "Grade 7 · Section B", count: 26 },
  { name: "Grade 7 · Section C", count: 24 },
];
export const demoRoster = [
  { id: "sample-01", name: "Student 01", score: 5, status: "Completed" },
  { id: "sample-02", name: "Student 02", score: 4, status: "Completed" },
  { id: "sample-03", name: "Student 03", score: 4, status: "Completed" },
  { id: "sample-04", name: "Student 04", score: 3, status: "Needs follow-up" },
  { id: "sample-05", name: "Student 05", score: null, status: "In progress" },
  { id: "sample-06", name: "Student 06", score: null, status: "Not started" },
];
export const colorPalette = {
  Red: "#e53935",
  Blue: "#1565e8",
  Green: "#169447",
  Yellow: "#ffda20",
  Purple: "#8e36b5",
  Orange: "#f58a17",
};
export const colorQuestions = [
  { word: "Red", options: ["Blue", "Red", "Yellow", "Green"] },
  { word: "Green", options: ["Green", "Purple", "Orange", "Blue"] },
  { word: "Blue", options: ["Yellow", "Orange", "Green", "Blue"] },
  { word: "Yellow", options: ["Purple", "Blue", "Yellow", "Red"] },
  { word: "Purple", options: ["Red", "Green", "Blue", "Purple"] },
];
