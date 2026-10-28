import "../styles/navbar.css";
import { useEffect, useRef } from "react";
import { useStudio } from "../state/StudioContext.jsx";
function NavDropdown({ label, active, items }) {
  const ref = useRef(null);
  useEffect(() => {
    const close = (event) => {
      if (!ref.current?.contains(event.target))
        ref.current?.removeAttribute("open");
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);
  function onKeyDown(event) {
    const toggle = ref.current.querySelector("summary");
    if (event.key === "Escape") {
      ref.current.open = false;
      toggle.focus();
      event.preventDefault();
    }
    if (event.key === "ArrowDown" && event.target === toggle) {
      ref.current.open = true;
      ref.current.querySelector("button").focus();
      event.preventDefault();
    }
  }
  return (
    <details className="nav-dropdown" ref={ref} onKeyDown={onKeyDown}>
      <summary className={"nav-link" + (active ? " nav-active" : "")}>
        {label}
        <span className="nav-chevron" aria-hidden="true" />
      </summary>
      <div className="nav-dropdown-panel" aria-label={label + " options"}>
        {items.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => {
              ref.current.open = false;
              item.action();
            }}
          >
            {item.label}
          </button>
        ))}
      </div>
    </details>
  );
}
export default function Navbar() {
  const { view, navigate, createActivity } = useStudio();
  return (
    <header className="top">
      <div className="workspace-brand">
        <h1>Learning Studio</h1>
      </div>
      <nav className="main-navigation" aria-label="Main navigation">
        <NavDropdown
          label="Activities"
          active={["previous", "build"].includes(view)}
          items={[
            { label: "Create", action: createActivity },
            {
              label: "Previous Activities",
              action: () => navigate("previous"),
            },
          ]}
        />
        <NavDropdown
          label="Students"
          active={["students", "groups", "scores"].includes(view)}
          items={[
            { label: "Add", action: () => navigate("students") },
            { label: "Group", action: () => navigate("groups") },
            { label: "Scorecards", action: () => navigate("scores") },
          ]}
        />
        <button
          type="button"
          aria-pressed={view === "dashboard"}
          onClick={() => navigate("dashboard")}
        >
          Dashboard
        </button>
      </nav>
      <div className="brand-logo">
        <img
          src="/assets/bridges-logo.webp"
          alt="Bridges"
          width="130"
          height="39"
        />
      </div>
    </header>
  );
}
