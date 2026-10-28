import { useStudio } from "./state/StudioContext.jsx";
import MainLayout from "./components/MainLayout.jsx";
import SplashScreen from "./components/SplashScreen.jsx";
import ActivityLibrary from "./features/activities/ActivityLibrary.jsx";
import ActivityBuilder from "./features/activities/ActivityBuilder.jsx";
import StudentRegistration from "./features/students/StudentRegistration.jsx";
import StudentGroups from "./features/students/StudentGroups.jsx";
import Scorecards from "./features/scorecards/Scorecards.jsx";
import Dashboard from "./features/dashboard/Dashboard.jsx";
const screens = {
  previous: ActivityLibrary,
  build: ActivityBuilder,
  students: StudentRegistration,
  groups: StudentGroups,
  scores: Scorecards,
  dashboard: Dashboard,
};
export default function App() {
  const { started, view } = useStudio();
  const Screen = screens[view];
  return (
    <div id="ls-activities-pages">
      {started ? (
        <MainLayout>
          <Screen />
        </MainLayout>
      ) : (
        <SplashScreen />
      )}
    </div>
  );
}
