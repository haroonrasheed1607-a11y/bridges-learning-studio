import VersionButton from "./VersionButton.jsx";
import { useStudio } from "../state/StudioContext.jsx";
export default function SplashScreen() {
  const { setStarted } = useStudio();
  return (
    <section className="splash" aria-label="Welcome">
      <div className="splash-center">
        <div className="splash-logo">
          <img src="/assets/bridges-logo.webp" alt="Bridges" />
        </div>
        <button type="button" id="ls-begin" onClick={() => setStarted(true)}>
          Begin
        </button>
      </div>
      <span className="splash-version">
        <VersionButton />
      </span>
    </section>
  );
}
