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
    if (!session || demo) {
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
  }, [session?.user.id, demo]);
  async function signIn(email, password) {
    setError("");
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    setDemo(false);
  }
  async function signUp(email, password) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) throw error;
    return Boolean(data.session);
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
        isCloud: !demo && Boolean(profile) && profile.id === session?.user.id,
        requiresSignIn: isSupabaseConfigured && !demo && !session,
        needsWorkspace: isSupabaseConfigured && !demo && session && !profile,
        profile,
        session,
        loading,
        error,
        signIn,
        signUp,
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
