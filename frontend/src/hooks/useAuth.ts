import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";
import type { Role } from "@/lib/roles";

export type Profile = {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  organization: string | null;
  status: "pending" | "active" | "disabled";
  requested_role: Role | null;
};

export type AuthState = {
  loading: boolean;
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  roles: Role[];
  isAuthenticated: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
};

let cachedProfile: Profile | null = null;
let cachedRoles: Role[] = [];

export function useAuth(): AuthState {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(cachedProfile);
  const [roles, setRoles] = useState<Role[]>(cachedRoles);

  const loadProfileAndRoles = useCallback(async (userId: string) => {
    try {
      const [{ data: prof }, { data: rls }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", userId),
      ]);
      let p = (prof ?? null) as Profile | null;
      const rs = ((rls ?? []) as { role: Role }[]).map((r) => r.role);

      // If user holds the super_admin database role, auto-repair any stale disabled/pending profile status to active
      if (rs.includes("super_admin") && p && p.status !== "active") {
        p = { ...p, status: "active", requested_role: null };
        void supabase.from("profiles").update({ status: "active", requested_role: null }).eq("id", userId);
      }

      cachedProfile = p;
      cachedRoles = rs;
      setProfile(p);
      setRoles(rs);
      return { profile: p, roles: rs };
    } catch (err) {
      console.error("[useAuth] Error fetching profile/roles from database:", err);
      return { profile: null, roles: [] };
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    async function syncAuth(s: Session | null) {
      if (!mounted) return;
      setSession(s);
      if (s?.user) {
        await loadProfileAndRoles(s.user.id);
      } else {
        cachedProfile = null;
        cachedRoles = [];
        setProfile(null);
        setRoles([]);
      }
      if (mounted) {
        setLoading(false);
      }
    }

    // 1) Get current initial session and AWAIT profile + roles loading before setting loading = false
    supabase.auth.getSession().then(({ data }) => {
      void syncAuth(data.session);
    });

    // 2) Listen for auth state changes
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      void syncAuth(s);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [loadProfileAndRoles]);

  const refresh = useCallback(async () => {
    setLoading(true);
    let uid = session?.user?.id;
    if (!uid) {
      const { data } = await supabase.auth.getSession();
      uid = data.session?.user?.id;
      if (data.session) setSession(data.session);
    }
    if (uid) {
      await loadProfileAndRoles(uid);
    }
    setLoading(false);
  }, [session, loadProfileAndRoles]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    cachedProfile = null;
    cachedRoles = [];
    if (typeof window !== "undefined") window.localStorage.removeItem("smartport.viewAsRole");
  }, []);

  return {
    loading,
    session,
    user: session?.user ?? null,
    profile,
    roles,
    isAuthenticated: !!session?.user,
    refresh,
    signOut,
  };
}
