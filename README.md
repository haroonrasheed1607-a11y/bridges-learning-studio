# Bridges Learning Studio

An education demo with an activity library, Excel student import, scorecards, and a playable color-matching assessment.

## Run locally

Open `index.html` in a modern browser. The source contains the complete static demo and a baseline version. To produce a local deployment build, run `node scripts/build-version.mjs` and open `dist/index.html`.

## Netlify deployment and automatic versioning

`netlify.toml` configures the build command and the `dist` publish directory. Every build reads the version currently published at Netlify's site URL, adds exactly 0.1, and stamps the generated HTML's splash screen, footer and version metadata. It also publishes `version.json` for the next build to read. The initial migration reads the old site's HTML metadata, so version 0.1 becomes 0.2 automatically.

Production uses Netlify's `URL`; preview and branch contexts use `DEPLOY_PRIME_URL` when available. Rebuilding the same commit advances the version once the previous build is published. Failed builds do not change the public version. Version 0.9 advances to 1.0. This does not depend on the build cache or manual edits to the source version.

If the published site cannot be read or its version is invalid, the build fails rather than silently resetting the counter. Keep automatic publishing enabled. Restoring an older deploy restores that deploy's version; the next build advances from the version then published. Uploads that bypass the build command do not increment the version.

Run versioning checks with `node --test scripts/build-version.test.mjs`.

## Demo scope

AI chat, account creation, and sending activities to student groups are simulated. Imported students and activity results remain in memory and reset when the page reloads. There is no backend or authentication.
