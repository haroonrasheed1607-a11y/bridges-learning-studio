# School workspace storage

Project: Bridges Learning Studio (`fhjaxywcholkmavipyjq`), free plan, Mumbai region.

## Database

Migrations contain school-scoped teacher profiles, students, groups/memberships, activities, immutable source versions, assignments/recipient snapshots and student attempts/answers. Database routines apply writes transactionally; exposed routines run as the caller and delegate to guarded private-schema bodies. Anonymous clients cannot read school records.

`create_school_workspace` creates the first teacher as administrator of their own school. Additional teacher invitations and student self-service sign-in are not implemented in this release. Student records are created by a signed-in teacher; no email or password is required for a student record.

Teacher-led color assessments can be recorded against a selected student and saved activity version. The server derives the score from the saved question answer key. The browser cannot submit an arbitrary final score. Assignments snapshot their student recipients and exact activity version.

## JSX files

The private `activity-files` bucket stores:

`{school_id}/{activity_id}/{version_id}/activity.jsx`

Version numbers are allocated under an activity row lock. File uploads never use upsert and there are no client UPDATE/DELETE policies. A version becomes ready only after its file exists. Upload failures stay pending and cannot be assigned. A delayed older upload cannot replace a newer finalized version. Opening a historical version reloads both its metadata/prompt history and JSX source; customization saves another file. The stored `basedOnVersionId` records which version was customized.

The current player renders the supported color/text activity definition. JSX source is saved, readable and reloadable, but arbitrary JSX is not executed inside the teacher application. An isolated compiler/player and AI content generation are separate future integrations.

## App configuration

`src/config/supabase.json` contains the project URL and its **publishable** key. Both are intentionally public browser configuration. Never add a secret/service-role key. Deployments can override these with `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.

Teachers use email/password registration and email confirmation. Confirm the email and return to the application to sign in. Set the Supabase Auth Site URL and allowed redirect URLs to `https://learningapp-bridges.netlify.app` before broad rollout. Supabase's default email sender restricts delivery; configure your own SMTP provider before inviting teachers outside your Supabase organization. Do not disable confirmation to bypass setup.

The free plan does not include compromised-password checks, automatic database backups, or continuous activity guarantees. The application requires passwords of at least eight characters. Database and file-storage backup procedures should be added before real school rollout.

## Verification

`npm test` includes a real embedded PostgreSQL test (PGlite), not a SQL-string comparison. It verifies school isolation, anonymous denial, immutable files/versions, transactional imports, version-pinned assignments, upload completion checks, replay-safe attempt IDs, and server-calculated scoring. A live API test also verified authentication, actual private-file uploads/downloads, two-version reload and persistence across a fresh login.
