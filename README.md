# Bridges Learning Studio

An education demo with an activity library, Excel student import, scorecards, and a playable color-matching assessment.

## Run locally

Open `index.html` in a modern browser. The source contains the complete static demo and a baseline version. To produce a local deployment build, run `node scripts/build-version.mjs` and open `dist/index.html`.

## Netlify deployment and automatic versioning

`netlify.toml` runs `node scripts/build-version.mjs` and publishes `dist`.
A local build plugin restores the version state from Netlify's build cache before the command and saves it after a successful build. The command adds exactly 0.1 and updates the splash, footer, metadata, and `version.json` together. The first build advances 0.1 to 0.2; rebuilding the same commit advances again. Production and preview branches have separate counters.

The build makes no requests to the published website and needs no website credentials. This fixes the HTTP 401 failure introduced by the previous version lookup. Corrupt counter state fails explicitly rather than silently resetting.

Counter state is cache-backed: manually clearing or losing Netlify's build cache resets it to the source baseline. Builds that finish but fail during publishing may consume a number. A strict counter that survives cache loss requires a durable database or authenticated deployment-history access. Rollbacks display the restored deployment's version. Uploads that bypass the build command do not increment.

Run versioning checks with `node --test scripts/build-version.test.mjs`.

## Demo scope

AI chat, account creation, and sending activities to student groups are simulated. Imported students and activity results remain in memory and reset when the page reloads. There is no backend or authentication.
