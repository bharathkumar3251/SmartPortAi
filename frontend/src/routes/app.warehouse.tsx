import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/PageHeader";
import { StatTile } from "@/components/common/StatTile";
import { GlassCard } from "@/components/common/GlassCard";
import { NoDataCard } from "@/components/common/NoDataCard";
import { BarsChart, C, ChartCard, DonutChart, BarBreakdown } from "@/components/dash/Charts";
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
import { DataPanel, StatusBadge } from "@/components/dash/DataPanel";
import { useAllContainers, useAllSubmissions } from "@/hooks/useOps";
import { containerStageBars, stageCounts } from "@/lib/ops-metrics";
import type { Stage } from "@/lib/workflow";
import {
  Boxes,
  PackageCheck,
  Truck,
  Warehouse,
  ArrowDownToLine,
  ArrowUpFromLine,
  LayoutDashboard,
  Layers,
  PackageSearch,
  PackageOpen,
  Gauge,
  Flame,
  LineChart,
  TriangleAlert,
  Thermometer,
  ShieldAlert,
  CheckCircle2,
} from "lucide-react";

export const Route = createFileRoute("/app/warehouse")({
  validateSearch: (search: Record<string, unknown>): { m?: string } => ({
    m: search.m ? String(search.m) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Warehouse Operations — SmartPort AI" },
      {
        name: "description",
        content:
          "Inbound container receipt, storage allocation, live inventory and dispatch preparation for truck collection.",
      },
      { property: "og:title", content: "Warehouse Operations — SmartPort AI" },
      {
        property: "og:description",
        content: "Storage allocation, inventory and dispatch readiness inside the port warehouse.",
      },
    ],
  }),
  component: WarehousePage,
});

const WAREHOUSE_TABS = [
  { slug: "dashboard", label: "Overview", icon: LayoutDashboard },
  { slug: "capacity", label: "Storage Capacity", icon: Layers },
  { slug: "inventory", label: "Live Inventory", icon: PackageSearch },
  { slug: "incoming", label: "Incoming Receipt", icon: PackageOpen },
  { slug: "outgoing", label: "Outgoing Dispatch", icon: PackageCheck },
  { slug: "utilization", label: "Utilization Gauges", icon: Gauge },
  { slug: "heatmap", label: "Warehouse Heatmap", icon: Flame },
  { slug: "analytics", label: "Inventory Analytics", icon: LineChart },
  { slug: "alerts", label: "Warehouse Alerts", icon: TriangleAlert },
];

const QUEUE: Stage[] = ["warehouse_received"];

const ACTIONS: StageAction[] = [
  {
    label: "Prepare dispatch",
    stage: "dispatch_ready",
    action: "Dispatch prepared — pickup requested",
  },
];

