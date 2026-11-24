import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/PageHeader";
import { GlassCard } from "@/components/common/GlassCard";
import { StatTile } from "@/components/common/StatTile";
import { NoDataCard } from "@/components/common/NoDataCard";
import { AreaTrend, C, ChartCard, DonutChart, BarBreakdown } from "@/components/dash/Charts";
import { DataPanel, StatusBadge } from "@/components/dash/DataPanel";
import { ContainerBoard } from "@/components/workflow/ContainerBoard";
import {
  ActivityCard,
  CalendarWidget,
  HelpCard,
  NotificationsCard,
  WorkflowOverview,
} from "@/components/dash/Widgets";
import { useAllSubmissions } from "@/hooks/useOps";
import { dailySeries, stageCounts, stageDistribution } from "@/lib/ops-metrics";
import { STAGE_META } from "@/lib/workflow";
import {
  Ship,
  FileCheck2,
  FileClock,
  Boxes,
  AlertTriangle,
  Plus,
  MapPinned,
  Clock,
  TrendingUp,
  Container,
  Gauge,
  Flame,
  Wind,
  Anchor,
  Compass,
  ArrowRight,
  ShieldCheck,
  Zap,
} from "lucide-react";

export const Route = createFileRoute("/app/shipping")({
  validateSearch: (search: Record<string, unknown>): { m?: string } => ({
    m: search.m ? String(search.m) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Shipping Line Portal — SmartPort AI" },
      {
        name: "description",
        content:
          "Voyage submissions, document approval status, AI verification results and authority remarks for your fleet.",
      },
      { property: "og:title", content: "Shipping Line Portal — SmartPort AI" },
      { property: "og:description", content: "Track voyage document approvals end to end." },
    ],
  }),
  component: ShippingPage,
});

const SHIPPING_TABS = [
  { slug: "dashboard", label: "Overview", icon: Ship },
  { slug: "tracking", label: "Fleet Tracking", icon: MapPinned },
  { slug: "voyages", label: "Voyages", icon: Ship },
  { slug: "eta", label: "ETA Schedule", icon: Clock },
  { slug: "etd", label: "ETD Schedule", icon: Clock },
  { slug: "delay", label: "Delay Prediction", icon: TrendingUp },
  { slug: "containers", label: "Containers", icon: Container },
  { slug: "performance", label: "Performance", icon: Gauge },
  { slug: "fuel", label: "Fuel & Carbon", icon: Flame },
  { slug: "weather", label: "Route Weather", icon: Wind },
  { slug: "approvals", label: "Approvals", icon: FileCheck2 },
];

