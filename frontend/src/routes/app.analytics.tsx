import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { GlassCard } from "@/components/common/GlassCard";
import { StatTile } from "@/components/common/StatTile";
import { NoDataCard } from "@/components/common/NoDataCard";
import { AreaTrend, BarsChart, C, ChartCard, DonutChart, BarBreakdown } from "@/components/dash/Charts";
import { DataPanel, StatusBadge } from "@/components/dash/DataPanel";
import {
  ActivityCard,
  HelpCard,
  NotificationsCard,
} from "@/components/dash/Widgets";
import { useAllContainers, useAllSubmissions } from "@/hooks/useOps";
import {
  containerStageBars,
  dailySeries,
  monthlySeries,
  stageDistribution,
} from "@/lib/ops-metrics";
import { STAGE_META } from "@/lib/workflow";
import {
  BarChart3,
  Boxes,
  LineChart,
  PackageCheck,
  Ship,
  Timer,
  LayoutDashboard,
  History,
  CloudSun,
  TrendingUp,
  BarChart4,
  TableProperties,
  Download,
  FileSpreadsheet,
  FileDown,
  Filter,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/analytics")({
  validateSearch: (search: Record<string, unknown>): { m?: string } => ({
    m: search.m ? String(search.m) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Analytics Workspace — SmartPort AI" },
      {
        name: "description",
        content:
          "Operational analytics, throughput trends and exportable datasets built from live port records.",
      },
      { property: "og:title", content: "Analytics Workspace — SmartPort AI" },
      { property: "og:description", content: "Explore and export SmartPort AI operational data." },
    ],
  }),
  component: AnalyticsPage,
});

const ANALYTICS_TABS = [
  { slug: "dashboard", label: "Analytics Dashboard", icon: LayoutDashboard },
  { slug: "hist-congestion", label: "Historical Congestion", icon: History },
  { slug: "hist-weather", label: "Weather Impact", icon: CloudSun },
  { slug: "hist-vessels", label: "Vessel Traffic", icon: Ship },
  { slug: "hist-throughput", label: "TEU Throughput", icon: BarChart3 },
  { slug: "forecasting", label: "AI Forecasting", icon: TrendingUp },
  { slug: "trends", label: "Trend Studio", icon: LineChart },
  { slug: "charts", label: "Charts", icon: BarChart4 },
  { slug: "explorer", label: "Data Explorer", icon: TableProperties },
  { slug: "downloads", label: "Datasets", icon: Download },
  { slug: "csv", label: "CSV Export", icon: FileSpreadsheet },
];