function WarehousePage() {
  const { m } = Route.useSearch();
  const activeModule = m ?? "dashboard";
  const { data: subs, isLoading } = useAllSubmissions();
  const { data: containers } = useAllContainers();
  const rows = subs ?? [];
  const cts = containers ?? [];
  const inbound = cts.filter((c) => c.stage === "warehouse_received");
  const stored = cts.filter((c) => c.stage === "stored");
  const outbound = cts.filter((c) => ["dispatch_ready", "assigned_truck"].includes(c.stage));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Warehouse Manager Portal"
        title={
          activeModule === "capacity"
            ? "Storage Bay Capacity & Zoning"
            : activeModule === "inventory"
              ? "Live Container & Cargo Inventory"
              : activeModule === "incoming"
                ? "Inbound Terminal Transfers & Staging"
                : activeModule === "outgoing"
                  ? "Outbound Haulage Dispatch Queue"
                  : activeModule === "utilization"
                    ? "Warehouse Bay & Rack Utilization"
                    : activeModule === "heatmap"
                      ? "Warehouse Spatial & Density Heatmap"
                      : activeModule === "analytics"
                        ? "Dwell Time & Throughput Analytics"
                        : activeModule === "alerts"
                          ? "Environmental & Safety Alerts"
                          : "Storage, Inventory & Dispatch Operations"
        }
        subtitle="Receive unloaded containers, allocate storage, keep inventory current and release consignments for truck collection."
      />

      {/* Module Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-border/60 scrollbar-thin">
        {WAREHOUSE_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive =
            activeModule === tab.slug || (tab.slug === "dashboard" && !m);
          return (
            <Link
              key={tab.slug}
              to="/app/warehouse"
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
          label="Inbound awaiting"
          icon={ArrowDownToLine}
          loading={isLoading}
          value={inbound.length}
        />
        <StatTile label="In storage" icon={Warehouse} tone="cyan" value={stored.length} />
        <StatTile
          label="Ready to dispatch"
          icon={ArrowUpFromLine}
          tone="violet"
          value={outbound.length}
        />
        <StatTile
          label="Hazardous stored"
          icon={Boxes}
          tone="danger"
          value={stored.filter((c) => c.hazardous).length}
        />
        <StatTile
          label="Shipments at warehouse"
          icon={PackageCheck}
          tone="success"
          loading={isLoading}
          value={rows.filter((s) => s.stage === "warehouse_received").length}
        />
        <StatTile
          label="Awaiting collection"
          icon={Truck}
          tone="warning"
          loading={isLoading}
          value={rows.filter((s) => s.stage === "dispatch_ready").length}
        />
      </div>

      {/* Sub-view switcher based on activeModule */}
      {activeModule === "capacity" ? (
        <div className="space-y-6">
          <div className="grid md:grid-cols-4 gap-4">
            <GlassCard className="p-4 border-l-4 border-cyan">
              <div className="text-xs uppercase text-muted-foreground font-mono">Dry Goods Bay A-D</div>
              <div className="text-2xl font-bold text-cyan mt-1">74.2% Occupied</div>
              <p className="text-xs text-muted-foreground mt-1">1,850 / 2,500 TEU capacity</p>
            </GlassCard>
            <GlassCard className="p-4 border-l-4 border-violet">
              <div className="text-xs uppercase text-muted-foreground font-mono">Reefer Cold Chain Bay R</div>
              <div className="text-2xl font-bold text-violet mt-1">62.0% Occupied</div>
              <p className="text-xs text-muted-foreground mt-1">248 / 400 active power points</p>
            </GlassCard>
            <GlassCard className="p-4 border-l-4 border-danger">
              <div className="text-xs uppercase text-muted-foreground font-mono">HazMat Bunker Zone H</div>
              <div className="text-2xl font-bold text-danger mt-1">38.5% Occupied</div>
              <p className="text-xs text-muted-foreground mt-1">38 / 100 isolated cells</p>
            </GlassCard>
            <GlassCard className="p-4 border-l-4 border-success">
              <div className="text-xs uppercase text-muted-foreground font-mono">Bonded FTZ Enclosure</div>
              <div className="text-2xl font-bold text-success mt-1">81.0% Occupied</div>
              <p className="text-xs text-muted-foreground mt-1">Customs secured zone</p>
            </GlassCard>
          </div>
          <ChartCard title="Warehouse Zone Capacity Allocation (TEU)" height={240}>
            <BarBreakdown
              data={[
                { label: "Dry Storage A", value: 680 },
                { label: "Dry Storage B", value: 720 },
                { label: "Cold Chain R1", value: 248 },
                { label: "Bonded FTZ", value: 810 },
                { label: "HazMat Cell H", value: 38 },
                { label: "Cross-dock Stage", value: 140 },
              ]}
              color={C.cyan}
            />
          </ChartCard>
        </div>
      ) : activeModule === "inventory" ? (
        <div className="space-y-6">
          <ContainerBoard
            title="Complete Warehouse Container Inventory"
            subtitle="Search, filter and inspect all containers stored, received or staged for dispatch"
            stages={["warehouse_received", "stored", "dispatch_ready", "assigned_truck"]}
            emptyTitle="No containers in warehouse inventory."
            emptyDescription="All incoming containers from terminal unloading will be indexed here."
            exportName="warehouse-inventory.csv"
          />
        </div>
      ) : activeModule === "incoming" ? (
        <div className="space-y-6">
          <ContainerBoard
            title="Inbound Receipt & Storage Slot Allocation"
            subtitle="Verify unloaded containers from terminal and assign dedicated warehouse rack/bay coordinates"
            stages={["warehouse_received"]}
            emptyTitle="No inbound containers pending receipt."
            emptyDescription="Containers appear here once the terminal completes vessel discharge."
            exportName="warehouse-inbound.csv"
            fields={[{ key: "storage_slot", label: "Storage slot (e.g. Bay-A3-R12)", required: true }]}
            advance={{ label: "Confirm Receipt & Store", stage: "stored" }}
          />
          <SubmissionWorkspace
            stages={QUEUE}
            portal="Warehouse Inbound Staging"
            suggestions={[
              "Which consignment is oldest?",
              "Hazardous storage capacity check",
              "Next pickup window allocation",
            ]}
            emptyTitle="No incoming shipments awaiting receipt."
            emptyDescription="Shipments appear once the terminal completes unloading."
            actions={({ submission }) => (
              <StageActions
                submission={submission}
                actions={ACTIONS}
                notesLabel="Warehouse intake notes (handling / temperature)"
                hint="Assigning storage slot updates live inventory and moves shipment to stored stage."
              />
            )}
          />
        </div>
      ) : activeModule === "outgoing" ? (
        <div className="space-y-6">
          <ContainerBoard
            title="Dispatch Preparation & Truck Release"
            subtitle="Release verified stored containers and assign destination haulier details"
            stages={["stored"]}
            emptyTitle="No stored containers ready for dispatch."
            emptyDescription="Allocate storage slot before marking dispatch ready."
            exportName="warehouse-dispatch.csv"
            fields={[{ key: "destination", label: "Consignee Destination Address" }]}
            advance={{ label: "Release for Truck Pickup", stage: "dispatch_ready" }}
          />
        </div>
      ) : activeModule === "utilization" ? (
        <div className="space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            <GlassCard className="p-4">
              <div className="text-xs uppercase text-muted-foreground font-mono">Overall Warehouse Utilization</div>
              <div className="text-2xl font-bold text-cyan mt-1">71.8%</div>
              <p className="text-xs text-muted-foreground mt-1">Target threshold: 65% – 85%</p>
            </GlassCard>
            <GlassCard className="p-4">
              <div className="text-xs uppercase text-muted-foreground font-mono">Average Dwell Time</div>
              <div className="text-2xl font-bold text-success mt-1">3.2 Days</div>
              <p className="text-xs text-muted-foreground mt-1">Fast throughput (&lt; 4.0 days SLA)</p>
            </GlassCard>
            <GlassCard className="p-4">
              <div className="text-xs uppercase text-muted-foreground font-mono">Forklift & AGV Active</div>
              <div className="text-2xl font-bold text-violet mt-1">18 / 20 Units</div>
              <p className="text-xs text-muted-foreground mt-1">Zero downtime reported today</p>
            </GlassCard>
          </div>
          <ChartCard title="Storage Composition by Cargo Category" height={240}>
            <DonutChart
              data={[
                { name: "General Dry", value: Math.max(1, stored.filter((c) => !c.hazardous).length), color: C.cyan },
                { name: "Reefer / Perishables", value: 12, color: C.violet },
                { name: "IMDG Hazardous", value: Math.max(1, stored.filter((c) => c.hazardous).length), color: C.danger },
                { name: "High-Value Bonded", value: 8, color: C.success },
              ]}
            />
          </ChartCard>
        </div>
      ) : activeModule === "heatmap" ? (
        <div className="space-y-6">
          <GlassCard className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
                  <Flame className="w-4 h-4 text-warning" /> Warehouse 2D Bay Density Heatmap
                </h3>
                <p className="text-xs text-muted-foreground">Tuas Logistics Hub — Distribution Center A (6,000 sqm)</p>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-mono">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-success/40 inline-block"></span> &lt;50% Low</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-warning/50 inline-block"></span> 50-80% Optimal</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-danger/60 inline-block"></span> &gt;80% High</span>
              </div>
            </div>
            {/* Grid heatmap simulation */}
            <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
              {[
                { bay: "A-01", occ: "92%", color: "border-danger/60 bg-danger/20 text-danger" },
                { bay: "A-02", occ: "88%", color: "border-danger/60 bg-danger/20 text-danger" },
                { bay: "A-03", occ: "64%", color: "border-warning/50 bg-warning/15 text-warning" },
                { bay: "A-04", occ: "45%", color: "border-success/40 bg-success/15 text-success" },
                { bay: "B-01", occ: "78%", color: "border-warning/50 bg-warning/15 text-warning" },
                { bay: "B-02", occ: "70%", color: "border-warning/50 bg-warning/15 text-warning" },
                { bay: "B-03", occ: "85%", color: "border-danger/60 bg-danger/20 text-danger" },
                { bay: "B-04", occ: "32%", color: "border-success/40 bg-success/15 text-success" },
                { bay: "C-01", occ: "52%", color: "border-warning/50 bg-warning/15 text-warning" },
                { bay: "C-02", occ: "40%", color: "border-success/40 bg-success/15 text-success" },
                { bay: "C-03", occ: "95%", color: "border-danger/60 bg-danger/20 text-danger" },
                { bay: "C-04", occ: "82%", color: "border-danger/60 bg-danger/20 text-danger" },
                { bay: "R-01", occ: "62%", color: "border-cyan/50 bg-cyan/15 text-cyan" },
                { bay: "R-02", occ: "58%", color: "border-cyan/50 bg-cyan/15 text-cyan" },
                { bay: "H-01", occ: "38%", color: "border-danger/60 bg-danger/20 text-danger" },
                { bay: "H-02", occ: "20%", color: "border-success/40 bg-success/15 text-success" },
              ].map((b) => (
                <div key={b.bay} className={`p-3 rounded-lg border text-center transition hover:scale-105 ${b.color}`}>
                  <div className="font-mono text-xs font-bold">{b.bay}</div>
                  <div className="text-[11px] font-medium mt-1">{b.occ}</div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      ) : activeModule === "analytics" ? (
        <div className="space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            <GlassCard className="p-4">
              <div className="text-xs uppercase text-muted-foreground font-mono">Monthly Inventory Turnover</div>
              <div className="text-2xl font-bold text-cyan mt-1">8.4x</div>
              <p className="text-xs text-muted-foreground mt-1">High velocity logistics throughput</p>
            </GlassCard>
            <GlassCard className="p-4">
              <div className="text-xs uppercase text-muted-foreground font-mono">Pick-to-Ship Cycle Time</div>
              <div className="text-2xl font-bold text-success mt-1">28 mins</div>
              <p className="text-xs text-muted-foreground mt-1">Automated AGV routing enabled</p>
            </GlassCard>
            <GlassCard className="p-4">
              <div className="text-xs uppercase text-muted-foreground font-mono">Inventory Accuracy</div>
              <div className="text-2xl font-bold text-violet mt-1">99.94%</div>
              <p className="text-xs text-muted-foreground mt-1">RFID gate and barcode synced</p>
            </GlassCard>
          </div>
          <ChartCard title="Daily Warehouse Movements (TEU)" height={240}>
            <BarsChart
              data={[
                { label: "Mon", in: 120, out: 110 },
                { label: "Tue", in: 145, out: 138 },
                { label: "Wed", in: 160, out: 155 },
                { label: "Thu", in: 130, out: 125 },
                { label: "Fri", in: 180, out: 172 },
                { label: "Sat", in: 95, out: 90 },
                { label: "Sun", in: 70, out: 65 },
              ]}
              series={[
                { key: "in", label: "Inbound Received", color: C.cyan },
                { key: "out", label: "Outbound Dispatched", color: C.violet },
              ]}
            />
          </ChartCard>
        </div>
      ) : activeModule === "alerts" ? (
        <div className="space-y-6">
          <GlassCard className="p-5 border-l-4 border-warning">
            <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
              <TriangleAlert className="w-4 h-4 text-warning" /> Warehouse Environmental & Safety Telemetry
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Active telemetry from IoT temperature sensors, fire detection systems, and HazMat bay isolation sensors.
            </p>
          </GlassCard>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-card/60 border border-success/40">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                  <Thermometer className="w-3.5 h-3.5 text-cyan" /> Cold Chain Reefer R-01
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-success/20 text-success font-mono font-medium">NORMAL</span>
              </div>
              <div className="mt-2 text-xl font-bold text-foreground font-mono">-18.4 °C</div>
              <div className="text-xs text-muted-foreground mt-1">Set point: -20.0°C (Tolerance ±2°C)</div>
            </div>
            <div className="p-4 rounded-lg bg-card/60 border border-success/40">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-warning" /> HazMat Zone H Vapor Detection
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-success/20 text-success font-mono font-medium">SAFE</span>
              </div>
              <div className="mt-2 text-xl font-bold text-foreground font-mono">0.02 ppm</div>
              <div className="text-xs text-muted-foreground mt-1">VOC limit: 0.50 ppm max</div>
            </div>
            <div className="p-4 rounded-lg bg-card/60 border border-cyan/40">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                  <Warehouse className="w-3.5 h-3.5 text-cyan" /> Dry Bay B Ventilation
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan/20 text-cyan font-mono font-medium">RUNNING</span>
              </div>
              <div className="mt-2 text-xl font-bold text-foreground font-mono">68% Humidity</div>
              <div className="text-xs text-muted-foreground mt-1">Automated dehumidifier active</div>
            </div>
          </div>
        </div>
      ) : (
        /* Default: Dashboard */
        <div className="space-y-6">
          <WorkflowOverview activeStage="warehouse_received" counts={stageCounts(rows)} />

          <div className="grid lg:grid-cols-3 gap-4">
            <ChartCard className="lg:col-span-2" title="Inventory by container stage" height={230}>
              {cts.length === 0 ? (
                <NoDataCard
                  title="No warehouse inventory."
                  reason="Containers appear here once the terminal releases them."
                />
              ) : (
                <BarsChart
                  data={containerStageBars(cts)}
                  series={[{ key: "containers", label: "Containers", color: C.violet }]}
                />
              )}
            </ChartCard>
            <ChartCard title="Storage composition" height={230}>
              {stored.length === 0 ? (
                <NoDataCard
                  title="No stored containers."
                  reason="Allocate storage slots to build the composition view."
                />
              ) : (
                <DonutChart
                  data={[
                    {
                      name: "General",
                      value: stored.filter((c) => !c.hazardous).length,
                      color: C.success,
                    },
                    {
                      name: "Hazardous",
                      value: stored.filter((c) => c.hazardous).length,
                      color: C.danger,
                    },
                  ].filter((d) => d.value > 0)}
                />
              )}
            </ChartCard>
          </div>

          <ContainerBoard
            title="Inbound receipt & storage allocation"
            subtitle="Assign a storage slot to received containers"
            stages={["warehouse_received"]}
            emptyTitle="No warehouse inventory."
            emptyDescription="Containers appear here once the terminal completes unloading."
            exportName="warehouse-inbound.csv"
            fields={[{ key: "storage_slot", label: "Storage slot", required: true }]}
            advance={{ label: "Store container", stage: "stored" }}
          />

          <ContainerBoard
            title="Dispatch preparation"
            subtitle="Release stored containers for truck collection"
            stages={["stored"]}
            emptyTitle="No stored containers."
            emptyDescription="Allocate storage before preparing a dispatch."
            exportName="warehouse-dispatch.csv"
            fields={[{ key: "destination", label: "Destination" }]}
            advance={{ label: "Mark dispatch ready", stage: "dispatch_ready" }}
          />

          <SubmissionWorkspace
            stages={QUEUE}
            portal="Warehouse"
            suggestions={[
              "Which consignment is oldest?",
              "Hazardous storage capacity",
              "Next pickup window",
            ]}
            emptyTitle="No shipments at the warehouse."
            emptyDescription="Shipments appear once the terminal completes unloading."
            actions={({ submission }) => (
              <StageActions
                submission={submission}
                actions={ACTIONS}
                notesLabel="Warehouse notes (storage zone, handling)"
                hint="Preparing dispatch notifies the truck operator with a pickup request."
              />
            )}
          />

          <div className="grid lg:grid-cols-3 gap-4">
            <ActivityCard className="lg:col-span-2" title="Warehouse activity" />
            <div className="space-y-4">
              <NotificationsCard title="Warehouse alerts" />
              <CalendarWidget title="Collection calendar" />
              <HelpCard />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
