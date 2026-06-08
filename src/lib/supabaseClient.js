import { createClient } from "@supabase/supabase-js";

let supabase = null;
let initPromise = null;

export function getSupabase() {
  return supabase;
}

export function isSupabaseConfigured() {
  return Boolean(supabase);
}

async function loadRuntimeConfig() {
  const response = await fetch("/api/config/public");
  if (!response.ok) return null;
  const data = await response.json();
  if (!data.supabaseUrl || !data.supabaseAnonKey) return null;
  return { url: data.supabaseUrl, key: data.supabaseAnonKey };
}

export async function ensureSupabase() {
  if (supabase) return supabase;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const buildUrl = process.env.REACT_APP_SUPABASE_URL || "";
    const buildKey = process.env.REACT_APP_SUPABASE_ANON_KEY || "";

    if (buildUrl && buildKey) {
      supabase = createClient(buildUrl, buildKey);
      return supabase;
    }

    try {
      const runtime = await loadRuntimeConfig();
      if (runtime) {
        supabase = createClient(runtime.url, runtime.key);
      }
    } catch (err) {
      console.error("Failed to load Supabase config", err);
    }

    return supabase;
  })();

  return initPromise;
}

// Legacy export — use getSupabase() after ensureSupabase()
export { supabase };
