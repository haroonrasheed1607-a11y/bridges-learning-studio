# School workspace storage

Project: Bridges Learning Studio (`fhjaxywcholkmavipyjq`), free plan, Mumbai region.

## Database

Migrations contain school-scoped teacher profiles, students, groups/memberships, activities, immutable source versions, assignments/recipient snapshots and student attempts/answers. Database routines apply writes transactionally; exposed routines run as the caller and delegate to guarded private-schema bodies. Anonymous clients cannot query school tables directly. Guarded student RPCs require a short-lived bearer token for the selected learner.

`create_school_workspace` creates the first teacher as administrator of their own school. Additional teacher invitations are not implemented in this release. Student records are created by a signed-in teacher; no email or password is required for a student record.

Teacher-led color assessments can be recorded against a selected student and saved activity version. The server derives the score from the saved question answer key. The browser cannot submit an arbitrary final score. Assignments snapshot their student recipients and exact activity version.

## Temporary Student-ID login

The sign-in screen offers Teacher and Student. `student_login` resolves a case-insensitive Student ID only when exactly one school record matches. IDs shared by multiple schools are rejected rather than selecting an arbitrary student. This is intentionally a temporary access model: anyone who knows an ID can act as that learner. Add a school identifier and a stronger student credential before broad rollout.

Login issues an eight-hour random bearer token, kept in sessionStorage and hashed in `app_private.student_sessions`. No Supabase Auth account or password is created for students. The private sessions table has RLS enabled and no direct client privileges or policies; the advisor's no-policy INFO is intentional default denial. The guarded private routines validate the token for every workspace and submission call; logout deletes the session. Only explicitly named entry points are granted to anonymous callers.

The student portal shows only that learner's assignment snapshots and results. Assessment answer keys and JSX source paths are omitted from responses. The trusted player supports color/text assessments and text lessons. Submissions are checked against assignment recipients, graded against the saved version, and stored with `submission_source='student'` and no teacher submitter. Retry IDs are idempotent. Teacher-led submissions keep their existing actor and default source.

## JSX files

The private `activity-files` bucket stores:

`{school_id}/{activity_id}/{version_id}/activity.jsx`

Version numbers are allocated under an activity row lock. File uploads never use upsert and there are no client UPDATE/DELETE policies. A version becomes ready only after its file exists. Upload failures stay pending and cannot be assigned. A delayed older upload cannot replace a newer finalized version. Opening a historical version reloads both its metadata/prompt history and JSX source; customization saves another file. The stored `basedOnVersionId` records which version was customized.

The current player renders the supported color/text activity definition. JSX source is saved, readable and reloadable, but arbitrary JSX is not executed inside the teacher application. An isolated compiler/player and AI content generation are separate future integrations.

## App configuration

`src/config/supabase.json` contains the project URL and its **publishable** key. Both are intentionally public browser configuration. Never add a secret/service-role key. Deployments can override these with `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.

The current release uses a pre-provisioned `admin` username linked to a confirmed Supabase account; there is no email verification step in the login flow. The password is held only as a hash in Supabase and must not be committed to source. Self-service registration is currently hidden. Set the Supabase Auth Site URL and allowed redirect URLs to `https://learningapp-bridges.netlify.app` before broad rollout. Supabase's default email sender restricts delivery; configure your own SMTP provider before inviting teachers outside your Supabase organization. Do not disable confirmation to bypass setup.

The free plan does not include compromised-password checks, automatic database backups, or continuous activity guarantees. The requested temporary admin credential is supported; broader password-policy and user-management flows remain future work. Database and file-storage backup procedures should be added before real school rollout.

## Verification

`npm test` includes a real embedded PostgreSQL test (PGlite), not a SQL-string comparison. It verifies school isolation, anonymous denial, immutable files/versions, transactional imports, version-pinned assignments, upload completion checks, replay-safe attempt IDs, and server-calculated scoring. A live API test also verified authentication, actual private-file uploads/downloads, two-version reload and persistence across a fresh login.
