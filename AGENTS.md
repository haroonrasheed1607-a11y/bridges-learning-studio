# Working on Bridges Learning Studio

- Keep the app modular. `src/App.jsx` selects screens; `src/components/MainLayout.jsx` composes shared panels.
- Edit Navbar, Footer and ChatPanel in their individual component files.
- Keep each feature's UI and domain logic in its folder under `src/features/`.
- Use `src/state/StudioContext.jsx` for state shared across features; avoid separate conflicting copies of activity, student or result data.
- Keep branding, responsive layout, existing demo behavior and navigation intact unless the task changes them.
- Use React rendering and component handlers. Do not reintroduce HTML string templates, `dangerouslySetInnerHTML`, or global event dispatch for feature UI.
- Run `npm test` and `npm run build` for structural or behavior changes. Check the affected flows in the browser when available.
- Keep automatic versioning in the build pipeline. Do not manually increment visible labels or change the source baseline for routine deploys.
- Commit source and lockfiles, not `dist`, `node_modules`, or `.netlify`.

- Update `release.json` release notes for each feature release, using at most three sentences. Leave `minimumVersion` unchanged for routine deploys.
