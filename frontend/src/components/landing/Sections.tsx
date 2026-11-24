import { motion } from "framer-motion";
import {
  Activity,
  Anchor,
  Ship,
  Container,
  Truck,
  BadgeCheck,
  Brain,
  Cpu,
  Database,
  Cloud,
  Radar,
  Gauge,
  LineChart,
  ShieldCheck,
  Workflow,
  Sparkles,
  Zap,
  GitBranch,
  Server,
  Layers,
  Globe,
  Bell,
} from "lucide-react";
import { GlassCard } from "@/components/common/GlassCard";
import { ROLES } from "@/lib/roles";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-100px" },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
};

export function Features() {
  const items = [
    {
      icon: Radar,
      title: "Live Congestion Score",
      desc: "Real-time port congestion index with 15-minute forecast horizon.",
    },
    {
      icon: Gauge,
      title: "Berth Utilization",
      desc: "Occupancy heatmaps, dwell time and turnaround KPIs by terminal.",
    },
    {
      icon: LineChart,
      title: "ETA Intelligence",
      desc: "Delay-aware ETA prediction fed from AIS, weather and berth queue.",
    },
    {
      icon: Brain,
      title: "Explainable AI",
      desc: "SHAP-driven feature importance for every congestion prediction.",
    },
    {
      icon: ShieldCheck,
      title: "Role-Based Access",
      desc: "Granular permissions across authority, terminal, shipping and customs.",
    },
    {
      icon: Bell,
      title: "Proactive Alerts",
      desc: "Signed webhooks and in-app alerts on congestion thresholds and risk.",
    },
  ];
  return (
    <section id="features" className="relative py-32 px-6">
      <div className="max-w-6xl mx-auto">
        <SectionEyebrow>Platform capabilities</SectionEyebrow>
        <SectionTitle>Everything a modern port command center needs.</SectionTitle>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-14">
          {items.map((it, i) => (
            <motion.div
              key={it.title}
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: i * 0.05 }}
            >
              <GlassCard className="h-full hover:border-amber-500/40 transition group">
                <div className="w-10 h-10 rounded border border-amber-500/30 bg-amber-500/10 flex items-center justify-center text-amber-400 mb-4 transition">
                  <it.icon className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-medium">{it.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{it.desc}</p>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Architecture() {
  return (
    <section id="architecture" className="relative py-32 px-6 border-t border-border">
      <div className="max-w-6xl mx-auto">
        <SectionEyebrow>Reference architecture</SectionEyebrow>
        <SectionTitle>A composable data pipeline built for scale.</SectionTitle>
        <div className="grid lg:grid-cols-4 gap-4 mt-14">
          {[
            {
              icon: Globe,
              title: "Ingestion",
              items: ["AIS satellite feeds", "Terminal EDI", "Weather APIs", "IoT gate sensors"],
            },
            {
              icon: Layers,
              title: "Processing",
              items: ["Stream processing", "Feature store", "Geospatial ETL", "Data quality gates"],
            },
            {
              icon: Brain,
              title: "Models",
              items: ["Congestion LSTM", "ETA regression", "Risk classifier", "SHAP explainers"],
            },
            {
              icon: Server,
              title: "Serving",
              items: ["FastAPI gateway", "gRPC micro-services", "Signed webhooks", "SSE realtime"],
            },
          ].map((col, i) => (
            <motion.div
              key={col.title}
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: i * 0.08 }}
            >
              <GlassCard className="h-full relative hover:border-amber-500/40 transition">
                <col.icon className="w-5 h-5 text-amber-400" />
                <div className="mt-4 text-xs uppercase tracking-[0.2em] text-muted-foreground font-mono">
                  Stage {i + 1}
                </div>
                <h3 className="mt-1 text-lg font-medium">{col.title}</h3>
                <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                  {col.items.map((it) => (
                    <li key={it} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded bg-amber-400" /> {it}
                    </li>
                  ))}
                </ul>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function AIModels() {
  const models = [
    {
      name: "PortCast-LSTM",
      role: "Congestion forecasting",
      metric: "MAE 0.11",
      desc: "Sequence model on 24-month AIS + berth data.",
    },
    {
      name: "ETA-Boost",
      role: "Voyage ETA regression",
      metric: "MAPE 4.2%",
      desc: "Gradient boosted regressor with weather + queue features.",
    },
    {
      name: "RiskNet",
      role: "Cargo risk classification",
      metric: "AUC 0.94",
      desc: "Multimodal risk model for customs inspection triage.",
    },
    {
      name: "ExplainX",
      role: "SHAP explainability",
      metric: "Global + local",
      desc: "Interpretable attributions for every prediction shipped.",
    },
  ];
  return (
    <section id="ai" className="relative py-32 px-6 border-t border-border">
      <div className="max-w-6xl mx-auto">
        <SectionEyebrow>AI Model Suite</SectionEyebrow>
        <SectionTitle>Purpose-built models, benchmarked on real port data.</SectionTitle>
        <div className="grid md:grid-cols-2 gap-4 mt-14">
          {models.map((m, i) => (
            <motion.div
              key={m.name}
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: i * 0.05 }}
            >
              <GlassCard>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-mono">
                      {m.role}
                    </div>
                    <h3 className="mt-1 text-xl font-medium font-display">{m.name}</h3>
                  </div>
                  <span className="text-xs font-mono px-2 py-1 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                    {m.metric}
                  </span>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{m.desc}</p>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function TechStack() {
  const groups = [
    {
      title: "Frontend",
      items: ["React 19", "TypeScript", "Tailwind CSS", "Recharts", "Leaflet / Mapbox"],
    },
    {
      title: "Backend",
      items: ["FastAPI", "SQLite / PostgreSQL", "Redis", "Kafka", "TimescaleDB", "MinIO"],
    },
    { title: "AI / ML", items: ["PyTorch", "XGBoost", "SHAP", "ONNX", "MLflow", "Ray Serve"] },
    {
      title: "Infra",
      items: ["Kubernetes", "Terraform", "Cloudflare", "OpenTelemetry", "Grafana", "Vault"],
    },
  ];
  return (
    <section className="relative py-32 px-6 border-t border-border">
      <div className="max-w-6xl mx-auto">
        <SectionEyebrow>Technology Stack</SectionEyebrow>
        <SectionTitle>Enterprise-grade tooling, top to bottom.</SectionTitle>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mt-14">
          {groups.map((g, i) => (
            <motion.div
              key={g.title}
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: i * 0.06 }}
            >
              <GlassCard>
                <div className="text-xs uppercase tracking-[0.2em] text-amber-400 font-mono">
                  {g.title}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {g.items.map((it) => (
                    <span
                      key={it}
                      className="text-xs px-2 py-1 rounded border border-border bg-white/[0.03] font-mono text-muted-foreground"
                    >
                      {it}
                    </span>
                  ))}
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function WorkflowSection() {
  const steps = [
    {
      icon: Cloud,
      title: "Connect data",
      desc: "Stream AIS, EDI, terminal, weather and IoT feeds securely.",
    },
    {
      icon: Cpu,
      title: "Train models",
      desc: "Continuous training with drift detection and versioning.",
    },
    {
      icon: Sparkles,
      title: "Predict",
      desc: "Congestion, ETA, risk scores delivered in real time.",
    },
    {
      icon: Workflow,
      title: "Automate",
      desc: "Alerts, berth reassignment and gate slot orchestration.",
    },
  ];
  return (
    <section className="relative py-32 px-6 border-t border-border">
      <div className="max-w-6xl mx-auto">
        <SectionEyebrow>Operational Workflow</SectionEyebrow>
        <SectionTitle>From raw signals to shipped decisions.</SectionTitle>
        <div className="mt-14 grid md:grid-cols-4 gap-4 relative">
          <div className="hidden md:block absolute top-7 left-8 right-8 h-px bg-amber-500/20" />
          {steps.map((s, i) => (
            <motion.div
              key={s.title}
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: i * 0.08 }}
            >
              <div className="relative">
                <div className="w-14 h-14 rounded border border-amber-500/30 bg-amber-500/10 flex items-center justify-center text-amber-300 mx-auto">
                  <s.icon className="w-6 h-6" />
                </div>
                <div className="mt-4 text-center">
                  <div className="text-xs uppercase tracking-[0.2em] font-mono text-amber-400/80">
                    Step 0{i + 1}
                  </div>
                  <h3 className="mt-1 font-medium">{s.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Roles() {
  return (
    <section className="relative py-32 px-6 border-t border-border">
      <div className="max-w-6xl mx-auto">
        <SectionEyebrow>Built for every stakeholder</SectionEyebrow>
        <SectionTitle>One platform. Ten purpose-built operational workspaces.</SectionTitle>
        <div className="mt-14 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ROLES.map((r, i) => (
            <motion.div
              key={r.id}
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: i * 0.05 }}
            >
              <GlassCard className="h-full hover:border-amber-500/30 transition">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded border border-amber-500/30 bg-amber-500/10 flex items-center justify-center text-amber-400">
                    <r.icon className="w-4 h-4" />
                  </div>
                  <h3 className="font-medium text-foreground">{r.label}</h3>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{r.description}</p>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Partners() {
  const partners = [
    "Port of Rotterdam",
    "MSC",
    "Maersk",
    "DP World",
    "Hapag-Lloyd",
    "APM Terminals",
    "PSA",
    "COSCO",
  ];
  return (
    <section className="relative py-24 px-6 border-t border-border">
      <div className="max-w-6xl mx-auto text-center">
        <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground font-mono">
          Trusted by operators worldwide
        </div>
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          {partners.map((p) => (
            <div key={p} className="text-muted-foreground/70 font-display text-sm tracking-wide">
              {p}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Pricing() {
  const tiers = [
    {
      name: "Starter",
      price: "$2,900",
      period: "/mo",
      tag: "Single terminal",
      features: ["1 terminal", "Up to 50 vessels/mo", "Basic AI models", "Email support"],
      cta: "Start pilot",
    },
    {
      name: "Operator",
      price: "$9,800",
      period: "/mo",
      tag: "Most popular",
      features: ["Up to 5 terminals", "Full AI suite", "SLA + priority support", "API + webhooks"],
      featured: true,
      cta: "Deploy Operator",
    },
    {
      name: "Authority",
      price: "Custom",
      period: "",
      tag: "National scale",
      features: [
        "Unlimited terminals",
        "Dedicated cluster",
        "Compliance & audit",
        "On-prem option",
      ],
      cta: "Contact sales",
    },
  ];
  return (
    <section id="pricing" className="relative py-32 px-6 border-t border-border">
      <div className="max-w-6xl mx-auto">
        <SectionEyebrow>Pricing</SectionEyebrow>
        <SectionTitle>Plans that scale from pilot to national deployment.</SectionTitle>
        <div className="mt-14 grid md:grid-cols-3 gap-4">
          {tiers.map((t, i) => (
            <motion.div
              key={t.name}
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: i * 0.06 }}
            >
              <GlassCard
                strong={t.featured}
                className={t.featured ? "border-amber-500/50" : ""}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium font-display">{t.name}</h3>
                  {t.featured && (
                    <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-1 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      Standard
                    </span>
                  )}
                </div>
                <div className="text-xs uppercase tracking-[0.2em] font-mono text-muted-foreground mt-1">
                  {t.tag}
                </div>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-semibold tracking-tight">{t.price}</span>
                  <span className="text-muted-foreground text-sm">{t.period}</span>
                </div>
                <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <BadgeCheck className="w-4 h-4 text-emerald-400" /> {f}
                    </li>
                  ))}
                </ul>
                <button
                  className={`mt-8 w-full py-2.5 rounded text-sm font-semibold transition ${t.featured ? "bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md" : "border border-border hover:border-amber-500/50 text-foreground"}`}
                >
                  {t.cta}
                </button>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FAQ() {
  const faqs = [
    {
      q: "How does the platform integrate with port TOS and customs systems?",
      a: "We ingest via EDI, REST or Kafka streams. Standard IMO FAL and WCO data models are natively mapped within 14 days.",
    },
    {
      q: "Where is sovereignty data stored?",
      a: "Hosted on sovereign national cloud infrastructure or on-prem air-gapped clusters for Port Authorities. All records comply with ISPS Level 1 security.",
    },
    {
      q: "Can national authorities deploy custom risk & clearance models?",
      a: "Yes. Custom ONNX, Python, or PyTorch models can be registered in the Directorate AI Registry and executed in real-time pipelines.",
    },
    {
      q: "What regulatory standards are certified?",
      a: "IMO FAL Form 1-7 compliance, ISPS Code Level 1, ISO 28000 supply chain security, and 99.99% mission-critical uptime SLA.",
    },
  ];
  return (
    <section id="faq" className="relative py-32 px-6 border-t border-border">
      <div className="max-w-3xl mx-auto">
        <SectionEyebrow>Operational Standards</SectionEyebrow>
        <SectionTitle>Authoritative specifications and interoperability.</SectionTitle>
        <div className="mt-14 space-y-3">
          {faqs.map((f, i) => (
            <motion.details
              key={f.q}
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: i * 0.05 }}
              className="glass p-5 rounded border border-border group [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex items-center justify-between cursor-pointer">
                <span className="font-medium text-foreground">{f.q}</span>
                <span className="text-amber-400 text-lg group-open:rotate-45 transition-transform">
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm text-muted-foreground">{f.a}</p>
            </motion.details>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Contact() {
  return (
    <section id="contact" className="relative py-32 px-6 border-t border-border">
      <div className="max-w-4xl mx-auto">
        <GlassCard strong className="p-10 md:p-14 text-center relative overflow-hidden border border-border">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-amber-500/10 blur-[100px] rounded-full" />
          <div className="relative">
            <SectionEyebrow>Directorate Deployment</SectionEyebrow>
            <h2 className="text-3xl md:text-5xl font-display font-semibold tracking-tight mt-3">
              Deploy Sovereign Port Operations
            </h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              Initiate bilateral deployment discussions with our maritime systems architecture group. Rapid integration across 10 port stakeholder roles.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href="mailto:operations@smartport.gov"
                className="px-6 py-3 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-md transition"
              >
                operations@smartport.gov
              </a>
              <a
                href="#pricing"
                className="px-6 py-3 rounded border border-border hover:border-amber-500/50 text-foreground transition"
              >
                Deployment Tiers
              </a>
            </div>
          </div>
        </GlassCard>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-border py-14 px-6 mt-12 bg-card/40">
      <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-8 text-sm">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300">
              <Anchor className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="font-display font-semibold text-sm uppercase">Global Maritime OS</span>
              <span className="text-[9px] font-mono tracking-widest text-muted-foreground uppercase">Port Directorate</span>
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
            International Maritime Logistics & Sovereign Port Operations System. Built for Port Authorities, Customs Directorates, and Marine Terminal Operators.
          </p>
        </div>
        {[
          { title: "Platform", links: ["Features", "Reference Architecture", "AI Models", "Compliance"] },
          { title: "Sovereign Workspaces", links: ["Port Authority", "Terminal Ops", "Shipping Lines", "Customs Directorate"] },
          { title: "Governance", links: ["IMO Standards", "ISPS Protocol", "Security Audit", "API Telemetry"] },
        ].map((col) => (
          <div key={col.title}>
            <div className="text-xs uppercase tracking-[0.2em] text-amber-400/80 font-mono">
              {col.title}
            </div>
            <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
              {col.links.map((l) => (
                <li key={l}>
                  <a href="#" className="hover:text-foreground transition">
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="max-w-6xl mx-auto mt-10 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-2">
        <div className="font-mono">IMO FAL COMPLIANT • ISPS LEVEL 1 • © {new Date().getFullYear()} GLOBAL MARITIME OS</div>
        <div className="flex items-center gap-4 font-mono">
          <a href="#" className="hover:text-amber-400">
            SECURITY PROTOCOL
          </a>
          <a href="#" className="hover:text-amber-400">
            AUDIT LOGS
          </a>
          <a href="#" className="hover:text-amber-400">
            SYSTEM STATUS: ONLINE
          </a>
        </div>
      </div>
    </footer>
  );
}

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs uppercase tracking-[0.24em] text-amber-400/90 font-mono">{children}</div>
  );
}
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mt-3 text-3xl md:text-5xl font-display font-semibold tracking-tight max-w-3xl">
      {children}
    </h2>
  );
}

// helper icons re-export for external usage
export const LandingIcons = { Activity, Ship, Container, Truck };
// Avoid unused imports warnings
void [Database, Zap, GitBranch];
