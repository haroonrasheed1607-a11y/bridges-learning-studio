import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

test("every extracted screen renders with the shared provider", async () => {
  const server = await createServer({
    server: { middlewareMode: true },
    appType: "custom",
  });
  try {
    const { StudioProvider } = await server.ssrLoadModule(
      "/src/state/StudioContext.jsx",
    );
    const screens = [
      ["/src/App.jsx", "Begin"],
      ["/src/components/Navbar.jsx", "Students options"],
      ["/src/components/Footer.jsx", "Version "],
      ["/src/components/ReleaseNotesDialog.jsx", "What’s new in Version "],
      ["/src/features/activities/ActivityLibrary.jsx", "Play demo"],
      ["/src/features/activities/ActivityBuilder.jsx", "Send to students"],
      ["/src/features/activities/SendActivityDialog.jsx", "Select student groups"],
      ["/src/features/activities/VersionHistory.jsx", ""],
      ["/src/features/auth/Authentication.jsx", "Teacher sign in"],
      ["/src/features/scorecards/CloudScorecards.jsx", "No recorded attempts yet"],
      ["/src/features/activities/ColorActivity.jsx", "Color name: Red"],
      [
        "/src/features/students/StudentRegistration.jsx",
        "Download sample Excel",
      ],
      ["/src/features/students/StudentGroups.jsx", "Section A"],
      ["/src/features/scorecards/Scorecards.jsx", "Activity Wise Score Card"],
      ["/src/features/dashboard/Dashboard.jsx", "78"],
    ];
    for (const [path, expected] of screens) {
      const { default: Component } = await server.ssrLoadModule(path);
      const markup = renderToStaticMarkup(
        createElement(StudioProvider, null, createElement(Component)),
      );
      assert.ok(markup.includes(expected), path + " should render " + expected);
    }
  } finally {
    await server.close();
  }
});
