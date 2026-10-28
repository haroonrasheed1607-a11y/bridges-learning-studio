import VersionButton from "./VersionButton.jsx";
export default function Footer() {
  return (
    <footer className="app-footer" aria-label="Application version">
      <span>Bridges Learning Studio</span>
      <VersionButton />
    </footer>
  );
}
