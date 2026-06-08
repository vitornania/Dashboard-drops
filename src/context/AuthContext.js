import { createContext, useContext, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { ensureSupabase, getSupabase, isSupabaseConfigured } from "lib/supabaseClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState(false);

  useEffect(() => {
    let active = true;
    let subscription;

    (async () => {
      const client = await ensureSupabase();
      if (!active) return;

      setConfigured(isSupabaseConfigured());

      if (!client) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await client.auth.getSession();
        if (active) setSession(data.session);
      } catch {
        if (active) setSession(null);
      }

      const { data: authListener } = client.auth.onAuthStateChange((_event, nextSession) => {
        setSession(nextSession);
        setLoading(false);
      });
      subscription = authListener.subscription;

      if (active) setLoading(false);
    })();

    return () => {
      active = false;
      subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const client = getSupabase();
    if (!client || !session?.user?.id) {
      setProfile(null);
      return undefined;
    }

    let active = true;

    client
      .from("profiles")
      .select("display_name, avatar_color")
      .eq("id", session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (active) setProfile(data);
      })
      .catch(() => {
        if (active) setProfile(null);
      });

    return () => {
      active = false;
    };
  }, [session?.user?.id]);

  const value = useMemo(
    () => ({
      session,
      profile,
      loading,
      isConfigured: configured,
      displayName:
        profile?.display_name ||
        session?.user?.user_metadata?.display_name ||
        session?.user?.email?.split("@")[0] ||
        "",
      signIn: async (email, password) => {
        const client = getSupabase();
        if (!client) throw new Error("Supabase is not configured. Add env vars from .env.example");
        const { data, error } = await client.auth.signInWithPassword({ email, password });
        if (error) throw error;
        return data;
      },
      signOut: async () => {
        const client = getSupabase();
        if (!client) return;
        await client.auth.signOut();
      },
      getAccessToken: async () => {
        const client = getSupabase();
        if (!client) return null;
        const { data } = await client.auth.getSession();
        return data.session?.access_token ?? null;
      },
    }),
    [session, profile, loading, configured]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