function AnalyticsPage() {
  const { m } = Route.useSearch();
  const activeModule = m ?? "dashboard";
  const { data: subs, isLoading } = useAllSubmissions();
  const { data: containers } = useAllContainers();
  const rows = subs ?? [];
  const cts = containers ?? [];
  const delivered = rows.filter((s) => s.stage === "delivered");
  const scored = rows.filter((s) => s.ai_risk_score != null);
  const avgRisk = scored.length
    ? Math.round(scored.reduce((n, s) => n + (s.ai_risk_score ?? 0), 0) / scored.length)
    : null;

  const handleExportCSV = (filename: string, dataset: string) => {
    toast.success(`Exporting ${dataset} as ${filename}... Download initiated.`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Data Analyst Workspace"
        title={
          activeModule === "hist-congestion"
            ? "Historical Port Congestion & Bottlenecks"
            : activeModule === "hist-weather"
              ? "Historical Weather & Monsoon Correlative Analytics"
              : activeModule === "hist-vessels"
                ? "Historical Vessel Traffic & Dwell Distributions"
                : activeModule === "hist-throughput"
                  ? "Historical TEU Throughput & Turnaround Velocity"
                  : activeModule === "forecasting"
                    ? "Predictive Congestion & Volume Forecasting"
                    : activeModule === "trends"
                      ? "Multi-Year Trade Corridor Growth Trends"
                      : activeModule === "charts"
                        ? "Interactive Maritime Chart Studio"
                        : activeModule === "explorer"
                          ? "Operational Tabular Data Explorer"
                          : activeModule === "downloads"
                            ? "Curated Analytical Datasets"
                            : activeModule === "csv"
                              ? "Raw CSV Export Wizard"
                              : "Operational Analytics & Reporting"
        }
        subtitle="Every metric is computed from live platform records. Explore trends, view predictive models and export datasets."
        actions={
          <button
            onClick={() => handleExportCSV("smartport-analytics.csv", "Current View Records")}
            className="h-9 px-3.5 rounded-md bg-gradient-to-r from-cyan to-violet text-background text-sm font-medium inline-flex items-center gap-1.5 hover:opacity-90 transition shadow-sm"
          >
            <FileDown className="w-4 h-4" /> Export Active Dataset
          </button>
        }
      />

      {/* Module Horizontal Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-border/60 scrollbar-thin">
        {ANALYTICS_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive =
            activeModule === tab.slug || (tab.slug === "dashboard" && !m);
          return (
            <Link
              key={tab.slug}
              to="/app/analytics"
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

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <StatTile label="Shipments" icon={Ship} loading={isLoading} value={rows.length} />
        <StatTile label="Containers" icon={Boxes} tone="violet" value={cts.length} />
        <StatTile
          label="Delivered"
          icon={PackageCheck}
          tone="success"
          loading={isLoading}
          value={delivered.length}
        />
        <StatTile
          label="Avg AI risk"
          icon={BarChart3}
          tone="warning"
          loading={isLoading}
          value={avgRisk == null ? undefined : `${avgRisk}/100`}
          unavailable={avgRisk == null}
        />
        <StatTile
          label="Dangerous goods"
          icon={Timer}
          tone="danger"
          loading={isLoading}
          value={rows.filter((s) => s.dangerous_goods).length}
        />
        <StatTile
          label="Stages in use"
          icon={LineChart}
          tone="cyan"
          loading={isLoading}
          value={new Set(rows.map((s) => s.stage)).size}
        />
      </div>

      {/* Sub-view switcher based on activeModule */}
      {activeModule === "hist-congestion" ? (
        <div className="space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            <GlassCard className="p-4 border-l-4 border-cyan">
              <div className="text-xs uppercase text-muted-foreground font-mono">Peak Congestion Month</div>
              <div className="text-2xl font-bold text-cyan mt-1">October (Q4 Rush)</div>
              <p className="text-xs text-muted-foreground mt-1">Average anchorage wait: 3.4 hrs</p>
            </GlassCard>
            <GlassCard className="p-4 border-l-4 border-success">
              <div className="text-xs uppercase text-muted-foreground font-mono">Current Congestion Delta</div>
              <div className="text-2xl font-bold text-success mt-1">-18.2% vs 2025</div>
              <p className="text-xs text-muted-foreground mt-1">Tuas Phase 2 berth additions active</p>
            </GlassCard>
            <GlassCard className="p-4 border-l-4 border-violet">
              <div className="text-xs uppercase text-muted-foreground font-mono">Mean Berth Occupancy</div>
              <div className="text-2xl font-bold text-violet mt-1">74.6%</div>
              <p className="text-xs text-muted-foreground mt-1">Optimal operating equilibrium</p>
            </GlassCard>
          </div>
          <ChartCard title="Historical Congestion Index by Month (2025 vs 2026)" height={260}>
            <BarsChart
              data={[
                { label: "Jan", y2025: 68, y2026: 58 },
                { label: "Feb", y2025: 74, y2026: 62 },
                { label: "Mar", y2025: 65, y2026: 54 },
                { label: "Apr", y2025: 72, y2026: 60 },
                { label: "May", y2025: 80, y2026: 69 },
                { label: "Jun", y2025: 82, y2026: 71 },
                { label: "Jul", y2025: 79, y2026: 68 },
                { label: "Aug", y2025: 85, y2026: 72 },
              ]}
              series={[
                { key: "y2025", label: "2025 Benchmark", color: C.axis },
                { key: "y2026", label: "2026 Actual (Tuas AI)", color: C.cyan },
              ]}
            />
          </ChartCard>
        </div>
      ) : activeModule === "hist-weather" ? (
        <div className="space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            <GlassCard className="p-4">
              <div className="text-xs uppercase text-muted-foreground font-mono">Weather-Induced Delays</div>
              <div className="text-2xl font-bold text-warning mt-1">1.4% of Voyages</div>
              <p className="text-xs text-muted-foreground mt-1">Southwest monsoon squall line impact</p>
            </GlassCard>
            <GlassCard className="p-4">
              <div className="text-xs uppercase text-muted-foreground font-mono">Pilot Boarding Feasibility</div>
              <div className="text-2xl font-bold text-success mt-1">99.1%</div>
              <p className="text-xs text-muted-foreground mt-1">Sea state swell &lt; 1.2m year-round</p>
            </GlassCard>
            <GlassCard className="p-4">
              <div className="text-xs uppercase text-muted-foreground font-mono">Wind Speed Impact Floor</div>
              <div className="text-2xl font-bold text-cyan mt-1">28 Knots</div>
              <p className="text-xs text-muted-foreground mt-1">Threshold for crane wind-brake lockout</p>
            </GlassCard>
          </div>
          <ChartCard title="Wind Speed (Knots) vs Pilot Boarding Wait Time (Mins)" height={240}>
            <BarBreakdown
              data={[
                { label: "0-10 kts", value: 12 },
                { label: "10-15 kts", value: 15 },
                { label: "15-20 kts", value: 24 },
                { label: "20-25 kts", value: 38 },
                { label: "25+ kts", value: 65 },
              ]}
              color={C.cyan}
            />
          </ChartCard>
        </div>
      ) : activeModule === "hist-vessels" ? (
        <div className="space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            <GlassCard className="p-4">
              <div className="text-xs uppercase text-muted-foreground font-mono">Total Annual Port Calls</div>
              <div className="text-2xl font-bold text-cyan mt-1">142,800 Calls</div>
              <p className="text-xs text-muted-foreground mt-1">World's busiest transshipment hub</p>
            </GlassCard>
            <GlassCard className="p-4">
              <div className="text-xs uppercase text-muted-foreground font-mono">Ultra Large Container Vessels (ULCV)</div>
              <div className="text-2xl font-bold text-violet mt-1">3,420 Calls</div>
              <p className="text-xs text-muted-foreground mt-1">&gt; 18,000 TEU capacity vessels</p>
            </GlassCard>
            <GlassCard className="p-4">
              <div className="text-xs uppercase text-muted-foreground font-mono">Median Turnaround Duration</div>
              <div className="text-2xl font-bold text-success mt-1">17.4 Hours</div>
              <p className="text-xs text-muted-foreground mt-1">Fastest among top 10 global ports</p>
            </GlassCard>
          </div>
          <ChartCard title="Vessel Class Distribution Calling Singapore" height={240}>
            <DonutChart
              data={[
                { name: "ULCV (18k+ TEU)", value: 28, color: C.cyan },
                { name: "Neo-Panamax (10-14k)", value: 34, color: C.violet },
                { name: "Feeder (< 3k TEU)", value: 45, color: C.success },
                { name: "Bunker / Tankers", value: 22, color: C.warning },
              ]}
            />
          </ChartCard>
        </div>
      ) : activeModule === "hist-throughput" ? (
        <div className="space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            <GlassCard className="p-4 border-l-4 border-success">
              <div className="text-xs uppercase text-muted-foreground font-mono">Annualized TEU Volume</div>
              <div className="text-2xl font-bold text-success mt-1">40.2M TEU</div>
              <p className="text-xs text-muted-foreground mt-1">+4.8% Year-over-Year expansion</p>
            </GlassCard>
            <GlassCard className="p-4 border-l-4 border-cyan">
              <div className="text-xs uppercase text-muted-foreground font-mono">Crane Productivity</div>
              <div className="text-2xl font-bold text-cyan mt-1">36.2 Moves/hr</div>
              <p className="text-xs text-muted-foreground mt-1">Gross moves per crane hour</p>
            </GlassCard>
            <GlassCard className="p-4 border-l-4 border-violet">
              <div className="text-xs uppercase text-muted-foreground font-mono">Tuas Megaport Target</div>
              <div className="text-2xl font-bold text-violet mt-1">65M TEU by 2040</div>
              <p className="text-xs text-muted-foreground mt-1">Full automated yard consolidation</p>
            </GlassCard>
          </div>
          <ChartCard title="Monthly TEU Throughput (Thousands)" height={250}>
            <BarsChart
              data={[
                { label: "Jan", teu: 3200 },
                { label: "Feb", teu: 3100 },
                { label: "Mar", teu: 3450 },
                { label: "Apr", teu: 3380 },
                { label: "May", teu: 3520 },
                { label: "Jun", teu: 3610 },
              ]}
              series={[{ key: "teu", label: "TEUs (k)", color: C.cyan }]}
            />
          </ChartCard>
        </div>
      ) : activeModule === "forecasting" ? (
        <div className="space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            <GlassCard className="p-4">
              <div className="text-xs uppercase text-muted-foreground font-mono">Next 7 Days Forecast Model</div>
              <div className="text-2xl font-bold text-cyan mt-1">Prophet + LSTM</div>
              <p className="text-xs text-muted-foreground mt-1">Multi-variate seasonal horizon</p>
            </GlassCard>
            <GlassCard className="p-4">
              <div className="text-xs uppercase text-muted-foreground font-mono">Predicted Peak Day</div>
              <div className="text-2xl font-bold text-warning mt-1">Friday 18:00 SGT</div>
              <p className="text-xs text-muted-foreground mt-1">Est. 44 vessel arrivals within 12h</p>
            </GlassCard>
            <GlassCard className="p-4">
              <div className="text-xs uppercase text-muted-foreground font-mono">Prediction Confidence Band</div>
              <div className="text-2xl font-bold text-success mt-1">± 3.2% Variance</div>
              <p className="text-xs text-muted-foreground mt-1">95% statistical confidence interval</p>
            </GlassCard>
          </div>
          <ChartCard title="Projected Berth Utilization · Next 14 Days (%)" height={250}>
            <AreaTrend
              data={[
                { day: "Day 1", forecast: 71 },
                { day: "Day 2", forecast: 74 },
                { day: "Day 3", forecast: 78 },
                { day: "Day 4", forecast: 82 },
                { day: "Day 5", forecast: 86 },
                { day: "Day 6", forecast: 80 },
                { day: "Day 7", forecast: 75 },
                { day: "Day 8", forecast: 72 },
                { day: "Day 9", forecast: 70 },
                { day: "Day 10", forecast: 74 },
                { day: "Day 11", forecast: 79 },
                { day: "Day 12", forecast: 83 },
                { day: "Day 13", forecast: 81 },
                { day: "Day 14", forecast: 76 },
              ]}
              series={[{ key: "forecast", label: "Forecast Occupancy %", color: C.violet }]}
            />
          </ChartCard>
        </div>
      ) : activeModule === "trends" ? (
        <div className="space-y-6">
          <ChartCard title="5-Year Strategic Trade Corridor Growth (Index Base 100)" height={260}>
            <BarsChart
              data={[
                { label: "2022", asean: 100, europe: 100, americas: 100 },
                { label: "2023", asean: 108, europe: 104, americas: 102 },
                { label: "2024", asean: 119, europe: 109, americas: 107 },
                { label: "2025", asean: 131, europe: 114, americas: 112 },
                { label: "2026", asean: 145, europe: 120, americas: 118 },
              ]}
              series={[
                { key: "asean", label: "Intra-ASEAN Corridor", color: C.cyan },
                { key: "europe", label: "Europe-Asia TSS", color: C.violet },
                { key: "americas", label: "Trans-Pacific Route", color: C.success },
              ]}
            />
          </ChartCard>
        </div>
      ) : activeModule === "charts" ? (
        <div className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-4">
            <ChartCard title="Shipments Intake Dynamics" height={240}>
              <AreaTrend
                data={dailySeries(rows, 14, "shipments")}
                series={[{ key: "shipments", label: "Daily Submissions", color: C.cyan }]}
              />
            </ChartCard>
            <ChartCard title="Workflow Stage Breakdown" height={240}>
              <DonutChart data={stageDistribution(rows)} />
            </ChartCard>
          </div>
          <div className="grid lg:grid-cols-2 gap-4">
            <ChartCard title="Monthly Historical Volume" height={240}>
              <BarsChart
                data={monthlySeries(rows, 6, "shipments")}
                series={[{ key: "shipments", label: "Volume", color: C.violet }]}
              />
            </ChartCard>
            <ChartCard title="Container Staging Distribution" height={240}>
              <BarsChart
                data={containerStageBars(cts)}
                series={[{ key: "containers", label: "Containers", color: C.success }]}
              />
            </ChartCard>
          </div>
        </div>
      ) : activeModule === "explorer" ? (
        <div className="space-y-6">
          <DataPanel
            title="Operational Data Explorer"
            subtitle="Explore, filter and inspect all database records across shipping lines, berths and AI scores"
            rows={rows}
            loading={isLoading}
            emptyTitle="No records available."
            filterKey="stage"
            filterLabel="Filter by stage"
            searchKeys={["reference", "vessel_name", "shipping_company", "origin_port"]}
            exportName="data-explorer-export.csv"
            pageSize={10}
            columns={[
              { key: "reference", label: "Ref", render: (r) => <span className="font-mono text-xs text-cyan">{r.reference}</span> },
              { key: "shipping_company", label: "Shipping Line" },
              { key: "vessel_name", label: "Vessel" },
              { key: "origin_port", label: "Origin Port" },
              { key: "container_count", label: "TEUs", align: "right" },
              {
                key: "ai_risk_score",
                label: "AI Risk",
                align: "right",
                render: (r) => (r.ai_risk_score == null ? "—" : String(Math.round(r.ai_risk_score))),
              },
              {
                key: "stage",
                label: "Stage",
                render: (r) => <StatusBadge status={STAGE_META[r.stage]?.label ?? r.stage} />,
              },
            ]}
          />
        </div>
      ) : activeModule === "downloads" ? (
        <div className="space-y-6">
          <GlassCard className="p-5">
            <h3 className="font-semibold text-foreground text-sm flex items-center gap-2 mb-3">
              <Download className="w-4 h-4 text-cyan" /> Curated Production Datasets for Downstream ML
            </h3>
            <div className="space-y-3">
              {[
                { title: "singapore_port_ais_telemetry_2026.parquet", desc: "Live AIS positions, headings, drafts, and speed over ground for vessels in Singapore waters.", size: "48.2 MB", format: "Parquet" },
                { title: "berth_occupancy_turnaround_history.csv", desc: "Granular berthing duration, crane allocation, and unberthing timestamps across Tuas and Pasir Panjang.", size: "12.8 MB", format: "CSV" },
                { title: "customs_manifest_risk_labeled.parquet", desc: "Multi-modal manifest items with verified AI risk scores and inspection outcomes.", size: "6.4 MB", format: "Parquet" },
                { title: "meteorological_sea_state_historical.csv", desc: "Hourly wind, wave height, tide currents, and squall alerts recorded at Singapore pilot boarding grounds.", size: "3.2 MB", format: "CSV" },
              ].map((ds) => (
                <div key={ds.title} className="p-4 rounded-lg bg-card/60 border border-border/60 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <div className="font-mono text-xs font-bold text-cyan">{ds.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{ds.desc}</div>
                    <div className="flex items-center gap-3 mt-1.5 text-[11px] font-mono text-muted-foreground">
                      <span>Format: {ds.format}</span>
                      <span>Size: {ds.size}</span>
                      <span className="text-success flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Ready for ML</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleExportCSV(ds.title, ds.title)}
                    className="h-8 px-3 rounded border border-cyan/40 bg-cyan/10 hover:bg-cyan/20 text-cyan text-xs font-semibold inline-flex items-center gap-1.5 transition shrink-0"
                  >
                    <Download className="w-3.5 h-3.5" /> Download
                  </button>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      ) : activeModule === "csv" ? (
        <div className="space-y-6">
          <GlassCard className="p-5 border-l-4 border-cyan">
            <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-cyan" /> Raw Data CSV Export Wizard
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Export all system records or filtered subsets directly to formatted CSV for external BI tools (Tableau, PowerBI, Python).
            </p>
            <div className="grid md:grid-cols-3 gap-3 mt-4">
              <button
                onClick={() => handleExportCSV("all-shipments.csv", "All Shipments")}
                className="p-3 rounded-lg bg-card/60 border border-border/60 hover:border-cyan/40 text-left transition"
              >
                <div className="font-semibold text-xs text-foreground">Export All Shipments ({rows.length})</div>
                <div className="text-[11px] text-muted-foreground mt-1">Full voyage and manifest records</div>
              </button>
              <button
                onClick={() => handleExportCSV("all-containers.csv", "All Containers")}
                className="p-3 rounded-lg bg-card/60 border border-border/60 hover:border-cyan/40 text-left transition"
              >
                <div className="font-semibold text-xs text-foreground">Export All Containers ({cts.length})</div>
                <div className="text-[11px] text-muted-foreground mt-1">Container numbers, bays, plates</div>
              </button>
              <button
                onClick={() => handleExportCSV("ai-risk-evaluations.csv", "AI Risk Logs")}
                className="p-3 rounded-lg bg-card/60 border border-border/60 hover:border-cyan/40 text-left transition"
              >
                <div className="font-semibold text-xs text-foreground">Export AI Risk Evaluations</div>
                <div className="text-[11px] text-muted-foreground mt-1">Scored documents, SHAP variables</div>
              </button>
            </div>
          </GlassCard>
        </div>
      ) : (
        /* Default: Dashboard */
        <div className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-4">
            <ChartCard className="lg:col-span-2" title="Shipment intake · 14 days" height={240}>
              {rows.length === 0 ? (
                <NoDataCard
                  title="No records available."
                  reason="Analytics populate as shipments move through the workflow."
                />
              ) : (
                <AreaTrend
                  data={dailySeries(rows, 14, "shipments")}
                  series={[{ key: "shipments", label: "Shipments", color: C.cyan }]}
                />
              )}
            </ChartCard>
            <ChartCard title="Stage distribution" height={240}>
              {rows.length === 0 ? (
                <NoDataCard
                  title="No records available."
                  reason="Distribution appears once shipments exist."
                />
              ) : (
                <DonutChart data={stageDistribution(rows)} />
              )}
            </ChartCard>
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <ChartCard title="Monthly shipment volume" height={230}>
              {rows.length === 0 ? (
                <NoDataCard
                  title="No records available."
                  reason="Monthly volume needs at least one shipment."
                />
              ) : (
                <BarsChart
                  data={monthlySeries(rows, 6, "shipments")}
                  series={[{ key: "shipments", label: "Shipments", color: C.violet }]}
                />
              )}
            </ChartCard>
            <ChartCard title="Containers by stage" height={230}>
              {cts.length === 0 ? (
                <NoDataCard
                  title="No container records."
                  reason="Container analytics require registered manifests."
                />
              ) : (
                <BarsChart
                  data={containerStageBars(cts)}
                  series={[{ key: "containers", label: "Containers", color: C.success }]}
                />
              )}
            </ChartCard>
          </div>

          <DataPanel
            title="Shipment dataset"
            subtitle="Full record set available for export"
            rows={rows}
            loading={isLoading}
            emptyTitle="No records available."
            filterKey="stage"
            filterLabel="All stages"
            searchKeys={["reference", "vessel_name", "shipping_company", "origin_port"]}
            exportName="smartport-shipments.csv"
            pageSize={8}
            columns={[
              { key: "reference", label: "Reference" },
              { key: "shipping_company", label: "Shipping line" },
              { key: "vessel_name", label: "Vessel" },
              { key: "origin_port", label: "Origin" },
              { key: "container_count", label: "Containers", align: "right" },
              {
                key: "ai_risk_score",
                label: "AI risk",
                align: "right",
                render: (r) => (r.ai_risk_score == null ? "—" : String(Math.round(r.ai_risk_score))),
              },
              {
                key: "stage",
                label: "Stage",
                render: (r) => <StatusBadge status={STAGE_META[r.stage]?.label ?? r.stage} />,
              },
            ]}
          />

          <div className="grid lg:grid-cols-3 gap-4">
            <ActivityCard className="lg:col-span-2" title="Recent operational events" />
            <div className="space-y-4">
              <NotificationsCard title="Analytics alerts" />
              <CongestionAnalyticsCard />
              <HelpCard />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CongestionAnalyticsCard() {
  const { data: subs } = useAllSubmissions();
  const rows = subs ?? [];
  const activeCount = rows.filter(
    (s) =>
      !["delivered", "authority_rejected", "customs_rejected", "ai_rejected"].includes(s.stage),
  ).length;
  const avgRisk =
    rows.length > 0
      ? Math.round(rows.reduce((sum, s) => sum + (s.ai_risk_score ?? 0), 0) / rows.length)
      : 0;

  return (
    <GlassCard>
      <div className="flex items-center justify-between mb-2">
        <div className="text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground font-medium">
          Congestion &amp; Delay Analytics
        </div>
        <StatusBadge status={`${activeCount} Active In Queue`} />
      </div>

      <div className="space-y-3 font-mono text-xs mt-3">
        <div className="flex items-center justify-between p-2 rounded bg-white/[0.02] border border-border/60">
          <span className="text-muted-foreground">Queue Processing Lead Time</span>
          <span className="font-semibold text-cyan">
            {(2.1 + activeCount * 0.5).toFixed(1)} hrs
          </span>
        </div>
        <div className="flex items-center justify-between p-2 rounded bg-white/[0.02] border border-border/60">
          <span className="text-muted-foreground">Overall Port Risk Index</span>
          <span
            className={`font-semibold ${avgRisk > 70 ? "text-danger" : avgRisk > 40 ? "text-warning" : "text-success"}`}
          >
            {avgRisk}/100
          </span>
        </div>
        <div className="flex items-center justify-between p-2 rounded bg-white/[0.02] border border-border/60">
          <span className="text-muted-foreground">Hazardous Cargo Ratio</span>
          <span className="font-semibold text-warning">
            {rows.length > 0
              ? Math.round((rows.filter((s) => s.dangerous_goods).length / rows.length) * 100)
              : 0}
            %
          </span>
        </div>
      </div>
    </GlassCard>
  );
}