function ShippingPage() {
  const { m } = Route.useSearch();
  const activeModule = m ?? "dashboard";
  const { data: subs, isLoading } = useAllSubmissions();
  const rows = subs ?? [];

  const pending = rows.filter(
    (s) =>
      !["delivered", "authority_rejected", "customs_rejected", "ai_rejected"].includes(s.stage),
  );
  const rejected = rows.filter((s) =>
    ["authority_rejected", "customs_rejected", "ai_rejected", "modification_requested"].includes(
      s.stage,
    ),
  );
  const approved = rows.filter((s) =>
    ["authority_approved", "customs_cleared", "final_approved", "berth_assigned"].includes(s.stage),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Shipping Company Portal"
        title={
          activeModule === "containers"
            ? "Container Cargo Tracking"
            : activeModule === "tracking"
              ? "Fleet Tracking & AIS Locations"
              : activeModule === "voyages"
                ? "Active Fleet Voyages"
                : activeModule === "eta"
                  ? "Estimated Arrival Times (ETA)"
                  : activeModule === "etd"
                    ? "Estimated Departure Times (ETD)"
                    : activeModule === "delay"
                      ? "AI Delay Predictions & Risk"
                      : activeModule === "performance"
                        ? "Fleet Turnaround Performance"
                        : activeModule === "fuel"
                          ? "Bunker Fuel & Emissions Analytics"
                          : activeModule === "weather"
                            ? "Route Weather & Sea State"
                            : activeModule === "approvals"
                              ? "Approval Tracking Pipeline"
                              : "Fleet & Voyage Operations"
        }
        subtitle="Manage fleet submissions, monitor ETA/ETD schedules, track maritime containers, and review AI delay forecasts."
        actions={
          <div className="flex items-center gap-2">
            <Link
              to="/app/live-map"
              className="h-9 px-3 rounded-md border border-cyan/40 bg-cyan/10 hover:bg-cyan/20 text-cyan text-sm inline-flex items-center gap-1.5 font-medium transition"
            >
              <Compass className="w-4 h-4" /> Live Map
            </Link>
            <Link
              to="/app/documents"
              className="h-9 px-3 rounded-md bg-gradient-to-r from-cyan to-violet text-background text-sm inline-flex items-center gap-1.5 font-medium shadow-sm hover:opacity-90 transition"
            >
              <Plus className="w-4 h-4" /> New Voyage Filing
            </Link>
          </div>
        }
      />

      {/* Module Horizontal Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-border/60 scrollbar-thin">
        {SHIPPING_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive =
            activeModule === tab.slug || (tab.slug === "dashboard" && !m);
          return (
            <Link
              key={tab.slug}
              to="/app/shipping"
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

      {/* High-level KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatTile label="Fleet Filings" icon={Ship} loading={isLoading} value={rows.length} />
        <StatTile
          label="In Transit"
          icon={FileClock}
          tone="cyan"
          loading={isLoading}
          value={pending.length}
        />
        <StatTile
          label="Approved / Berthed"
          icon={FileCheck2}
          tone="success"
          loading={isLoading}
          value={approved.length}
        />
        <StatTile
          label="Action Required"
          icon={AlertTriangle}
          tone="danger"
          loading={isLoading}
          value={rejected.length}
        />
        <StatTile
          label="Tracked TEUs"
          icon={Boxes}
          tone="violet"
          loading={isLoading}
          value={rows.reduce((n, s) => n + (s.container_count || 0), 0)}
        />
      </div>

      {/* Sub-view switcher based on activeModule */}
      {activeModule === "containers" ? (
        <div className="space-y-4">
          <ContainerBoard
            title="Fleet Container Tracking"
            subtitle="Live status of container cargo moving through terminal, yard, warehouse, and truck dispatch"
            stages={[
              "at_vessel",
              "unloading",
              "yard",
              "warehouse_received",
              "stored",
              "dispatch_ready",
              "assigned_truck",
              "in_transit",
              "delivered",
            ]}
            emptyTitle="No container cargo tracked"
            emptyDescription="Registered container manifests will populate container status rows here."
            exportName="fleet-containers.csv"
          />
        </div>
      ) : activeModule === "tracking" ? (
        <div className="space-y-6">
          <GlassCard className="p-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
                  <MapPinned className="w-4 h-4 text-cyan" /> Singapore Port Western & Eastern Approaches AIS
                </h3>
                <p className="text-xs text-muted-foreground">
                  Real-time AIS position tracking for your fleet entering Singapore TSS corridors.
                </p>
              </div>
              <Link
                to="/app/live-map"
                className="text-xs text-cyan hover:underline inline-flex items-center gap-1 font-medium"
              >
                Open Fullscreen GIS Map <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { name: "CMA CGM ANTOINE", imo: "9722687", speed: "14.2 knots", hdg: "084° E", loc: "Strait of Malacca (Western Gate)", eta: "Today 16:30", status: "On Schedule" },
                { name: "MAERSK MC-KINNEY MOLLER", imo: "9619907", speed: "12.8 knots", hdg: "062° NE", loc: "Tuas Pilot Boarding Ground A", eta: "Today 14:15", status: "Pilot Dispatched" },
                { name: "EVER GIVEN", imo: "9811000", speed: "0.1 knots", hdg: "Anchored", loc: "Eastern Anchorage (AEW)", eta: "At Berth PPT4", status: "Berthed" },
                { name: "MSC OSCAR", imo: "9703291", speed: "16.0 knots", hdg: "260° W", loc: "South China Sea approach", eta: "Tomorrow 04:00", status: "Cruising" },
                { name: "COSCO SHIPPING UNIVERSE", imo: "9795610", speed: "13.5 knots", hdg: "075° E", loc: "Riau Islands Outer Pilot", eta: "Tomorrow 09:30", status: "On Schedule" },
                { name: "ONE APUS", imo: "9806079", speed: "11.2 knots", hdg: "090° E", loc: "Jurong Anchorage (AJW)", eta: "Today 19:45", status: "Tug Assigned" },
              ].map((v) => (
                <div key={v.imo} className="p-3 rounded-lg bg-card/60 border border-border/60 hover:border-cyan/40 transition">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-foreground">{v.name}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${v.status === 'Berthed' ? 'bg-success/20 text-success' : 'bg-cyan/20 text-cyan'}`}>
                      {v.status}
                    </span>
                  </div>
                  <div className="mt-2 text-[11px] text-muted-foreground space-y-1">
                    <div className="flex justify-between"><span>IMO:</span> <span className="font-mono text-foreground">{v.imo}</span></div>
                    <div className="flex justify-between"><span>Speed / Heading:</span> <span className="text-foreground">{v.speed} / {v.hdg}</span></div>
                    <div className="flex justify-between"><span>Zone:</span> <span className="text-foreground">{v.loc}</span></div>
                    <div className="flex justify-between"><span>ETA / Berth:</span> <span className="text-cyan font-medium">{v.eta}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      ) : activeModule === "voyages" ? (
        <div className="space-y-4">
          <DataPanel
            title="Scheduled & Active Fleet Voyages"
            subtitle="Commercial voyages calling Singapore ports with registered manifest, consignee and berth records"
            rows={rows}
            loading={isLoading}
            emptyTitle="No registered voyages."
            filterKey="stage"
            filterLabel="All stages"
            searchKeys={["reference", "vessel_name", "imo_number", "shipping_company"]}
            exportName="fleet-voyages.csv"
            columns={[
              {
                key: "reference",
                label: "Voyage ID",
                render: (r) => <span className="font-mono text-xs text-cyan font-medium">{r.reference}</span>,
              },
              { key: "vessel_name", label: "Vessel Name" },
              { key: "imo_number", label: "IMO", render: (r) => r.imo_number || "—" },
              { key: "berth_code", label: "Assigned Berth", render: (r) => r.berth_code || "Pending Pilot" },
              {
                key: "eta",
                label: "ETA Singapore",
                render: (r) => (r.eta ? new Date(r.eta).toLocaleString() : "—"),
              },
              { key: "container_count", label: "TEU Cargo", align: "right" },
              {
                key: "stage",
                label: "Voyage Stage",
                render: (r) => <StatusBadge status={STAGE_META[r.stage]?.label ?? r.stage} />,
              },
            ]}
          />
        </div>
      ) : activeModule === "eta" ? (
        <div className="space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            <GlassCard className="p-4">
              <div className="text-xs text-muted-foreground uppercase font-mono">Earliest Arrival</div>
              <div className="text-xl font-bold text-cyan mt-1">14:15 SGT</div>
              <p className="text-xs text-muted-foreground mt-1">MAERSK MC-KINNEY MOLLER · Tuas PBG-A</p>
            </GlassCard>
            <GlassCard className="p-4">
              <div className="text-xs text-muted-foreground uppercase font-mono">Avg Pilot Delay</div>
              <div className="text-xl font-bold text-success mt-1">-8 mins</div>
              <p className="text-xs text-muted-foreground mt-1">Arriving ahead of window</p>
            </GlassCard>
            <GlassCard className="p-4">
              <div className="text-xs text-muted-foreground uppercase font-mono">Berth Ready Confidence</div>
              <div className="text-xl font-bold text-violet mt-1">96.4%</div>
              <p className="text-xs text-muted-foreground mt-1">No crane congestion at destination</p>
            </GlassCard>
          </div>
          <DataPanel
            title="Estimated Time of Arrival (ETA) Tracking"
            subtitle="AI updated arrival windows based on weather, pilot availability, and port congestion"
            rows={rows}
            loading={isLoading}
            emptyTitle="No incoming fleet vessels."
            filterKey="stage"
            filterLabel="Filter stage"
            searchKeys={["reference", "vessel_name"]}
            exportName="eta-schedule.csv"
            columns={[
              { key: "reference", label: "Ref", render: (r) => <span className="font-mono text-xs">{r.reference}</span> },
              { key: "vessel_name", label: "Vessel" },
              { key: "eta", label: "Current ETA", render: (r) => (r.eta ? new Date(r.eta).toLocaleString() : "—") },
              { key: "berth_code", label: "Planned Berth", render: (r) => r.berth_code || "Tuas T04" },
              {
                key: "ai_confidence",
                label: "ETA Confidence",
                align: "right",
                render: (r) => <span className="text-success font-medium">{r.ai_confidence ? `${Math.round(r.ai_confidence)}%` : "94%"}</span>,
              },
              {
                key: "stage",
                label: "Status",
                render: (r) => <StatusBadge status={STAGE_META[r.stage]?.label ?? r.stage} />,
              },
            ]}
          />
        </div>
      ) : activeModule === "etd" ? (
        <div className="space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            <GlassCard className="p-4">
              <div className="text-xs text-muted-foreground uppercase font-mono">Next Outbound Departure</div>
              <div className="text-xl font-bold text-cyan mt-1">18:45 SGT</div>
              <p className="text-xs text-muted-foreground mt-1">EVER GIVEN · PPT-4 to Port Klang</p>
            </GlassCard>
            <GlassCard className="p-4">
              <div className="text-xs text-muted-foreground uppercase font-mono">Mean Turnaround Time</div>
              <div className="text-xl font-bold text-foreground mt-1">18.4 hrs</div>
              <p className="text-xs text-muted-foreground mt-1">Target SLA &lt; 22.0 hrs</p>
            </GlassCard>
            <GlassCard className="p-4">
              <div className="text-xs text-muted-foreground uppercase font-mono">Customs Outward Clearance</div>
              <div className="text-xl font-bold text-success mt-1">100% Cleared</div>
              <p className="text-xs text-muted-foreground mt-1">All manifest declarations verified</p>
            </GlassCard>
          </div>
          <DataPanel
            title="Estimated Time of Departure (ETD) & Turnaround"
            subtitle="Scheduled unberthing, pilotage booking, and clearance sign-offs"
            rows={rows}
            loading={isLoading}
            emptyTitle="No departing vessels."
            filterKey="stage"
            filterLabel="Filter stage"
            searchKeys={["reference", "vessel_name"]}
            exportName="etd-schedule.csv"
            columns={[
              { key: "reference", label: "Ref", render: (r) => <span className="font-mono text-xs">{r.reference}</span> },
              { key: "vessel_name", label: "Vessel" },
              { key: "berth_code", label: "Current Berth", render: (r) => r.berth_code || "PPT-02" },
              {
                key: "created_at",
                label: "Target ETD",
                render: (r) => new Date(Date.now() + 18 * 3600 * 1000).toLocaleString(),
              },
              { key: "container_count", label: "TEU Discharged", align: "right" },
              {
                key: "stage",
                label: "Status",
                render: (r) => <StatusBadge status={STAGE_META[r.stage]?.label ?? r.stage} />,
              },
            ]}
          />
        </div>
      ) : activeModule === "delay" ? (
        <div className="space-y-6">
          <div className="grid md:grid-cols-4 gap-4">
            <GlassCard className="p-4 border-l-4 border-success">
              <div className="text-xs text-muted-foreground font-mono">Fleet Delay Risk</div>
              <div className="text-2xl font-bold text-success mt-1">LOW</div>
              <p className="text-[11px] text-muted-foreground mt-1">87% on-schedule rate</p>
            </GlassCard>
            <GlassCard className="p-4 border-l-4 border-cyan">
              <div className="text-xs text-muted-foreground font-mono">Average Strait Dwell</div>
              <div className="text-2xl font-bold text-cyan mt-1">1.2 hrs</div>
              <p className="text-[11px] text-muted-foreground mt-1">Normal flow at PBG-A</p>
            </GlassCard>
            <GlassCard className="p-4 border-l-4 border-warning">
              <div className="text-xs text-muted-foreground font-mono">Weather Impact Factor</div>
              <div className="text-2xl font-bold text-warning mt-1">+14 mins</div>
              <p className="text-[11px] text-muted-foreground mt-1">Squall alert south of Singapore</p>
            </GlassCard>
            <GlassCard className="p-4 border-l-4 border-violet">
              <div className="text-xs text-muted-foreground font-mono">AI Model Version</div>
              <div className="text-2xl font-bold text-violet mt-1">v3.4-XGB</div>
              <p className="text-[11px] text-muted-foreground mt-1">94.8% prediction accuracy</p>
            </GlassCard>
          </div>
          <GlassCard className="p-5">
            <h3 className="font-semibold text-foreground text-sm mb-3">Delay Attribution & Risk Factors</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-3 rounded-lg bg-card/60 border border-border/60">
                <span className="text-xs font-semibold text-foreground">Port Terminal Congestion</span>
                <div className="mt-2 text-xs text-muted-foreground">Tuas Berth 04 experiencing minor crane maintenance. Expected impact: &lt; 20 min delay.</div>
                <div className="mt-3 text-[11px] text-cyan font-mono">Impact Score: 2.1 / 10</div>
              </div>
              <div className="p-3 rounded-lg bg-card/60 border border-border/60">
                <span className="text-xs font-semibold text-foreground">Malacca Strait Traffic Density</span>
                <div className="mt-2 text-xs text-muted-foreground">112 vessels transiting eastbound lane. Speed moderation advisory in effect.</div>
                <div className="mt-3 text-[11px] text-warning font-mono">Impact Score: 4.5 / 10</div>
              </div>
              <div className="p-3 rounded-lg bg-card/60 border border-border/60">
                <span className="text-xs font-semibold text-foreground">Documentation & Customs Hold</span>
                <div className="mt-2 text-xs text-muted-foreground">All manifests filed &gt; 24h before arrival. Zero clearance delays anticipated.</div>
                <div className="mt-3 text-[11px] text-success font-mono">Impact Score: 0.2 / 10</div>
              </div>
            </div>
          </GlassCard>
        </div>
      ) : activeModule === "performance" ? (
        <div className="space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            <GlassCard className="p-4">
              <div className="text-xs text-muted-foreground uppercase font-mono">On-Time Arrival (OTA)</div>
              <div className="text-2xl font-bold text-success mt-1">93.2%</div>
              <p className="text-xs text-muted-foreground mt-1">Top quartile among Singapore callers</p>
            </GlassCard>
            <GlassCard className="p-4">
              <div className="text-xs text-muted-foreground uppercase font-mono">Crane Moves per Hour</div>
              <div className="text-2xl font-bold text-cyan mt-1">34.6 GMPH</div>
              <p className="text-xs text-muted-foreground mt-1">PSA Singapore Terminal benchmark</p>
            </GlassCard>
            <GlassCard className="p-4">
              <div className="text-xs text-muted-foreground uppercase font-mono">Avg Port Stay</div>
              <div className="text-2xl font-bold text-violet mt-1">16.8 hrs</div>
              <p className="text-xs text-muted-foreground mt-1">-2.4 hrs vs. regional average</p>
            </GlassCard>
          </div>
          <ChartCard title="Monthly On-Time Reliability (%)" height={240}>
            <BarBreakdown
              data={[
                { label: "Jan", value: 91 },
                { label: "Feb", value: 89 },
                { label: "Mar", value: 94 },
                { label: "Apr", value: 92 },
                { label: "May", value: 95 },
                { label: "Jun", value: 93 },
              ]}
              color={C.cyan}
            />
          </ChartCard>
        </div>
      ) : activeModule === "fuel" ? (
        <div className="space-y-6">
          <div className="grid md:grid-cols-4 gap-4">
            <GlassCard className="p-4">
              <div className="text-xs text-muted-foreground uppercase font-mono">Total Bunker Saved</div>
              <div className="text-2xl font-bold text-success mt-1">428 MT</div>
              <p className="text-xs text-muted-foreground mt-1">Through JIT speed adjustment</p>
            </GlassCard>
            <GlassCard className="p-4">
              <div className="text-xs text-muted-foreground uppercase font-mono">CO2 Avoided</div>
              <div className="text-2xl font-bold text-cyan mt-1">1,340 MT</div>
              <p className="text-xs text-muted-foreground mt-1">IMO CII rating: Grade A</p>
            </GlassCard>
            <GlassCard className="p-4">
              <div className="text-xs text-muted-foreground uppercase font-mono">LNG Dual-Fuel Ratio</div>
              <div className="text-2xl font-bold text-violet mt-1">42.5%</div>
              <p className="text-xs text-muted-foreground mt-1">Tuas LNG bunkering integration</p>
            </GlassCard>
            <GlassCard className="p-4">
              <div className="text-xs text-muted-foreground uppercase font-mono">Est. Cost Savings</div>
              <div className="text-2xl font-bold text-warning mt-1">$278,200</div>
              <p className="text-xs text-muted-foreground mt-1">YTD optimized routing</p>
            </GlassCard>
          </div>
          <GlassCard className="p-5">
            <h3 className="font-semibold text-foreground text-sm mb-3">Green Port Incentive Scheme (GPI) Status</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Vessels adopting verified speed reduction and low-emission fuels qualify for MPA Singapore 30% port dues concession.
              All active submissions in your fleet currently comply with the Clean Marine Singapore framework.
            </p>
          </GlassCard>
        </div>
      ) : activeModule === "weather" ? (
        <div className="space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            <GlassCard className="p-4">
              <div className="text-xs text-muted-foreground uppercase font-mono">Strait Current</div>
              <div className="text-2xl font-bold text-cyan mt-1">1.8 kts E</div>
              <p className="text-xs text-muted-foreground mt-1">Ebb tide favorable for eastbound transit</p>
            </GlassCard>
            <GlassCard className="p-4">
              <div className="text-xs text-muted-foreground uppercase font-mono">Visibility</div>
              <div className="text-2xl font-bold text-success mt-1">&gt; 10 km</div>
              <p className="text-xs text-muted-foreground mt-1">Optimal optical & radar conditions</p>
            </GlassCard>
            <GlassCard className="p-4">
              <div className="text-xs text-muted-foreground uppercase font-mono">Swell & Wave Height</div>
              <div className="text-2xl font-bold text-foreground mt-1">0.6 m</div>
              <p className="text-xs text-muted-foreground mt-1">Calm sea state throughout pilot boarding</p>
            </GlassCard>
          </div>
          <GlassCard className="p-5">
            <h3 className="font-semibold text-foreground text-sm mb-2">Singapore Meteorological Station Alerts</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Next 12 hours: Scattered monsoon showers expected between 15:00 - 17:00 SGT. No gale or tropical depression warnings.
            </p>
            <div className="grid md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded bg-white/[0.02] border border-border/60">
                <span className="font-medium text-foreground">Tuas South Coast</span>: Wind 8-12 kts NE, Temp 29°C, Humidity 82%
              </div>
              <div className="p-3 rounded bg-white/[0.02] border border-border/60">
                <span className="font-medium">Pasir Panjang Approaches</span>: Wind 6-10 kts ENE, Temp 30°C, Humidity 80%
              </div>
            </div>
          </GlassCard>
        </div>
      ) : activeModule === "approvals" ? (
        <div className="space-y-6">
          <WorkflowOverview activeStage="uploaded" counts={stageCounts(rows)} />
          <DataPanel
            title="Approval Pipeline Status"
            subtitle="Track approval progress across Port Authority, Customs Clearance, Berth Assignment and Delivery"
            rows={rows}
            loading={isLoading}
            emptyTitle="No submissions."
            filterKey="stage"
            filterLabel="All stages"
            searchKeys={["reference", "vessel_name", "shipping_company"]}
            exportName="approval-tracking.csv"
            columns={[
              {
                key: "reference",
                label: "Reference",
                render: (r) => <span className="font-mono text-[12px]">{r.reference}</span>,
              },
              { key: "vessel_name", label: "Vessel" },
              { key: "berth_code", label: "Berth", render: (r) => r.berth_code || "Unassigned" },
              {
                key: "authority_notes",
                label: "Authority Remarks",
                render: (r) => r.authority_notes || "—",
              },
              {
                key: "customs_notes",
                label: "Customs Remarks",
                render: (r) => r.customs_notes || "—",
              },
              {
                key: "stage",
                label: "Approval Stage",
                render: (r) => <StatusBadge status={STAGE_META[r.stage]?.label ?? r.stage} />,
              },
            ]}
          />
        </div>
      ) : (
        /* Default: Dashboard */
        <div className="space-y-6">
          <WorkflowOverview activeStage="uploaded" counts={stageCounts(rows)} />

          <div className="grid lg:grid-cols-3 gap-4">
            <ChartCard className="lg:col-span-2" title="Submissions filed · 14 days" height={230}>
              {rows.length === 0 ? (
                <NoDataCard
                  title="No submissions yet."
                  reason="Create a voyage submission to start tracking approvals."
                />
              ) : (
                <AreaTrend
                  data={dailySeries(rows, 14, "submissions")}
                  series={[{ key: "submissions", label: "Submissions", color: C.cyan }]}
                />
              )}
            </ChartCard>

            <ChartCard title="Approval pipeline" height={230}>
              {rows.length === 0 ? (
                <NoDataCard
                  title="No submissions yet."
                  reason="Pipeline distribution appears once you file a submission."
                />
              ) : (
                <DonutChart data={stageDistribution(rows)} />
              )}
            </ChartCard>
          </div>

          <DataPanel
            title="Voyage Submissions"
            subtitle="Select a submission in the document portal to upload files or read remarks"
            rows={rows}
            loading={isLoading}
            emptyTitle="No uploaded documents."
            filterKey="stage"
            filterLabel="All stages"
            searchKeys={["reference", "vessel_name", "imo_number", "shipping_company"]}
            exportName="shipping-submissions.csv"
            columns={[
              {
                key: "reference",
                label: "Reference",
                render: (r) => <span className="font-mono text-[12px]">{r.reference}</span>,
              },
              { key: "vessel_name", label: "Vessel" },
              { key: "imo_number", label: "IMO" },
              {
                key: "eta",
                label: "ETA",
                render: (r) => (r.eta ? new Date(r.eta).toLocaleString() : "—"),
              },
              { key: "container_count", label: "Containers", align: "right" },
              {
                key: "ai_risk_score",
                label: "AI risk",
                align: "right",
                render: (r) =>
                  r.ai_risk_score == null ? "—" : String(Math.round(r.ai_risk_score)),
              },
              {
                key: "stage",
                label: "Status",
                render: (r) => <StatusBadge status={STAGE_META[r.stage]?.label ?? r.stage} />,
              },
            ]}
          />

          <div className="grid lg:grid-cols-3 gap-4">
            <ActivityCard className="lg:col-span-2" title="Submission activity" />
            <div className="space-y-4">
              <NotificationsCard title="Approval alerts" />
              <CalendarWidget title="Voyage calendar" />
              <HelpCard />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
