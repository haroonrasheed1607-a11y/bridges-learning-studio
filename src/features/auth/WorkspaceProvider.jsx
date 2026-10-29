import { loginIdentity } from "./loginIdentity.js";
import { createContext, useContext, useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "../../lib/supabaseClient.js";
const WorkspaceContext = createContext({
  isCloud: false,
  configured: false,
  profile: null,
  session: null,
});
export function WorkspaceProvider({ children }) {
  const [session, setSession] = useState(null),
    [profile, setProfile] = useState(null),
    [loading, setLoading] = useState(isSupabaseConfigured),
    [error, setError] = useState("");
  const [studentToken, setStudentToken] = useState(() =>
    typeof window === "undefined" ? "" : sessionStorage.getItem("bridges-student-session") || "");
  function saveStudentToken(token) {
    setStudentToken(token);
    if (token) sessionStorage.setItem("bridges-student-session", token);
    else sessionStorage.removeItem("bridges-student-session");
  }
  const [demo, setDemo] = useState(!isSupabaseConfigured);
  useEffect(() => {
    if (!supabase) return;
    let active = true;
    supabase.auth.getSession().then(({ data, error }) => {
      if (active) {
        setSession(data.session);
        if (error) setError(error.message);
        setLoading(false);
      }
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);
  useEffect(() => {
    if (!session || demo || studentToken) {
      setProfile(null);
      return;
    }
    let active = true;
    setProfile(null);
    setLoading(true);
    setError("");
    supabase
      .from("teacher_profiles")
      .select("*")
      .eq("id", session.user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (active) {
          setProfile(data);
          setError(error?.message || "");
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [session?.user.id, demo, studentToken]);
  async function signIn(username, password) {
    setError("");
    const { error } = await supabase.auth.signInWithPassword({
      email: loginIdentity(username),
      password,
    });
    if (error) throw error;
    setDemo(false);
  }
  async function signInStudent(studentId) {
    setError("");
    if (session) {
      const result = await supabase.auth.signOut({ scope: "local" });
      if (result.error) throw result.error;
    }
    const { data, error } = await supabase.rpc("student_login", { p_student_code: studentId });
    if (error) throw error;
    saveStudentToken(data.token);
    setProfile(null);
    setDemo(false);
  }
  async function signOutStudent() {
    const { error } = await supabase.rpc("student_logout", { p_token: studentToken });
    saveStudentToken("");
    setDemo(false);
    setError(error ? "Student session cleared on this device." : "");
  }
  async function createWorkspace(schoolName, teacherName) {
    const { error } = await supabase.rpc("create_school_workspace", {
      p_school_name: schoolName,
      p_teacher_name: teacherName,
    });
    if (error) throw error;
    const result = await supabase
      .from("teacher_profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();
    if (result.error) throw result.error;
    setProfile(result.data);
  }
  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setProfile(null);
    setSession(null);
  }
  return (
    <WorkspaceContext.Provider
      value={{
        configured: isSupabaseConfigured,
        isCloud: !studentToken && !demo && Boolean(profile) && profile.id === session?.user.id,
        requiresSignIn: isSupabaseConfigured && !demo && !session && !studentToken,
        needsWorkspace: isSupabaseConfigured && !demo && session && !profile && !studentToken,
        profile,
        session,
        loading,
        error,
        studentToken,
        signInStudent,
        signOutStudent,
        signIn,
        createWorkspace,
        signOut,
        tryDemo: () => setDemo(true),
        openSignIn: () => {
          setDemo(false);
          setError("");
        },
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}
export const useWorkspace = () => useContext(WorkspaceContext);
