# Bridges Learning Studio

A React + Vite education demo, deployed from this repository to Netlify.

## Development

Use Node.js 22.12+ and npm:

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. `index.html` is the app entry point; run the development server instead of opening it directly as a file.

```sh
npm test
npm run build
npm run preview
```

`npm run build` prepares the next version and creates the production files in `dist`. Do not commit `dist`, `node_modules`, or `.netlify`.

## Where to work

| Location | Responsibility |
| --- | --- |
| `src/App.jsx` | Selects the current feature screen. |
| `src/components/Navbar.jsx` | Activities and Students dropdowns, Dashboard navigation. |
| `src/components/Footer.jsx` | Shared footer and deployment version. |
| `src/components/ChatPanel.jsx` | Chat messages, prompt input, activity mode. |
| `src/components/MainLayout.jsx` | Composes navigation, chat, main panel, and footer. |
| `src/components/SplashScreen.jsx` | Logo and Begin screen. |
| `src/features/activities/` | Activity library, builder, color demo, versioned JSX package builder, history selector, send dialog. |
| `src/features/students/` | Excel validation/import, manual registration, group overview. |
| `src/features/scorecards/` | Activity/student scorecards and result mapping. |
| `src/features/dashboard/` | Summary counts and activity overview. |
| `src/state/StudioContext.jsx` | Shared session state and actions used across screens. |
| `src/data/demoData.js` | Sample activities, classes, learners, and color questions. |
| `src/styles/` | Shared styles and navbar styles. |
| `public/assets/` | Bridges logo and downloadable sample workbook. |
| `public/vendor/` | Existing SheetJS Excel reader, kept at its prior version. |

All screens use React components and handlers. There is no legacy HTML-string rendering or document-wide event dispatcher. User-entered content is rendered as text by React.

Keep feature work in its own folder. Reusable layout components belong in `src/components`; data shared by screens belongs in the provider. Do not put feature markup or business rules in `index.html` or expand `App.jsx` into a combined screen implementation.

## Netlify and automatic versioning

`netlify.toml` runs `npm run build` and publishes `dist`. Netlify installs the pinned dependencies using `package-lock.json`.

The local version-cache build plugin restores version state before the build and saves it after a successful build. `scripts/build-version.mjs` adds exactly 0.1 and writes build metadata to `.netlify/build-version.json`. Vite uses that same version for the splash, footer, HTML metadata and `version.json`. The build makes no requests to the published website and needs no website credentials. Production and preview branches have separate counters; rebuilding the same commit advances again.

Counter state is cache-backed: manually clearing or losing Netlify's build cache resets it to the configured minimum release. Builds that finish but fail during publishing may consume a number. A strict counter that survives cache loss requires durable storage or authenticated deployment-history access. Rollbacks display the restored deployment's version. Uploads that bypass the build command do not increment.

## School workspace and demo modes

Supabase Database, Auth and private Storage back the signed-in school workspace. See `supabase/README.md` for schema, configuration, file versioning and rollout details. The published browser configuration uses only a publishable key; no service-role credential is shipped.

The existing demo remains available through **Continue with the demo**. Demo records reset on reload and are separate from school records. AI prompt responses remain simulated. In the school workspace, student registrations, groups, saved activity versions, assignment recipients and recorded teacher-led results persist in Supabase. An assignment records access; email/push notifications and student self-service sign-in are not implemented yet.

## Release notes

Click the version in the footer or splash screen to see the current release notes. Edit `release.json` with a maximum of three short sentences when releasing changes. Its `minimumVersion` sets the 1.0 milestone once; subsequent cached builds continue at 1.1, 1.2, and so on. Keep the minimum unchanged during routine deployments. Popup UI is isolated in `VersionButton.jsx` and `ReleaseNotesDialog.jsx`.

The current sign-in flow uses a pre-provisioned `admin` username with no email verification step. The credential is provisioned directly in Supabase and is not embedded in source code.
