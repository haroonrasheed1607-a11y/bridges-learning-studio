// Supabase uses an internal email identifier; the user-facing login is a username.
// Password validation stays in Supabase, never in browser code.
export function loginIdentity(username) {
  const value = username.trim();
  return value.toLowerCase() === "admin"
    ? "admin@bridges-learning-studio.invalid"
    : value;
}
