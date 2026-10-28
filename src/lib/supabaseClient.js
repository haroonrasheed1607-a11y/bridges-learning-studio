import { createClient } from "@supabase/supabase-js";
import publicConfig from "../config/supabase.json";
const url = import.meta.env.VITE_SUPABASE_URL || publicConfig.url;
const key =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || publicConfig.publishableKey;
// Only a publishable/legacy anonymous key belongs in this application. Never add a secret/service-role key.
function isPublicKey(value) {
  if (value.startsWith("sb_publishable_")) return true;
  try {
    return (
      JSON.parse(
        atob(value.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")),
      ).role === "anon"
    );
  } catch {
    return false;
  }
}
export const isSupabaseConfigured = Boolean(url && key && isPublicKey(key));
export const supabase = isSupabaseConfigured ? createClient(url, key) : null;
