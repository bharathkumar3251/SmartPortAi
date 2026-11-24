import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/PageHeader";
import { StatTile } from "@/components/common/StatTile";
import { GlassCard } from "@/components/common/GlassCard";
import { NoDataCard } from "@/components/common/NoDataCard";
import { AreaTrend, C, ChartCard, DonutChart, BarsChart, BarBreakdown } from "@/components/dash/Charts";
import { DataPanel, StatusBadge } from "@/components/dash/DataPanel";
import {
  ActivityCard,
  CalendarWidget,
  HelpCard,
  NotificationsCard,
  WorkflowOverview,
} from "@/components/dash/Widgets";
import { SubmissionWorkspace } from "@/components/workflow/SubmissionWorkspace";
import { StageActions, type StageAction } from "@/components/workflow/StageActions";
import { ContainerBoard } from "@/components/workflow/ContainerBoard";
import { useAllContainers, useAllSubmissions } from "@/hooks/useOps";
import { dailySeries, stageDistribution, stageCounts } from "@/lib/ops-metrics";
import { STAGE_META } from "@/lib/workflow";
import type { Stage } from "@/lib/workflow";
import {
  Route as RouteIcon,
  PackageCheck,
  Timer,
  Ship,
  Boxes,
  Activity,
  LayoutDashboard,
  Workflow,
  ArrowLeftRight,
  Truck,
  GitBranch,
  Gauge,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Clock,
} from "lucide-react";

export const Route = createFileRoute("/app/logistics")({
  validateSearch: (search: Record<string, unknown>): { m?: string } => ({
    m: search.m ? String(search.m) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Logistics Control Tower — SmartPort AI" },
      {
        name: "description",
        content:
          "End-to-end shipment tracking, delivery updates and completion across the port supply chain.",
      },
      { property: "og:title", content: "Logistics Control Tower — SmartPort AI" },
      {
        property: "og:description",
        content: "Cross-mode shipment visibility from berth to final delivery.",
      },
    ],
  }),
  component: LogisticsPage,
});

const LOGISTICS_TABS = [
  { slug: "dashboard", label: "Control Tower", icon: LayoutDashboard },
  { slug: "flow", label: "Container Flow", icon: Workflow },
  { slug: "transfers", label: "Transfers", icon: ArrowLeftRight },
  { slug: "fleet", label: "Fleet Status", icon: Ship },
  { slug: "trucks", label: "Truck Status", icon: Truck },
  { slug: "timeline", label: "Shipment Timeline", icon: GitBranch },
  { slug: "performance", label: "Delivery Performance", icon: Gauge },
  { slug: "ai-recs", label: "AI Recommendations", icon: Sparkles },
];

const QUEUE: Stage[] = ["in_transit", "dispatch_ready", "delivered"];

function actionsFor(stage: Stage): StageAction[] {
  if (stage === "in_transit") {
    return [
      { label: "Complete shipment", stage: "delivered", action: "Shipment delivered and closed" },
    ];
  }
  if (stage === "dispatch_ready") {
    return [{ label: "Mark in transit", stage: "in_transit", action: "Shipment moved to transit" }];
  }
  return [];
}

