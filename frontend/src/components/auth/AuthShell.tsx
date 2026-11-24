import { Link } from "@tanstack/react-router";
import { Anchor, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import { motion } from "framer-motion";

export function AuthShell({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#0b0f13]">
      {/* Brand panel */}
      <div className="relative md:w-[45%] p-8 md:p-14 overflow-hidden hidden md:flex flex-col justify-between border-r border-border bg-surface/50">
        <div className="absolute inset-0 grid-bg opacity-30" />

        <Link to="/" className="relative z-10 flex items-center gap-2.5">
          <div className="w-9 h-9 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center">
            <Anchor className="w-5 h-5 text-amber-300" strokeWidth={2.5} />
          </div>
          <div>
            <span className="font-display font-semibold tracking-tight text-lg text-foreground uppercase">
              Global Maritime OS
            </span>
            <div className="text-[9px] font-mono tracking-widest text-amber-400/80 uppercase">
              Port &amp; Customs Authority
            </div>
          </div>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10"
        >
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-amber-500/30 bg-amber-500/10 text-[10.5px] uppercase tracking-[0.2em] text-amber-400 font-mono">
            <ShieldCheck className="w-3.5 h-3.5" /> Official Access Enclave
          </div>
          <h2 className="mt-4 text-3xl md:text-4xl font-display font-semibold leading-tight text-white">
            Command vessel traffic,
            <br />
            quay berths &amp; trade logistics.
          </h2>
          <p className="mt-4 text-muted-foreground text-sm max-w-md leading-relaxed">
            International maritime operating system deployed across container hubs. Standardized under IMO FAL and WCO SAFE international frameworks.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-3 max-w-md">
            {[
              { k: "Active Berths", v: "25 PSA" },
              { k: "Security", v: "ISPS Level 1" },
              { k: "Standards", v: "ISO 28000" },
            ].map((s) => (
              <div key={s.k} className="p-3 rounded border border-border bg-white/[0.02]">
                <div className="text-base font-display font-bold text-foreground">{s.v}</div>
                <div className="text-[9px] uppercase tracking-widest text-amber-400/80 font-mono mt-0.5">
                  {s.k}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <div className="relative z-10 text-[11px] font-mono text-muted-foreground flex items-center gap-2">
          <span>IMO FAL COMPLIANT</span>
          <span>•</span>
          <span>ISO 27001 SECURE</span>
          <span>•</span>
          <span>WCO SAFE FRAMEWORK</span>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <Link to="/" className="md:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center">
              <Anchor className="w-4 h-4" />
            </div>
            <span className="font-display font-semibold uppercase">Global Maritime OS</span>
          </Link>
          <div className="text-[10px] uppercase tracking-[0.22em] font-mono text-amber-400 font-semibold">
            {eyebrow}
          </div>
          <h1 className="mt-2 text-2xl md:text-3xl font-display font-bold tracking-tight text-white">
            {title}
          </h1>
          {subtitle && <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>}
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-6 text-sm text-muted-foreground">{footer}</div>}
        </motion.div>
      </div>
    </div>
  );
}

export function GoogleButton() {
  return (
    <button
      type="button"
      className="w-full h-11 rounded border border-border bg-white/[0.02] flex items-center justify-center gap-3 hover:bg-white/[0.05] transition text-sm font-medium text-foreground"
    >
      <svg width="16" height="16" viewBox="0 0 48 48">
        <path
          fill="#EA4335"
          d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
        />
        <path
          fill="#4285F4"
          d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
        />
        <path
          fill="#FBBC05"
          d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
        />
        <path
          fill="#34A853"
          d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
        />
      </svg>
      Continue with Single Sign-On (SSO)
    </button>
  );
}

export function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-6">
      <div className="flex-1 h-px bg-border" />
      <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">
        {label}
      </span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

export function Field({
  label,
  type = "text",
  placeholder,
  name,
  autoComplete,
}: {
  label: string;
  type?: string;
  placeholder?: string;
  name: string;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground font-mono">
        {label}
      </span>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="mt-1.5 w-full h-10 rounded bg-white/[0.03] border border-border px-3 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/40 text-foreground transition"
      />
    </label>
  );
}

export function PrimaryButton({ children }: { children: ReactNode }) {
  return (
    <button className="w-full h-10 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm tracking-wide shadow transition">
      {children}
    </button>
  );
}
