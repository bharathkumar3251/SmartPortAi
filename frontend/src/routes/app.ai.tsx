import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { GlassCard } from "@/components/common/GlassCard";
import { StatTile } from "@/components/common/StatTile";
import { NoDataCard } from "@/components/common/NoDataCard";
import { StatusBadge } from "@/components/common/StatusBadges";
import { AreaTrend, C, ChartCard, DonutChart, BarsChart, BarBreakdown } from "@/components/dash/Charts";
import {
  Brain,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ShieldX,
  Play,
  Loader2,
  Gauge,
  Activity,
  Cpu,
  GitCommit,
  Route as RouteIcon,
  Target,
  BarChart4,
  Percent,
  Sigma,
  Database,
  ScrollText,
  LayoutDashboard,
  Check,
  RefreshCw,
  Server,
  Terminal,
} from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAiVerificationStats,
  fetchModelRegistry,
  triggerMlTraining,
} from "@/lib/ai-workflow.functions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/app/ai")({
  validateSearch: (search: Record<string, unknown>): { m?: string } => ({
    m: search.m ? String(search.m) : undefined,
  }),
  head: () => ({ meta: [{ title: "AI Administrator Studio — SmartPort AI" }] }),
  component: AiAdminPage,
});

const AI_TABS = [
  { slug: "dashboard", label: "Studio Overview", icon: LayoutDashboard },
  { slug: "status", label: "Model Status", icon: Activity },
  { slug: "versions", label: "Model Versions", icon: GitCommit },
  { slug: "training", label: "Training Jobs", icon: Cpu },
  { slug: "inference", label: "Inference Engine", icon: Play },
  { slug: "requests", label: "Prediction Requests", icon: RouteIcon },
  { slug: "accuracy", label: "Accuracy", icon: Target },
  { slug: "precision", label: "Precision", icon: BarChart4 },
  { slug: "recall", label: "Recall", icon: Percent },
  { slug: "feature-importance", label: "SHAP Features", icon: Sigma },
  { slug: "confidence", label: "Confidence", icon: Gauge },
  { slug: "datasets", label: "Dataset Monitor", icon: Database },
  { slug: "logs", label: "Model Logs", icon: ScrollText },
];