function LogisticsPage() {
  const { m } = Route.useSearch();
  const activeModule = m ?? "dashboard";
  const { data: subs, isLoading } = useAllSubmissions();
  const { data: containers } = useAllContainers();
  const rows = subs ?? [];
  const cts = containers ?? [];
  const active = rows.filter(
    (s) =>
      !["delivered", "authority_rejected", "customs_rejected", "ai_rejected"].includes(s.stage),
  );
  const delivered = rows.filter((s) => s.stage === "delivered");
  const inTransitCts = cts.filter((c) => c.stage === "in_transit");

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Logistics Control Tower"
        title={
          activeModule === "flow"
            ? "Intermodal Container Flow Pipeline"
            : activeModule === "transfers"
              ? "Off-Dock & Warehouse Transfers"
              : activeModule === "fleet"
                ? "Connecting Maritime Fleet Status"
                : activeModule === "trucks"
                  ? "Haulier Fleet Telematics & GPS Live Tracks"
                  : activeModule === "timeline"
                    ? "End-to-End Shipment Milestone Timeline"
                    : activeModule === "performance"
                      ? "On-Time In-Full (OTIF) Delivery KPIs"
                      : activeModule === "ai-recs"
                        ? "AI Supply Chain Recommendations"
                        : "End-to-End Logistics Control Tower"
        }
        subtitle="Track every shipment from arrival to final delivery, monitor hand-offs across roles and close completed consignments."
      />

      {/* Module Horizontal Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-border/60 scrollbar-thin">
        {LOGISTICS_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive =
            activeModule === tab.slug || (tab.slug === "dashboard" && !m);
          return (
            <Link
              key={tab.slug}
              to="/app/logistics"
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
        <StatTile
          label="Active shipments"
          icon={Activity}
          loading={isLoading}
          value={active.length}
        />
        <StatTile
          label="In transit"
          icon={RouteIcon}
          tone="cyan"
          loading={isLoading}
          value={rows.filter((s) => s.stage === "in_transit").length}
        />
        <StatTile
          label="Delivered"
          icon={PackageCheck}
          tone="success"
          loading={isLoading}
          value={delivered.length}
        />
        <StatTile
          label="Awaiting berth"
          icon={Ship}
          tone="warning"
          loading={isLoading}
          value={rows.filter((s) => ["final_approved", "customs_cleared"].includes(s.stage)).length}
        />
        <StatTile
          label="Containers moving"
          icon={Boxes}
          tone="violet"
          value={inTransitCts.length}
        />
        <StatTile label="Total shipments" icon={Timer} loading={isLoading} value={rows.length} />
      </div>

      {/* Sub-view switcher based on activeModule */}
      {activeModule === "flow" ? (
        <div className="space-y-6">
          <GlassCard className="p-5">
            <h3 className="font-semibold text-foreground text-sm flex items-center gap-2 mb-2">
              <Workflow className="w-4 h-4 text-cyan" /> Singapore Intermodal Logistics Pipeline
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              Real-time velocity and container hand-off volumes moving across primary logistics nodes.
            </p>
            <div className="grid md:grid-cols-5 gap-3">
              {[
                { node: "Vessel Berth", count: "1,240 TEU", time: "Discharge 18h", color: "border-cyan/40 text-cyan" },
                { node: "Terminal Yard", count: "3,890 TEU", time: "Avg Dwell 1.8d", color: "border-violet/40 text-violet" },
                { node: "Terminal Gate", count: "820 TEU/day", time: "Gate Pass 4m", color: "border-warning/40 text-warning" },
                { node: "Off-Dock Warehouse", count: "1,640 TEU", time: "Storage Dwell 3.1d", color: "border-primary/40 text-foreground" },
                { node: "Final Consignee", count: "98.2% OTIF", time: "Proof of Delivery", color: "border-success/40 text-success" },
              ].map((n, i) => (
                <div key={n.node} className={`p-3 rounded-lg bg-card/60 border ${n.color} text-center`}>
                  <div className="text-[10px] uppercase font-mono text-muted-foreground">Step 0{i + 1}</div>
                  <div className="font-semibold text-xs mt-1">{n.node}</div>
                  <div className="text-sm font-bold font-mono mt-1">{n.count}</div>
                  <div className="text-[11px] text-muted-foreground mt-1">{n.time}</div>
                </div>
              ))}
            </div>
          </GlassCard>
          <ContainerBoard
            title="Complete Intermodal Cargo Flow Board"
            subtitle="Live status of all moving units across port gates, warehouses, and road transit"
            stages={["unloading", "yard", "warehouse_received", "stored", "dispatch_ready", "assigned_truck", "in_transit", "delivered"]}
            emptyTitle="No cargo flowing."
            emptyDescription="Containers appear here once operations commence."
            exportName="intermodal-cargo-flow.csv"
          />
        </div>
      ) : activeModule === "transfers" ? (
        <div className="space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            <GlassCard className="p-4 border-l-4 border-cyan">
              <div className="text-xs uppercase text-muted-foreground font-mono">Terminal to Warehouse</div>
              <div className="text-2xl font-bold text-cyan mt-1">42 Transfers Today</div>
              <p className="text-xs text-muted-foreground mt-1">Direct port corridor shuttle</p>
            </GlassCard>
            <GlassCard className="p-4 border-l-4 border-violet">
              <div className="text-xs uppercase text-muted-foreground font-mono">Cross-Dock Velocity</div>
              <div className="text-2xl font-bold text-violet mt-1">2.1 Hours</div>
              <p className="text-xs text-muted-foreground mt-1">Unload to outbound prime mover</p>
            </GlassCard>
            <GlassCard className="p-4 border-l-4 border-success">
              <div className="text-xs uppercase text-muted-foreground font-mono">Transfer Discrepancies</div>
              <div className="text-2xl font-bold text-success mt-1">0 Reported</div>
              <p className="text-xs text-muted-foreground mt-1">100% electronic seal verification</p>
            </GlassCard>
          </div>
          <DataPanel
            title="Active Facility-to-Facility Transfers"
            subtitle="Scheduled inter-terminal transfers between Pasir Panjang, Tuas, and Jurong Logistics Parks"
            rows={rows.slice(0, 6)}
            loading={isLoading}
            emptyTitle="No transfers pending."
            searchKeys={["reference", "vessel_name"]}
            exportName="warehouse-transfers.csv"
            columns={[
              { key: "reference", label: "Transfer Ref", render: (r) => <span className="font-mono text-xs text-cyan font-bold">{r.reference}</span> },
              { key: "vessel_name", label: "Source Vessel / Berth", render: (r) => `${r.vessel_name} (${r.berth_code || 'Tuas T01'})` },
              { key: "shipping_company", label: "Operator" },
              { key: "container_count", label: "TEU Batch", align: "right" },
              {
                key: "stage",
                label: "Transfer Status",
                render: (r) => <StatusBadge status={STAGE_META[r.stage]?.label ?? r.stage} />,
              },
            ]}
          />
        </div>
      ) : activeModule === "fleet" ? (
        <div className="space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            <GlassCard className="p-4">
              <div className="text-xs uppercase text-muted-foreground font-mono">Total Commercial Callers</div>
              <div className="text-2xl font-bold text-cyan mt-1">{rows.length} Vessels</div>
              <p className="text-xs text-muted-foreground mt-1">Carriers connected to logistics tower</p>
            </GlassCard>
            <GlassCard className="p-4">
              <div className="text-xs uppercase text-muted-foreground font-mono">Feeder Connections</div>
              <div className="text-2xl font-bold text-violet mt-1">18 Regional Feeders</div>
              <p className="text-xs text-muted-foreground mt-1">Connecting Indonesia / Malaysia / Thailand</p>
            </GlassCard>
            <GlassCard className="p-4">
              <div className="text-xs uppercase text-muted-foreground font-mono">Barge Shuttle Capacity</div>
              <div className="text-2xl font-bold text-success mt-1">450 TEU / Trip</div>
              <p className="text-xs text-muted-foreground mt-1">Intra-Singapore port waters shuttle</p>
            </GlassCard>
          </div>
          <DataPanel
            title="Connected Maritime Fleet Overview"
            subtitle="Vessels with logistics cargo allocations and discharge schedules"
            rows={rows}
            loading={isLoading}
            emptyTitle="No fleet records."
            searchKeys={["reference", "vessel_name", "shipping_company"]}
            exportName="logistics-fleet.csv"
            columns={[
              { key: "reference", label: "Voyage", render: (r) => <span className="font-mono text-xs text-cyan font-semibold">{r.reference}</span> },
              { key: "vessel_name", label: "Vessel Name" },
              { key: "shipping_company", label: "Shipping Line" },
              { key: "eta", label: "ETA Singapore", render: (r) => r.eta ? new Date(r.eta).toLocaleString() : "—" },
              { key: "container_count", label: "Allocated Cargo", align: "right" },
              {
                key: "stage",
                label: "Port Stage",
                render: (r) => <StatusBadge status={STAGE_META[r.stage]?.label ?? r.stage} />,
              },
            ]}
          />
        </div>
      ) : activeModule === "trucks" ? (
        <div className="space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            <GlassCard className="p-4 border-l-4 border-cyan">
              <div className="text-xs uppercase text-muted-foreground font-mono">Active Prime Movers</div>
              <div className="text-2xl font-bold text-cyan mt-1">{inTransitCts.length > 0 ? inTransitCts.length : 14} Units</div>
              <p className="text-xs text-muted-foreground mt-1">Transmitting live GPS telematics</p>
            </GlassCard>
            <GlassCard className="p-4 border-l-4 border-success">
              <div className="text-xs uppercase text-muted-foreground font-mono">Average Delivery Transit</div>
              <div className="text-2xl font-bold text-success mt-1">42 Minutes</div>
              <p className="text-xs text-muted-foreground mt-1">AYE / PIE highway traffic normal</p>
            </GlassCard>
            <GlassCard className="p-4 border-l-4 border-violet">
              <div className="text-xs uppercase text-muted-foreground font-mono">Fleet Geofence Compliance</div>
              <div className="text-2xl font-bold text-violet mt-1">100%</div>
              <p className="text-xs text-muted-foreground mt-1">Zero unauthorized route deviations</p>
            </GlassCard>
          </div>
          <GlassCard className="p-5">
            <h3 className="font-semibold text-foreground text-sm mb-3">Live Haulier Truck Telematics Feed</h3>
            <div className="grid md:grid-cols-2 gap-3 text-xs font-mono">
              {[
                { plate: "SLB 8821 X", driver: "Tan Wei Meng", route: "Tuas Port -> Jurong West DC", speed: "58 km/h", eta: "15 mins" },
                { plate: "SGB 4432 Y", driver: "Ahmad Bin Salleh", route: "PPT -> Woodlands Logistics Park", speed: "64 km/h", eta: "28 mins" },
                { plate: "SKK 9910 P", driver: "K. Rajan", route: "Tuas Port -> Changi FTZ", speed: "70 km/h", eta: "35 mins" },
                { plate: "SLF 1209 D", driver: "Lee Boon Heng", route: "Tuas Port -> Pioneer Bay", speed: "45 km/h", eta: "10 mins" },
              ].map((t) => (
                <div key={t.plate} className="p-3 rounded-lg bg-card/60 border border-border/60">
                  <div className="flex justify-between items-center font-bold text-foreground">
                    <span className="text-cyan">{t.plate}</span>
                    <span className="text-success font-normal">{t.speed}</span>
                  </div>
                  <div className="text-muted-foreground mt-1">Driver: {t.driver}</div>
                  <div className="text-foreground mt-1">Route: {t.route}</div>
                  <div className="text-cyan font-bold mt-1">Est. Arrival: {t.eta}</div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      ) : activeModule === "timeline" ? (
        <div className="space-y-6">
          <WorkflowOverview activeStage="in_transit" counts={stageCounts(rows)} />
          <GlassCard className="p-5">
            <h3 className="font-semibold text-foreground text-sm mb-3">Master Shipment Lifecycle Milestone</h3>
            <div className="space-y-4">
              {[
                { stage: "Voyage Filing & Declaration", time: "T-48h", desc: "Manifest registered with MPA & Singapore Customs TradeNet", done: true },
                { stage: "Customs & Port Pre-Clearance", time: "T-24h", desc: "AI document anomaly audit completed with zero flags", done: true },
                { stage: "Vessel Berthing & Discharge", time: "T-0h", desc: "Container quay crane discharge to automated terminal yard", done: true },
                { stage: "Warehouse Staging & Cross-Dock", time: "T+6h", desc: "Storage bay allocated and pickup order prepared", done: true },
                { stage: "Haulier In-Transit Dispatch", time: "T+10h", desc: "Container loaded onto prime mover SLB 8821 X with electronic EIR", done: true },
                { stage: "Final Proof of Delivery (POD)", time: "T+12h", desc: "Digital consignee signature & container seal verification", done: false },
              ].map((s, i) => (
                <div key={s.stage} className="flex items-start gap-4 text-xs">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold shrink-0 ${s.done ? 'bg-success text-background' : 'bg-muted text-muted-foreground'}`}>
                    {s.done ? "✓" : i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between font-semibold text-foreground">
                      <span>{s.stage}</span>
                      <span className="font-mono text-muted-foreground">{s.time}</span>
                    </div>
                    <div className="text-muted-foreground mt-0.5">{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      ) : activeModule === "performance" ? (
        <div className="space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            <GlassCard className="p-4">
              <div className="text-xs uppercase text-muted-foreground font-mono">On-Time In-Full (OTIF)</div>
              <div className="text-2xl font-bold text-success mt-1">98.4%</div>
              <p className="text-xs text-muted-foreground mt-1">Exceeding enterprise SLA benchmark of 95%</p>
            </GlassCard>
            <GlassCard className="p-4">
              <div className="text-xs uppercase text-muted-foreground font-mono">End-to-End Cycle Time</div>
              <div className="text-2xl font-bold text-cyan mt-1">21.5 Hours</div>
              <p className="text-xs text-muted-foreground mt-1">Vessel arrival to consignee delivery</p>
            </GlassCard>
            <GlassCard className="p-4">
              <div className="text-xs uppercase text-muted-foreground font-mono">Total Completed Deliveries</div>
              <div className="text-2xl font-bold text-violet mt-1">{delivered.length} Shipments</div>
              <p className="text-xs text-muted-foreground mt-1">Successfully closed consignments</p>
            </GlassCard>
          </div>
          <ChartCard title="Weekly Delivery Performance & SLA Reliability" height={240}>
            <BarBreakdown
              data={[
                { label: "Week 1", value: 96 },
                { label: "Week 2", value: 98 },
                { label: "Week 3", value: 97 },
                { label: "Week 4", value: 99 },
              ]}
              color={C.success}
            />
          </ChartCard>
        </div>
      ) : activeModule === "ai-recs" ? (
        <div className="space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            <GlassCard className="p-5 border-l-4 border-cyan">
              <div className="flex items-center gap-2 font-semibold text-xs text-foreground">
                <Sparkles className="w-4 h-4 text-cyan" /> Batch Consolidation Advisory
              </div>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                6 inbound containers from CMA CGM ANTOINE share the same Jurong Industrial Park destination.
                Dispatching dual-trailer hauliers can reduce trip overhead by 32%.
              </p>
              <div className="mt-3 text-[11px] text-cyan font-mono font-medium">Potential Fuel Savings: $410</div>
            </GlassCard>
            <GlassCard className="p-5 border-l-4 border-warning">
              <div className="flex items-center gap-2 font-semibold text-xs text-foreground">
                <Clock className="w-4 h-4 text-warning" /> Peak Hour Gate Avoidance
              </div>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                Pasir Panjang Gate 5 experiences bottleneck surges between 16:30 and 17:30.
                Advise shifting 4 upcoming TAS appointments to 15:45 window.
              </p>
              <div className="mt-3 text-[11px] text-warning font-mono font-medium">Est. Wait Reduction: 22 mins</div>
            </GlassCard>
            <GlassCard className="p-5 border-l-4 border-success">
              <div className="flex items-center gap-2 font-semibold text-xs text-foreground">
                <CheckCircle2 className="w-4 h-4 text-success" /> Pre-Clearance Fast-Track
              </div>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                Electronic permits for MAERSK MC-KINNEY MOLLER fully verified.
                Containers can bypass intermediate off-dock staging for direct highway haulage.
              </p>
              <div className="mt-3 text-[11px] text-success font-mono font-medium">Throughput Acceleration: +4.2 hrs</div>
            </GlassCard>
          </div>
        </div>
      ) : (
        /* Default: Dashboard */
        <div className="space-y-6">
          <WorkflowOverview activeStage="in_transit" counts={stageCounts(rows)} />

          <div className="grid lg:grid-cols-3 gap-4">
            <ChartCard className="lg:col-span-2" title="Shipment intake · 14 days" height={230}>
              {rows.length === 0 ? (
                <NoDataCard
                  title="No shipments recorded."
                  reason="Intake volume is charted from submissions created in the platform."
                />
              ) : (
                <AreaTrend
                  data={dailySeries(rows, 14, "shipments")}
                  series={[{ key: "shipments", label: "Shipments", color: C.cyan }]}
                />
              )}
            </ChartCard>
            <ChartCard title="Pipeline distribution" height={230}>
              {rows.length === 0 ? (
                <NoDataCard
                  title="No shipments recorded."
                  reason="Distribution appears once shipments exist."
                />
              ) : (
                <DonutChart data={stageDistribution(rows)} />
              )}
            </ChartCard>
          </div>

          <ContainerBoard
            title="Delivery tracking"
            subtitle="Confirm final delivery for containers in transit"
            stages={["in_transit"]}
            emptyTitle="No containers in transit."
            emptyDescription="Containers appear here once a truck operator starts a trip."
            exportName="logistics-transit.csv"
            fields={[
              { key: "destination", label: "Destination" },
              { key: "delivered_at", label: "Delivered at", type: "datetime-local" },
            ]}
            advance={{ label: "Confirm delivery", stage: "delivered" }}
          />

          <SubmissionWorkspace
            stages={QUEUE}
            portal="Logistics"
            suggestions={[
              "Which shipments are delayed?",
              "Hand-off bottlenecks",
              "Delivery performance today",
            ]}
            emptyTitle="No shipments to track."
            emptyDescription="Shipments arrive here once the truck operator dispatches a consignment."
            actions={({ submission }) => (
              <StageActions
                submission={submission}
                actions={actionsFor(submission.stage)}
                notesLabel="Delivery notes (consignee, POD reference)"
                hint="Completing a shipment closes the workflow and archives the timeline."
              />
            )}
          />

          <div className="grid lg:grid-cols-3 gap-4">
            <ActivityCard className="lg:col-span-2" title="Hand-off activity" />
            <div className="space-y-4">
              <NotificationsCard title="Logistics alerts" />
              <CalendarWidget title="Delivery calendar" />
              <HelpCard />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
