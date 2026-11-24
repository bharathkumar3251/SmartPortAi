import { createServerFn } from "@tanstack/react-start";
import { SYSTEM_ADMIN_EMAIL } from "./dev-admin";

/**
 * Idempotently guarantees the built-in Super Admin account profile and roles exist.
 * Safe to call on every app boot or login.
 */
export const ensureSystemAdmin = createServerFn({ method: "POST" }).handler(async () => {
  try {
    const { supabase } = await import("@/integrations/supabase/client");

    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user && (session.user.email ?? "").toLowerCase() === SYSTEM_ADMIN_EMAIL) {
      const userId = session.user.id;
      // 1) Ensure profile is active
      await supabase
        .from("profiles")
        .update({ status: "active", requested_role: null })
        .eq("id", userId);

      // 2) Ensure super_admin role exists
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      const hasSuperAdmin = (roles ?? []).some((r: any) => r.role === "super_admin");
      if (!hasSuperAdmin) {
        await supabase
          .from("user_roles")
          .insert({ user_id: userId, role: "super_admin" });
      }
    }

    // Try RPC fallback if available
    const { data, error } = await supabase.rpc("ensure_system_admin" as any);
    if (!error) return { ok: true as const, data };

    return { ok: true as const };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn("[ensureSystemAdmin] Info:", message);
    return { ok: false as const, error: message };
  }
});