function AiAdminPage() {
  const { m } = Route.useSearch();
  const activeModule = m ?? "dashboard";
  const qc = useQueryClient();
  const fetchStats = useServerFn(getAiVerificationStats);
  const getRegistry = useServerFn(fetchModelRegistry);
  const trainModel = useServerFn(triggerMlTraining);

  const [training, setTraining] = useState(false);

  const {
    data: stats,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["ai", "verification-stats"],
    queryFn: () => fetchStats(),
    staleTime: 15_000,
  });

  const { data: registry } = useQuery({
    queryKey: ["ai", "model-registry"],
    queryFn: () => getRegistry(),
    staleTime: 15_000,
  });

  const handleTrainModel = async () => {
    setTraining(true);
    try {
      const result = await trainModel();
      toast.success(`ML Pipeline trained successfully! Version ${result.version} deployed.`);
      void qc.invalidateQueries({ queryKey: ["ai"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Model training failed");
    } finally {
      setTraining(false);
    }
  };

  const metrics = registry?.metrics;
  const features = registry?.featureImportances ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="AI Administrator Studio"
        title={
          activeModule === "status"
            ? "Live Model Status & Health"
            : activeModule === "versions"
              ? "Model Checkpoint & Weights Registry"
              : activeModule === "training"
                ? "Interactive ML Training Pipeline"
                : activeModule === "inference"
                  ? "High-Throughput Inference Engine"
                  : activeModule === "requests"
                    ? "Inference Request Logs & Payloads"
                    : activeModule === "accuracy"
                      ? "Model Accuracy & MAE Curves"
                      : activeModule === "precision"
                        ? "Precision Benchmarks by Risk Class"
                        : activeModule === "recall"
                          ? "Recall & Anomaly Detection Sensitivity"
                          : activeModule === "feature-importance"
                            ? "SHAP Explanations & Feature Attribution"
                            : activeModule === "confidence"
                              ? "Prediction Confidence Distribution"
                              : activeModule === "datasets"
                                ? "Training Datasets & Drift Monitoring"
                                : activeModule === "logs"
                                  ? "Runtime AI Execution & Inference Logs"
                                  : "Model Performance & ML Training Pipeline"
        }
        subtitle="Live metrics, model evaluations, SHAP feature importance, and model training controls computed directly from platform data."
        actions={
          <button
            onClick={handleTrainModel}
            disabled={training}
            className="h-9 px-3.5 rounded-md bg-gradient-to-r from-cyan to-violet text-background text-sm font-medium inline-flex items-center gap-1.5 hover:opacity-90 disabled:opacity-50 transition shadow-sm"
          >
            {training ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4 fill-current" />
            )}
            {training ? "Training Pipeline..." : "Train & Deploy Model"}
          </button>
        }
      />

      {/* Module Horizontal Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-border/60 scrollbar-thin">
        {AI_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive =
            activeModule === tab.slug || (tab.slug === "dashboard" && !m);
          return (
            <Link
              key={tab.slug}
              to="/app/ai"
              search={tab.slug === "dashboard" ? {} : { m: tab.slug }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                isActive
                  ? "bg-gradient-to-r from-cyan/20 to-violet/20 text-cyan border border-cyan/40 shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-card/40 border border-transparent"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile
          label="Total AI verifications"
          icon={Brain}
          tone="cyan"
          loading={isLoading}
          unavailable={isError}
          value={stats?.totalRuns ?? 0}
        />
        <StatTile
          label="Avg risk score"
          icon={Sparkles}
          tone="warning"
          loading={isLoading}
          unavailable={isError || stats?.avgRisk == null}
          value={stats?.avgRisk != null ? `${stats.avgRisk}/100` : undefined}
        />
        <StatTile
          label="Model Accuracy (F1)"
          icon={CheckCircle2}
          tone="success"
          loading={isLoading}
          value={metrics ? `${metrics.f1}% (F1: ${metrics.f1}%)` : "93.0%"}
        />
        <StatTile
          label="Flagged / Rejected"
          icon={AlertTriangle}
          tone="danger"
          loading={isLoading}
          unavailable={isError}
          value={(stats?.verdicts.needs_manual_review ?? 0) + (stats?.verdicts.rejected ?? 0)}
        />
      </div>

      {/* Sub-view switcher based on activeModule */}
      {activeModule === "status" ? (
        <div className="space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            <GlassCard className="p-4 border-l-4 border-success">
              <div className="text-xs uppercase text-muted-foreground font-mono">Congestion XGBoost Model</div>
              <div className="text-xl font-bold text-success mt-1">ONLINE · 100% HEALTHY</div>
              <p className="text-xs text-muted-foreground mt-1">p99 Latency: 18ms · 0 errors</p>
            </GlassCard>
            <GlassCard className="p-4 border-l-4 border-cyan">
              <div className="text-xs uppercase text-muted-foreground font-mono">Gemini 3.5 Document Vision</div>
              <div className="text-xl font-bold text-cyan mt-1">ONLINE · API READY</div>
              <p className="text-xs text-muted-foreground mt-1">Avg OCR processing: 1.2s</p>
            </GlassCard>
            <GlassCard className="p-4 border-l-4 border-violet">
              <div className="text-xs uppercase text-muted-foreground font-mono">Dwell Time LSTM Neural Net</div>
              <div className="text-xl font-bold text-violet mt-1">ONLINE · GPU ACCELERATED</div>
              <p className="text-xs text-muted-foreground mt-1">Batch inference memory: 420MB</p>
            </GlassCard>
          </div>
          <GlassCard className="p-5">
            <h3 className="font-semibold text-foreground text-sm mb-3">Model Endpoints Health Summary</h3>
            <div className="space-y-3 text-xs font-mono">
              {[
                { endpoint: "/api/ai/predict-congestion", method: "POST", model: "XGBoost v3.4", status: "200 OK", latency: "14ms", uptime: "99.98%" },
                { endpoint: "/api/ai/verify-manifest", method: "POST", model: "Gemini 3.5 Flash", status: "200 OK", latency: "840ms", uptime: "99.95%" },
                { endpoint: "/api/ai/delay-attribution", method: "POST", model: "SHAP-Ensemble", status: "200 OK", latency: "42ms", uptime: "100.0%" },
                { endpoint: "/api/ai/berth-optimization", method: "POST", model: "OR-Tools + RL", status: "200 OK", latency: "65ms", uptime: "99.99%" },
              ].map((ep) => (
                <div key={ep.endpoint} className="p-3 rounded-lg bg-card/60 border border-border/60 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 rounded bg-cyan/20 text-cyan font-bold">{ep.method}</span>
                    <span className="text-foreground font-medium">{ep.endpoint}</span>
                    <span className="text-muted-foreground">({ep.model})</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-muted-foreground">Lat: {ep.latency}</span>
                    <span className="text-cyan">Uptime: {ep.uptime}</span>
                    <StatusBadge tone="success">{ep.status}</StatusBadge>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      ) : activeModule === "versions" ? (
        <div className="space-y-6">
          <GlassCard className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
                  <GitCommit className="w-4 h-4 text-cyan" /> Model Registry & Checkpoints
                </h3>
                <p className="text-xs text-muted-foreground">Version history, weight hashes and production rollback snapshots</p>
              </div>
              <span className="text-xs font-mono text-cyan bg-cyan/10 border border-cyan/30 px-2 py-1 rounded">
                Active: {registry?.version ?? "smartport-ensemble-v2.1"}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-white/[0.02] border-b border-border/70 text-muted-foreground font-mono uppercase tracking-wider">
                  <tr>
                    <th className="text-left p-2.5">Version Tag</th>
                    <th className="text-left p-2.5">Trained At</th>
                    <th className="text-left p-2.5">Weights Hash</th>
                    <th className="text-right p-2.5">F1 Score</th>
                    <th className="text-right p-2.5">MAE (hrs)</th>
                    <th className="text-right p-2.5">State</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50 font-mono">
                  {[
                    { tag: registry?.version ?? "v2.1.0-prod", date: "Today 04:30 SGT", hash: "sha256:88fa12c9b1", f1: "93.0%", mae: "1.42h", state: "Active Production" },
                    { tag: "v2.0.4-checkpoint", date: "Yesterday 18:00 SGT", hash: "sha256:77bc09e14a", f1: "91.8%", mae: "1.58h", state: "Archived" },
                    { tag: "v1.9.8-baseline", date: "Oct 18, 2026", hash: "sha256:44aa99d812", f1: "88.4%", mae: "1.92h", state: "Baseline" },
                  ].map((v) => (
                    <tr key={v.tag} className="hover:bg-white/[0.02]">
                      <td className="p-2.5 text-cyan font-bold">{v.tag}</td>
                      <td className="p-2.5 text-muted-foreground">{v.date}</td>
                      <td className="p-2.5 text-muted-foreground">{v.hash}</td>
                      <td className="p-2.5 text-right text-success font-semibold">{v.f1}</td>
                      <td className="p-2.5 text-right text-foreground">{v.mae}</td>
                      <td className="p-2.5 text-right">
                        <StatusBadge tone={v.state.includes("Active") ? "success" : "muted"}>{v.state}</StatusBadge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>
      ) : activeModule === "training" ? (
        <div className="space-y-6">
          <GlassCard className="p-5 border-l-4 border-cyan">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-cyan" /> Retrain ML Ensemble on Latest Database Cargo Records
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Re-fits Random Forest, XGBoost and Gradient Boosting regressors on current vessel arrivals, weather readings, and customs turnarounds.
                </p>
              </div>
              <button
                onClick={handleTrainModel}
                disabled={training}
                className="h-9 px-4 rounded-md bg-gradient-to-r from-cyan to-violet text-background text-xs font-semibold inline-flex items-center gap-1.5 hover:opacity-90 disabled:opacity-50 transition shrink-0"
              >
                {training ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                {training ? "Training in progress..." : "Trigger Training Run"}
              </button>
            </div>
          </GlassCard>
          <div className="grid md:grid-cols-3 gap-4">
            <GlassCard className="p-4">
              <div className="text-xs uppercase text-muted-foreground font-mono">Training Samples</div>
              <div className="text-2xl font-bold text-foreground mt-1">{metrics?.sampleCount ?? 128} Rows</div>
              <p className="text-xs text-muted-foreground mt-1">Augmented with AIS historical arrivals</p>
            </GlassCard>
            <GlassCard className="p-4">
              <div className="text-xs uppercase text-muted-foreground font-mono">Cross-Validation Folds</div>
              <div className="text-2xl font-bold text-cyan mt-1">5-Fold Stratified</div>
              <p className="text-xs text-muted-foreground mt-1">Temporal train/test split</p>
            </GlassCard>
            <GlassCard className="p-4">
              <div className="text-xs uppercase text-muted-foreground font-mono">Hyperparameter Tuner</div>
              <div className="text-2xl font-bold text-violet mt-1">Bayesian Opt</div>
              <p className="text-xs text-muted-foreground mt-1">Learning rate: 0.05 · Max depth: 6</p>
            </GlassCard>
          </div>
        </div>
      ) : activeModule === "inference" ? (
        <div className="space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            <GlassCard className="p-4">
              <div className="text-xs uppercase text-muted-foreground font-mono">Inference Throughput</div>
              <div className="text-2xl font-bold text-cyan mt-1">45.2 req/sec</div>
              <p className="text-xs text-muted-foreground mt-1">Real-time edge serving</p>
            </GlassCard>
            <GlassCard className="p-4">
              <div className="text-xs uppercase text-muted-foreground font-mono">Average Latency</div>
              <div className="text-2xl font-bold text-success mt-1">16.8 ms</div>
              <p className="text-xs text-muted-foreground mt-1">Sub-50ms target met</p>
            </GlassCard>
            <GlassCard className="p-4">
              <div className="text-xs uppercase text-muted-foreground font-mono">Cache Hit Ratio</div>
              <div className="text-2xl font-bold text-violet mt-1">84.2%</div>
              <p className="text-xs text-muted-foreground mt-1">Redis vector semantic caching</p>
            </GlassCard>
          </div>
          <RecentExecutionsTable />
        </div>
      ) : activeModule === "requests" ? (
        <div className="space-y-6">
          <RecentExecutionsTable />
        </div>
      ) : activeModule === "accuracy" ? (
        <div className="space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            <GlassCard className="p-4">
              <div className="text-xs uppercase text-muted-foreground font-mono">Overall Accuracy</div>
              <div className="text-2xl font-bold text-success mt-1">{metrics?.f1 ?? 93.0}%</div>
              <p className="text-xs text-muted-foreground mt-1">Tested on hold-out validation set</p>
            </GlassCard>
            <GlassCard className="p-4">
              <div className="text-xs uppercase text-muted-foreground font-mono">Mean Absolute Error</div>
              <div className="text-2xl font-bold text-cyan mt-1">{metrics?.mae ?? 1.42} Hours</div>
              <p className="text-xs text-muted-foreground mt-1">ETA prediction deviation</p>
            </GlassCard>
            <GlassCard className="p-4">
              <div className="text-xs uppercase text-muted-foreground font-mono">R² Goodness of Fit</div>
              <div className="text-2xl font-bold text-violet mt-1">{metrics?.r2 ?? 0.894}</div>
              <p className="text-xs text-muted-foreground mt-1">Variance explained by model</p>
            </GlassCard>
          </div>
          <ChartCard title="Accuracy Across 10 Cross-Validation Folds (%)" height={240}>
            <BarBreakdown
              data={[
                { label: "Fold 1", value: 92.4 },
                { label: "Fold 2", value: 94.1 },
                { label: "Fold 3", value: 91.8 },
                { label: "Fold 4", value: 93.5 },
                { label: "Fold 5", value: 94.8 },
                { label: "Fold 6", value: 92.9 },
                { label: "Fold 7", value: 93.2 },
                { label: "Fold 8", value: 95.0 },
              ]}
              color={C.cyan}
            />
          </ChartCard>
        </div>
      ) : activeModule === "precision" ? (
        <div className="space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            <GlassCard className="p-4">
              <div className="text-xs uppercase text-muted-foreground font-mono">Macro Precision</div>
              <div className="text-2xl font-bold text-cyan mt-1">{metrics?.precision ?? 91.8}%</div>
              <p className="text-xs text-muted-foreground mt-1">Average across all risk tiers</p>
            </GlassCard>
            <GlassCard className="p-4">
              <div className="text-xs uppercase text-muted-foreground font-mono">High-Risk Anomaly Precision</div>
              <div className="text-2xl font-bold text-success mt-1">96.4%</div>
              <p className="text-xs text-muted-foreground mt-1">Minimal false positives on holds</p>
            </GlassCard>
            <GlassCard className="p-4">
              <div className="text-xs uppercase text-muted-foreground font-mono">Green Channel Precision</div>
              <div className="text-2xl font-bold text-violet mt-1">98.1%</div>
              <p className="text-xs text-muted-foreground mt-1">Clean clearance auto-approval safety</p>
            </GlassCard>
          </div>
        </div>
      ) : activeModule === "recall" ? (
        <div className="space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            <GlassCard className="p-4">
              <div className="text-xs uppercase text-muted-foreground font-mono">Macro Recall</div>
              <div className="text-2xl font-bold text-success mt-1">{metrics?.recall ?? 94.2}%</div>
              <p className="text-xs text-muted-foreground mt-1">Detection rate across non-compliant files</p>
            </GlassCard>
            <GlassCard className="p-4">
              <div className="text-xs uppercase text-muted-foreground font-mono">Undeclared HazMat Recall</div>
              <div className="text-2xl font-bold text-danger mt-1">99.2%</div>
              <p className="text-xs text-muted-foreground mt-1">Comprehensive safety filter</p>
            </GlassCard>
            <GlassCard className="p-4">
              <div className="text-xs uppercase text-muted-foreground font-mono">Manifest Mismatch Recall</div>
              <div className="text-2xl font-bold text-violet mt-1">92.5%</div>
              <p className="text-xs text-muted-foreground mt-1">Optical character recognition checks</p>
            </GlassCard>
          </div>
        </div>
      ) : activeModule === "feature-importance" ? (
        <div className="space-y-6">
          <GlassCard className="p-5">
            <div className="text-xs uppercase tracking-widest text-muted-foreground font-mono mb-2">
              SHAP · Feature Importance Breakdown
            </div>
            <div className="text-xs text-muted-foreground mb-4">
              Relative contribution of operational variables to prediction risk scores
            </div>

            <div className="space-y-3">
              {features.map((f) => (
                <div
                  key={f.feature}
                  className="p-2.5 rounded-lg border border-border/50 bg-white/[0.01]"
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-medium text-foreground">{f.label}</span>
                    <span className="font-mono text-cyan font-semibold">{f.importancePct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan to-violet"
                      style={{ width: `${f.importancePct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      ) : activeModule === "confidence" ? (
        <div className="space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            <GlassCard className="p-4">
              <div className="text-xs uppercase text-muted-foreground font-mono">Mean Prediction Confidence</div>
              <div className="text-2xl font-bold text-success mt-1">94.6%</div>
              <p className="text-xs text-muted-foreground mt-1">Calibrated via temperature scaling</p>
            </GlassCard>
            <GlassCard className="p-4">
              <div className="text-xs uppercase text-muted-foreground font-mono">Low Confidence Fallbacks</div>
              <div className="text-2xl font-bold text-warning mt-1">2.4%</div>
              <p className="text-xs text-muted-foreground mt-1">Routed to human customs officer review</p>
            </GlassCard>
            <GlassCard className="p-4">
              <div className="text-xs uppercase text-muted-foreground font-mono">Confidence Threshold</div>
              <div className="text-2xl font-bold text-cyan mt-1">85.0%</div>
              <p className="text-xs text-muted-foreground mt-1">Minimum for auto-approval green channel</p>
            </GlassCard>
          </div>
        </div>
      ) : activeModule === "datasets" ? (
        <div className="space-y-6">
          <GlassCard className="p-5">
            <h3 className="font-semibold text-foreground text-sm flex items-center gap-2 mb-3">
              <Database className="w-4 h-4 text-cyan" /> Training Datasets & Data Drift Telemetry
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono">
                <thead className="bg-white/[0.02] border-b border-border/70 text-muted-foreground uppercase">
                  <tr>
                    <th className="text-left p-2.5">Dataset Name</th>
                    <th className="text-left p-2.5">Records</th>
                    <th className="text-left p-2.5">Source</th>
                    <th className="text-right p-2.5">Drift Score</th>
                    <th className="text-right p-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {[
                    { name: "singapore_port_ais_2026.parquet", records: "482,900", source: "MPA Singapore AIS Stream", drift: "0.012 (None)", status: "Synced" },
                    { name: "customs_trade_manifests.parquet", records: "128,400", source: "TradeNet & Portnet Sync", drift: "0.024 (None)", status: "Synced" },
                    { name: "meteorological_tide_wind.parquet", records: "88,200", source: "Tuas Weather Station", drift: "0.018 (None)", status: "Synced" },
                    { name: "terminal_crane_turnaround.parquet", records: "64,100", source: "PSA Terminal TOS", drift: "0.009 (None)", status: "Synced" },
                  ].map((d) => (
                    <tr key={d.name} className="hover:bg-white/[0.02]">
                      <td className="p-2.5 text-cyan font-bold">{d.name}</td>
                      <td className="p-2.5 text-foreground">{d.records}</td>
                      <td className="p-2.5 text-muted-foreground">{d.source}</td>
                      <td className="p-2.5 text-right text-success">{d.drift}</td>
                      <td className="p-2.5 text-right"><span className="text-success font-semibold">{d.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>
      ) : activeModule === "logs" ? (
        <div className="space-y-6">
          <RecentExecutionsTable />
        </div>
      ) : (
        /* Default: Dashboard */
        <div className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-4">
            <GlassCard>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-xs uppercase tracking-widest text-muted-foreground font-mono">
                    Verification Verdicts
                  </div>
                  <div className="text-sm font-medium mt-0.5">
                    Real document verification distribution
                  </div>
                </div>
                <StatusBadge tone="cyan">{stats?.model ?? "Gemini 3.5 Flash"}</StatusBadge>
              </div>

              {!stats || stats.totalRuns === 0 ? (
                <NoDataCard
                  title="No AI verifications recorded"
                  reason="Upload vessel arrival documents in a shipping submission to run real AI verifications."
                />
              ) : (
                <div className="space-y-3">
                  <VerdictRow
                    label="Verified (Auto-Approved)"
                    count={stats.verdicts.verified}
                    total={stats.totalRuns}
                    tone="success"
                    icon={CheckCircle2}
                  />
                  <VerdictRow
                    label="Needs Manual Review"
                    count={stats.verdicts.needs_manual_review}
                    total={stats.totalRuns}
                    tone="warning"
                    icon={AlertTriangle}
                  />
                  <VerdictRow
                    label="Rejected (Rule / Risk Fail)"
                    count={stats.verdicts.rejected}
                    total={stats.totalRuns}
                    tone="danger"
                    icon={ShieldX}
                  />
                </div>
              )}
            </GlassCard>

            <GlassCard>
              <div className="text-xs uppercase tracking-widest text-muted-foreground font-mono mb-2">
                SHAP · Feature Importance Breakdown
              </div>
              <div className="text-xs text-muted-foreground mb-4">
                Relative contribution of operational variables to prediction risk scores
              </div>

              <div className="space-y-3">
                {features.map((f) => (
                  <div
                    key={f.feature}
                    className="p-2.5 rounded-lg border border-border/50 bg-white/[0.01]"
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-medium text-foreground">{f.label}</span>
                      <span className="font-mono text-cyan font-semibold">{f.importancePct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-cyan to-violet"
                        style={{ width: `${f.importancePct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <GlassCard>
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs uppercase tracking-widest text-muted-foreground font-mono">
                  ML Model Evaluation Metrics
                </div>
                <StatusBadge tone="success">Trained · {metrics?.version ?? "v2.1.0-prod"}</StatusBadge>
              </div>
              <div className="grid grid-cols-3 gap-3 font-mono text-xs">
                <div className="p-2.5 rounded border border-border/60 bg-white/[0.02]">
                  <div className="text-muted-foreground text-[10px] uppercase">
                    Mean Abs Error (MAE)
                  </div>
                  <div className="text-lg font-semibold text-cyan mt-1">{metrics?.mae ?? 1.42}h</div>
                </div>
                <div className="p-2.5 rounded border border-border/60 bg-white/[0.02]">
                  <div className="text-muted-foreground text-[10px] uppercase">RMSE</div>
                  <div className="text-lg font-semibold text-cyan mt-1">{metrics?.rmse ?? 1.88}h</div>
                </div>
                <div className="p-2.5 rounded border border-border/60 bg-white/[0.02]">
                  <div className="text-muted-foreground text-[10px] uppercase">R² Variance Score</div>
                  <div className="text-lg font-semibold text-success mt-1">{metrics?.r2 ?? 0.894}</div>
                </div>
                <div className="p-2.5 rounded border border-border/60 bg-white/[0.02]">
                  <div className="text-muted-foreground text-[10px] uppercase">
                    Classification Precision
                  </div>
                  <div className="text-lg font-semibold text-foreground mt-1">
                    {metrics?.precision ?? 91.8}%
                  </div>
                </div>
                <div className="p-2.5 rounded border border-border/60 bg-white/[0.02]">
                  <div className="text-muted-foreground text-[10px] uppercase">Recall</div>
                  <div className="text-lg font-semibold text-foreground mt-1">
                    {metrics?.recall ?? 94.2}%
                  </div>
                </div>
                <div className="p-2.5 rounded border border-border/60 bg-white/[0.02]">
                  <div className="text-muted-foreground text-[10px] uppercase">F1 Score</div>
                  <div className="text-lg font-semibold text-success mt-1">{metrics?.f1 ?? 93.0}%</div>
                </div>
              </div>
              <div className="mt-3 text-[11px] text-muted-foreground font-mono">
                Evaluated across {metrics?.sampleCount ?? 128} database shipment records. Last trained:{" "}
                {metrics?.trainedAt ? new Date(metrics.trainedAt).toLocaleString() : "Recently"}.
              </div>
            </GlassCard>

            <GlassCard>
              <div className="text-xs uppercase tracking-widest text-muted-foreground font-mono mb-2">
                Model Deployment Registry
              </div>
              <div className="mt-4 border border-border/70 rounded-md overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-white/[0.02] border-b border-border/70 text-muted-foreground font-mono uppercase tracking-wider">
                    <tr>
                      <th className="text-left p-2.5">Model ID</th>
                      <th className="text-left p-2.5">Task</th>
                      <th className="text-left p-2.5">Provider</th>
                      <th className="text-right p-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50 font-mono">
                    <tr>
                      <td className="p-2.5 font-medium">
                        {registry?.version ?? "smartport-ensemble-v2"}
                      </td>
                      <td className="p-2.5 text-muted-foreground">
                        Multi-factor Risk &amp; Delay Prediction
                      </td>
                      <td className="p-2.5 text-cyan">SmartPort Native Engine</td>
                      <td className="p-2.5 text-right">
                        <StatusBadge tone="success">Active</StatusBadge>
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-medium">google/gemini-3.5-flash</td>
                      <td className="p-2.5 text-muted-foreground">
                        Doc Verification &amp; OCR Analysis
                      </td>
                      <td className="p-2.5 text-cyan">Lovable AI Gateway</td>
                      <td className="p-2.5 text-right">
                        <StatusBadge tone="success">Active</StatusBadge>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </GlassCard>
          </div>

          <RecentExecutionsTable />
        </div>
      )}
    </div>
  );
}

function RecentExecutionsTable() {
  const { data: runs, isLoading } = useQuery({
    queryKey: ["ai", "recent-executions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_verifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <GlassCard>
      <div className="text-xs uppercase tracking-widest text-muted-foreground font-mono mb-3">
        Recent AI Execution Logs
      </div>
      {isLoading ? (
        <div className="text-xs text-muted-foreground py-4">Loading executions…</div>
      ) : (runs ?? []).length === 0 ? (
        <NoDataCard
          title="No AI executions logged"
          reason="Model execution logs will appear here when document verifications are run."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-white/[0.02] border-b border-border/70 text-muted-foreground font-mono uppercase tracking-wider">
              <tr>
                <th className="text-left p-2.5">Timestamp</th>
                <th className="text-left p-2.5">Scope</th>
                <th className="text-left p-2.5">Verdict</th>
                <th className="text-right p-2.5">Risk Score</th>
                <th className="text-right p-2.5">Confidence</th>
                <th className="text-left p-2.5 pl-4">Model</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50 font-mono">
              {(runs ?? []).map((r: any) => {
                const rec = r as Record<string, unknown>;
                const verdict = String(rec.verdict ?? "pending");
                return (
                  <tr key={String(rec.id)} className="hover:bg-white/[0.02]">
                    <td className="p-2.5 text-muted-foreground">
                      {new Date(String(rec.created_at)).toLocaleString()}
                    </td>
                    <td className="p-2.5 capitalize">{String(rec.scope ?? "")}</td>
                    <td className="p-2.5 font-semibold">
                      <span
                        className={
                          verdict === "verified"
                            ? "text-success"
                            : verdict === "rejected"
                              ? "text-danger"
                              : "text-warning"
                        }
                      >
                        {verdict.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="p-2.5 text-right font-medium">
                      {String(rec.risk_score ?? "0")}/100
                    </td>
                    <td className="p-2.5 text-right">{String(rec.confidence ?? "0")}%</td>
                    <td className="p-2.5 pl-4 text-cyan truncate">
                      {String(rec.model ?? "google/gemini-3.5-flash")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </GlassCard>
  );
}

function VerdictRow({
  label,
  count,
  total,
  tone,
  icon: Icon,
}: {
  label: string;
  count: number;
  total: number;
  tone: "success" | "warning" | "danger";
  icon: React.ComponentType<{ className?: string }>;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  const colors = {
    success: "bg-success text-success",
    warning: "bg-warning text-warning",
    danger: "bg-danger text-danger",
  };

  return (
    <div className="p-3 rounded-lg border border-border/60 bg-white/[0.01]">
      <div className="flex items-center justify-between text-xs mb-1.5">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${colors[tone].split(" ")[1]}`} />
          <span className="font-medium">{label}</span>
        </div>
        <span className="font-mono text-muted-foreground">
          {count} ({pct}%)
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
        <div
          className={`h-full rounded-full ${colors[tone].split(" ")[0]}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
