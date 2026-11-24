import { createFileRoute, Outlet, useRouterState, useNavigate } from "@tanstack/react-router";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopNav } from "@/components/layout/TopNav";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { canAccess } from "@/lib/roles";
import { ForbiddenPanel, PendingApprovalPanel } from "@/components/common/ErrorPanels";
import { Anchor } from "lucide-react";
import { AiChatDrawer } from "@/components/common/AiChatDrawer";

export const Route = createFileRoute("/app")({
  ssr: false,
  component: AppLayout,
});

function AppLayout() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const navigate = useNavigate();
  const { loading, isAuthenticated, roles, profile, user } = useAuth();

  // Diagnostic logger (Phase 1)
  useEffect(() => {
    if (typeof window !== "undefined" && !loading) {
      console.log(
        `[SMARTPORT AUTH DEBUG]\n` +
        `auth user id: ${user?.id ?? "none"}\n` +
        `auth email: ${user?.email ?? "none"}\n` +
        `profile found: ${Boolean(profile)}\n` +
        `profile status: ${profile?.status ?? "none"}\n` +
        `requested role: ${profile?.requested_role ?? "none"}\n` +
        `resolved roles: ${JSON.stringify(roles)}\n` +
        `is super admin: ${roles.includes("super_admin")}\n` +
        `route: ${pathname}\n` +
        `route allowed: ${canAccess(pathname, roles)}`
      );
    }
  }, [user?.id, user?.email, profile, roles, pathname, loading]);

  // Redirect unauthenticated to /auth/login (client-only, ssr:false)
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate({ to: "/auth/login" });
    }
  }, [loading, isAuthenticated, navigate]);

  if (loading || !isAuthenticated) return <BootSplash />;

  const isSuperAdmin = roles.includes("super_admin");

  // Disabled non-super_admin accounts land on a 403 shell across the whole console
  if (profile?.status === "disabled" && !isSuperAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <ForbiddenPanel />
      </div>
    );
  }

  // Non-super_admin pending users land on a pending notice for operational routes
  if (profile?.status === "pending" && !isSuperAdmin && pathname !== "/app/admin") {
    return (
      <div className="min-h-screen flex w-full">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <TopNav />
          <main className="flex-1 relative p-8 flex items-center justify-center">
            <PendingApprovalPanel />
          </main>
        </div>
      </div>
    );
  }

  const allowed = canAccess(pathname, roles);

  return (
    <div className="min-h-screen flex w-full">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopNav />
        <main className="flex-1 relative">
          <div className="absolute inset-0 -z-10 grid-bg opacity-20 [mask-image:radial-gradient(ellipse_at_top,black_10%,transparent_60%)]" />
          <div className="mx-auto w-full max-w-[1440px] px-6 lg:px-8 py-7 lg:py-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
              >
                {allowed ? <Outlet /> : <ForbiddenPanel />}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
      <AiChatDrawer />
    </div>
  );
}

function BootSplash() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center">
          <Anchor className="w-4 h-4 text-amber-400" />
        </div>
        <div className="text-xs text-amber-400/80 font-mono tracking-widest uppercase">Initializing Port Directorate OS…</div>
      </div>
    </div>
  );
}
