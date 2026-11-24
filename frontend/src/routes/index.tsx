import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { ArrowRight, PlayCircle, Radar, Sparkles } from "lucide-react";
import { PortScene } from "@/components/landing/PortScene";
import { LandingNav } from "@/components/landing/LandingNav";
import {
  Features,
  Architecture,
  AIModels,
  TechStack,
  WorkflowSection,
  Roles,
  Partners,
  Pricing,
  FAQ,
  Contact,
  Footer,
} from "@/components/landing/Sections";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen">
      <LandingNav />
      <Hero />
      <Features />
      <Architecture />
      <AIModels />
      <TechStack />
      <WorkflowSection />
      <Roles />
      <Partners />
      <Pricing />
      <FAQ />
      <Contact />
      <Footer />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative min-h-[100svh] pt-28 pb-16 px-6 flex items-center overflow-hidden">
      <PortScene />
      <div className="relative z-10 max-w-6xl mx-auto w-full">
        <div className="max-w-3xl transition-all duration-700 ease-out">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded border border-amber-500/30 bg-amber-500/10 text-xs font-mono uppercase tracking-widest text-amber-300">
            <Sparkles className="w-3.5 h-3.5" /> IMO FAL &amp; ISPS COMPLIANT • GLOBAL MARITIME OS
          </div>
          <h1 className="mt-6 text-5xl md:text-7xl font-display font-semibold tracking-tight leading-[1.02]">
            Autonomous <br />
            <span className="text-gradient">Maritime Logistics</span> &amp; Port Operations.
          </h1>
          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl">
            Sovereign port operating system. Predict congestion, orchestrate berth line-ups, automate customs clearance, and track intermodal freight across international shipping lanes.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Link
              to="/auth/register"
              className="group inline-flex items-center gap-2 px-6 py-3.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-lg transition"
            >
              Access Command Portal
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
            </Link>
            <Link
              to="/auth/login"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded glass border border-border hover:border-amber-500/50 text-foreground transition"
            >
              <PlayCircle className="w-4 h-4 text-amber-400" /> Operational Sign In
            </Link>
            <Link
              to="/app/live-map"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded border border-border hover:border-emerald-500/50 text-foreground transition"
            >
              <Radar className="w-4 h-4 text-emerald-400" /> Live Nautical Chart
            </Link>
          </div>

          <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl">
            {[
              { k: "Port Operations Hub", v: "PSA Singapore" },
              { k: "Singapore Strait AIS", v: "Live Nautical Feed" },
              { k: "Regulatory Compliance", v: "IMO FAL / ISPS" },
              { k: "Intermodal Workspaces", v: "10 Roles" },
            ].map((s) => (
              <div key={s.k} className="glass p-4 border border-border">
                <div className="text-xl font-semibold font-display truncate text-foreground">{s.v}</div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-amber-400/80 font-mono mt-1 truncate">
                  {s.k}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating live console preview */}
      <div className="hidden xl:block absolute right-6 top-32 w-[380px] z-10">
        <div className="glass-strong p-5">
          <div className="flex items-center justify-between">
            <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
              PSA Live Console
            </div>
            <span className="w-2 h-2 rounded-full bg-success animate-pulse-dot" />
          </div>
          <div className="mt-4">
            <div className="text-xs text-muted-foreground">
              Singapore Strait &amp; Pasir Panjang
            </div>
            <div className="text-3xl font-display font-semibold mt-1">
              PSA Singapore <span className="text-cyan text-base font-mono">PILOT</span>
            </div>
          </div>
          <div className="mt-4 h-20 flex items-end gap-1">
            {[35, 42, 38, 54, 62, 58, 70, 68, 78, 75, 84, 88, 80, 90, 94, 89].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t bg-gradient-to-t from-cyan/20 to-cyan"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
          <div className="mt-4 space-y-2 text-xs">
            {[
              { t: "Pasir Panjang Terminal berth queue active", tone: "cyan" },
              { t: "AISStream Singapore bbox websocket connected", tone: "success" },
              { t: "Open-Meteo marine weather active", tone: "success" },
            ].map((row) => (
              <div key={row.t} className="flex items-center gap-2">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    row.tone === "warning"
                      ? "bg-warning"
                      : row.tone === "success"
                        ? "bg-success"
                        : "bg-cyan"
                  }`}
                />
                <span className="text-muted-foreground">{row.t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
