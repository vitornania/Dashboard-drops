import { createClient } from "@supabase/supabase-js";

let supabase = null;
let initPromise = null;

export function getSupabase() {
  return supabase;
}

export function isSupabaseConfigured() {
  return Boolean(supabase);
}

function createSupabaseClient(url, key) {
  supabase = createClient(url, key);
  return supabase;
}

async function fetchJsonConfig(url) {
  const response = await fetch(url);
  if (!response.ok) return null;
  const data = await response.json();
  if (!data.supabaseUrl || !data.supabaseAnonKey) return null;
  return { url: data.supabaseUrl, key: data.supabaseAnonKey };
}

async function loadRuntimeConfig() {
  const sources = ["/supabase-config.json", "/api/supabase-config"];

  for (const source of sources) {
    try {
      const config = await fetchJsonConfig(source);
      if (config) return config;
    } catch (err) {
      console.warn(`Supabase config fetch failed: ${source}`, err);
    }
  }

  return null;
}

export async function ensureSupabase() {
  if (supabase) return supabase;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const buildUrl = process.env.REACT_APP_SUPABASE_URL || "";
    const buildKey = process.env.REACT_APP_SUPABASE_ANON_KEY || "";

    if (buildUrl && buildKey) {
      return createSupabaseClient(buildUrl, buildKey);
    }

    try {
      const runtime = await loadRuntimeConfig();
      if (runtime) {
        return createSupabaseClient(runtime.url, runtime.key);
      }
    } catch (err) {
      console.error("Failed to load Supabase config", err);
    }

    return supabase;
  })();

  return initPromise;
}

export { supabase };
