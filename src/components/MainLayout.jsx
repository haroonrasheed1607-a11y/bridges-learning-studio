import WorkspaceStatus from "./WorkspaceStatus.jsx";
import Navbar from "./Navbar.jsx";
import Footer from "./Footer.jsx";
import ChatPanel from "./ChatPanel.jsx";
export default function MainLayout({ children }) {
  return (
    <div id="ls-application">
      <Navbar />
      <WorkspaceStatus />
      <div className="shell">
        <ChatPanel />
        <section className="builder" aria-label="Activity workspace">
          <div className="work">
            <div className="canvas" aria-live="polite">
              {children}
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
}
