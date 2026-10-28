import Authentication from "./features/auth/Authentication.jsx";
import { useWorkspace } from "./features/auth/WorkspaceProvider.jsx";
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
  const { started, view, cloudLoading, cloudError, refresh } = useStudio();
  const workspace = useWorkspace();
  const Screen = screens[view];
  if (started && workspace.loading)
    return (
      <div id="ls-activities-pages">
        <section className="auth-screen" role="status">
          Opening your workspace…
        </section>
      </div>
    );
  if (started && (workspace.requiresSignIn || workspace.needsWorkspace))
    return (
      <div id="ls-activities-pages">
        <Authentication />
      </div>
    );
  return (
    <div id="ls-activities-pages">
      {started ? (
        <MainLayout>
          {cloudLoading ? (
            <p role="status">Loading school data…</p>
          ) : cloudError ? (
            <div role="alert">
              <p>Could not load school data: {cloudError}</p>
              <button
                onClick={() =>
                  refresh()
                    .then(() => window.location.reload())
                    .catch(() => {})
                }
              >
                Retry
              </button>
            </div>
          ) : (
            <Screen />
          )}
        </MainLayout>
      ) : (
        <SplashScreen />
      )}
    </div>
  );
}
